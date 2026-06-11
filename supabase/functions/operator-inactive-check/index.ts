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
const NOTIFY_URL = 'https://www.nytzervision.com/api/notify';

const INACTIVE_MS = 2 * 60 * 60 * 1000; // 2h

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
  await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: { lastInactiveAlertAt: { stringValue: ts } },
    }),
  });
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
    const [users, metas] = await Promise.all([
      fetchCollection('users'),
      fetchCollection('metas'),
    ]);

    const usersByName: Record<string, any> = {};
    for (const u of users) usersByName[u.username] = u;

    const now = Date.now();
    const results: any[] = [];

    for (const meta of metas) {
      if (!meta.operador) continue;
      if (meta.status === 'fechada' || meta.status === 'lixeira') continue;
      if (meta.isAdminMeta) continue; // metas operadas pelo próprio admin não contam

      const remessas: any[] = meta.remessas || [];
      // Última atividade = max(data da última remessa, createdAt)
      let lastActivity = 0;
      for (const r of remessas) {
        const t = r.data ? new Date(r.data).getTime() : 0;
        if (t > lastActivity) lastActivity = t;
      }
      const createdAt = meta.createdAt ? new Date(meta.createdAt).getTime() : 0;
      if (createdAt > lastActivity) lastActivity = createdAt;
      if (!lastActivity) continue;

      const elapsed = now - lastActivity;
      if (elapsed < INACTIVE_MS) continue;

      // Anti-spam: só re-alertar a cada 2h
      const lastAlert = meta.lastInactiveAlertAt ? new Date(meta.lastInactiveAlertAt).getTime() : 0;
      if (lastAlert && now - lastAlert < INACTIVE_MS) continue;

      // Descobre admin(s) do workspace do operador
      const operator = usersByName[meta.operador];
      if (!operator) continue;
      const adminUsername = operator.affiliatedTo || (operator.role === 'ADMIN' ? operator.username : null);
      if (!adminUsername) continue;

      const opName = capitalize(String(operator.displayName || operator.username));
      const elapsedStr = fmtHrs(elapsed);
      const metaName = meta.nome || meta.modelo || 'meta';

      const title = 'Operador sumido 👀';
      const body = `${opName} está há ${elapsedStr} sem registrar remessa na meta "${metaName}". Cola lá e vê por onde anda!`;

      try {
        const r = await fetch(NOTIFY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body, targets: [adminUsername] }),
        });
        const j = await r.json().catch(() => ({}));
        results.push({ meta: meta.id, operator: meta.operador, admin: adminUsername, elapsedStr, status: r.status, response: j });
      } catch (e) {
        results.push({ meta: meta.id, error: String(e) });
      }

      // In-app notification (sino)
      try {
        const fsUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/notifications?key=${FIREBASE_API_KEY}`;
        await fetch(fsUrl, {
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
      } catch (e) {
        console.error('[firestore-notif]', meta.id, e);
      }

      await patchMetaAlert(meta.id, new Date().toISOString());
    }

    return new Response(JSON.stringify({ count: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[operator-inactive-check]', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
