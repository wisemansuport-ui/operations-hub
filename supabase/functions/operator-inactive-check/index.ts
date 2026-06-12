// Verifica metas em andamento cujo operador não envia nova remessa há mais de 2h.
// Envia push + notificação in-app aos admins do workspace ("operador está sumido").
//
// Para evitar spam, marca `lastInactiveAlertAt` no documento da meta e só
// re-alerta a cada 2h.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIREBASE_PROJECT = 'nytzer-vision';
const FIREBASE_API_KEY = 'AIzaSyDiiKqZWL3X880z1Lcy5_QGXgjSaOHUdhA';

// URL do notify — tenta env var primeiro, fallback para o domínio de produção
const NOTIFY_URL = (Deno.env.get('NOTIFY_URL') || 'https://operations-hub-main.vercel.app') + '/api/notify';

const DEFAULT_INACTIVE_MS = 120 * 60 * 1000; // 120min padrão (alinhado com SettingsModal)
const MIN_INACTIVE_MS = 15 * 60 * 1000;       // 15 min mínimo
const MAX_INACTIVE_MS = 12 * 60 * 60 * 1000;  // 12h máximo

function fsValue(v: any): any {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fsValue);
  if ('mapValue' in v) {
    const out: any = {};
    const fields = v.mapValue.fields || {};
    for (const k in fields) out[k] = fsValue(fields[k]);
    return out;
  }
  return null;
}

async function fetchCollection(name: string): Promise<any[]> {
  const docs: any[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/${name}`
    );
    url.searchParams.set('key', FIREBASE_API_KEY);
    url.searchParams.set('pageSize', '300');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Firestore ${name} ${res.status}: ${await res.text()}`);
    const json = await res.json();
    for (const d of json.documents || []) {
      const obj: any = { id: d.name.split('/').pop() };
      for (const k in d.fields || {}) obj[k] = fsValue(d.fields[k]);
      docs.push(obj);
    }
    pageToken = json.nextPageToken;
  } while (pageToken);
  return docs;
}

async function patchMetaAlert(metaId: string, ts: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/metas/${metaId}?key=${FIREBASE_API_KEY}&updateMask.fieldPaths=lastInactiveAlertAt`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: { lastInactiveAlertAt: { stringValue: ts } },
    }),
  });
  if (!res.ok) {
    console.error(`[patchMetaAlert] Failed for meta ${metaId}: ${res.status} ${await res.text()}`);
  }
}

function fmtHrs(ms: number) {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h <= 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, '0')}`;
}

function capitalize(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    console.log(`[operator-inactive-check] Starting check... NOTIFY_URL=${NOTIFY_URL}`);

    const [users, metas] = await Promise.all([
      fetchCollection('users'),
      fetchCollection('metas'),
    ]);

    console.log(`[operator-inactive-check] Loaded ${users.length} users, ${metas.length} metas`);

    const usersByName: Record<string, any> = {};
    for (const u of users) usersByName[u.username] = u;

    const now = Date.now();
    const results: any[] = [];
    const skipped: any[] = [];

    for (const meta of metas) {
      if (!meta.operador) continue;
      if (meta.status === 'fechada' || meta.status === 'lixeira') continue;
      if (meta.isAdminMeta) continue;

      const remessas: any[] = meta.remessas || [];
      // Última atividade = max(data da última remessa, createdAt)
      let lastActivity = 0;
      for (const r of remessas) {
        const t = r.data ? new Date(r.data).getTime() : 0;
        if (t > lastActivity) lastActivity = t;
      }
      const createdAt = meta.createdAt ? new Date(meta.createdAt).getTime() : 0;
      if (createdAt > lastActivity) lastActivity = createdAt;
      if (!lastActivity) {
        skipped.push({ meta: meta.id, reason: 'no lastActivity' });
        continue;
      }

      const elapsed = now - lastActivity;

      // Descobre admin(s) do workspace do operador
      const operator = usersByName[meta.operador];
      if (!operator) {
        skipped.push({ meta: meta.id, reason: `operator "${meta.operador}" not found in users collection` });
        continue;
      }
      const adminUsername = operator.affiliatedTo || (operator.role === 'ADMIN' ? operator.username : null);
      if (!adminUsername) {
        skipped.push({ meta: meta.id, reason: `no affiliatedTo/admin for operator "${meta.operador}"` });
        continue;
      }

      // Threshold por workspace (config no doc do admin), com clamp.
      const admin = usersByName[adminUsername];
      const raw = Number(admin?.inactiveThresholdMinutes);
      const thresholdMs = Number.isFinite(raw) && raw > 0
        ? Math.min(Math.max(raw * 60_000, MIN_INACTIVE_MS), MAX_INACTIVE_MS)
        : DEFAULT_INACTIVE_MS;

      const thresholdMin = Math.round(thresholdMs / 60_000);
      const elapsedStr = fmtHrs(elapsed);

      if (elapsed < thresholdMs) {
        skipped.push({
          meta: meta.id,
          operator: meta.operador,
          elapsed: elapsedStr,
          threshold: `${thresholdMin}min`,
          reason: 'not yet inactive'
        });
        continue;
      }

      // Anti-spam: só re-alertar a cada N (mesmo threshold do workspace)
      const lastAlert = meta.lastInactiveAlertAt ? new Date(meta.lastInactiveAlertAt).getTime() : 0;
      if (lastAlert && now - lastAlert < thresholdMs) {
        skipped.push({
          meta: meta.id,
          operator: meta.operador,
          reason: 'anti-spam',
          lastAlert: meta.lastInactiveAlertAt,
          nextAlertIn: fmtHrs(thresholdMs - (now - lastAlert))
        });
        continue;
      }

      const opName = capitalize(String(operator.displayName || operator.username));
      const metaName = meta.nome || meta.modelo || 'meta';

      const title = '⚠️ Operador sumido';
      const body = `${opName} está há ${elapsedStr} sem registrar remessa na meta "${metaName}". Verifique o que está acontecendo!`;

      console.log(`[operator-inactive-check] ALERTING → operator=${meta.operador}, elapsed=${elapsedStr}, admin=${adminUsername}, meta=${meta.id}`);

      // ── 1. Push notification (OneSignal) ──
      let pushResult: any = null;
      try {
        const pushRes = await fetch(NOTIFY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body, targets: [adminUsername] }),
        });
        const pushJson = await pushRes.json().catch(() => ({}));
        pushResult = { status: pushRes.status, ok: pushRes.ok, response: pushJson };
        if (!pushRes.ok) {
          console.error(`[operator-inactive-check] Push FAILED (${pushRes.status}) for meta ${meta.id}:`, JSON.stringify(pushJson));
        } else {
          console.log(`[operator-inactive-check] Push OK ✅ id=${pushJson.id}, recipients=${pushJson.recipients}`);
        }
      } catch (e) {
        pushResult = { error: String(e) };
        console.error(`[operator-inactive-check] Push exception for meta ${meta.id}:`, e);
      }

      // ── 2. In-app notification (sino) ──
      try {
        const fsUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/notifications?key=${FIREBASE_API_KEY}`;
        const fsRes = await fetch(fsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              title: { stringValue: title },
              message: { stringValue: body },
              type: { stringValue: 'warning' },
              read: { booleanValue: false },
              timestamp: { stringValue: new Date().toISOString() },
              targetUser: { stringValue: adminUsername },
              targetRole: { stringValue: 'ADMIN' },
            },
          }),
        });
        if (!fsRes.ok) {
          console.error(`[firestore-notif] FAILED for meta ${meta.id}: ${fsRes.status} ${await fsRes.text()}`);
        } else {
          console.log(`[firestore-notif] In-app notification saved ✅`);
        }
      } catch (e) {
        console.error('[firestore-notif] Exception for meta', meta.id, e);
      }

      await patchMetaAlert(meta.id, new Date().toISOString());

      results.push({
        meta: meta.id,
        operator: meta.operador,
        admin: adminUsername,
        elapsedStr,
        threshold: `${thresholdMin}min`,
        push: pushResult,
      });
    }

    console.log(`[operator-inactive-check] ✅ Done. Alerted: ${results.length} | Skipped: ${skipped.length}`);

    return new Response(JSON.stringify({ count: results.length, results, skipped }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[operator-inactive-check] FATAL ERROR:', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
