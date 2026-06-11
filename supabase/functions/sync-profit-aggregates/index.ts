// Lê Firestore uma única vez e calcula os lucros (diário, semanal, mensal,
// 7d, 30d) por admin, gravando o resultado em public.profit_aggregates.
// Pensado para rodar via cron (a cada 30–60min) — assim a função
// send-profit-summary não precisa mais bater no Firestore em todo disparo.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIREBASE_PROJECT = 'nytzer-vision';
const FIREBASE_API_KEY = 'AIzaSyDiiKqZWL3X880z1Lcy5_QGXgjSaOHUdhA';

type Period = 'daily' | 'weekly' | 'monthly' | '7d' | '30d';
const ALL_PERIODS: Period[] = ['daily', 'weekly', 'monthly', '7d', '30d'];

function getPeriodStart(period: Period): number {
  const now = new Date();
  if (period === '7d') return now.getTime() - 7 * 24 * 60 * 60 * 1000;
  if (period === '30d') return now.getTime() - 30 * 24 * 60 * 60 * 1000;
  const local = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();
  let startLocalMs: number;
  if (period === 'daily') startLocalMs = Date.UTC(y, m, d);
  else if (period === 'weekly') {
    const dow = local.getUTCDay();
    startLocalMs = Date.UTC(y, m, d - dow);
  } else startLocalMs = Date.UTC(y, m, 1);
  return startLocalMs + 3 * 60 * 60 * 1000;
}

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

async function fetchCollection(name: string, opts: { optional?: boolean; retries?: number } = {}): Promise<any[]> {
  const docs: any[] = [];
  let pageToken: string | undefined;
  const maxRetries = opts.retries ?? 4;
  try {
    do {
      const url = new URL(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/${name}`
      );
      url.searchParams.set('key', FIREBASE_API_KEY);
      url.searchParams.set('pageSize', '300');
      if (pageToken) url.searchParams.set('pageToken', pageToken);

      let res: Response | null = null;
      let lastTxt = '';
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        res = await fetch(url.toString());
        if (res.ok) break;
        lastTxt = await res.text();
        if (res.status === 429 || res.status >= 500) {
          await new Promise((r) => setTimeout(r, 750 * Math.pow(2, attempt)));
          continue;
        }
        break;
      }
      if (!res || !res.ok) {
        if (opts.optional) {
          console.warn(`[fetchCollection:${name}] ${res?.status} — vazio. ${lastTxt.slice(0, 200)}`);
          return docs;
        }
        throw new Error(`Firestore ${name} ${res?.status}: ${lastTxt}`);
      }
      const json = await res.json();
      for (const d of json.documents || []) {
        const obj: any = { id: d.name.split('/').pop() };
        for (const k in d.fields || {}) obj[k] = fsValue(d.fields[k]);
        docs.push(obj);
      }
      pageToken = json.nextPageToken;
    } while (pageToken);
  } catch (e) {
    if (opts.optional) {
      console.warn(`[fetchCollection:${name}] erro:`, e);
      return docs;
    }
    throw e;
  }
  return docs;
}

function capitalize(s: string) {
  return !s ? s : s.charAt(0).toUpperCase() + s.slice(1);
}

async function computeForPeriod(period: Period, users: any[], metas: any[], costs: any[]) {
  const startMs = getPeriodStart(period);
  const admins = users.filter((u: any) => u.role === 'ADMIN');

  const workspaceOfAdmin: Record<string, Set<string>> = {};
  for (const a of admins) {
    const set = new Set<string>([a.username]);
    for (const u of users) if (u.affiliatedTo === a.username) set.add(u.username);
    workspaceOfAdmin[a.username] = set;
  }

  const profitByAdmin = new Map<string, number>();
  for (const a of admins) profitByAdmin.set(a.username, 0);

  for (const meta of metas) {
    if (meta.status !== 'fechada') continue;
    const owner = meta.operador;
    if (!owner) continue;

    const remessas: any[] = meta.remessas || [];
    const sal = Number(meta.salarioOperador || 0);
    const pagOp = Number(meta.pagamentoOperador || 0);
    const totalContasMeta = remessas.reduce((acc: number, r: any) => acc + Number(r.contas || 0), 0);

    for (const r of remessas) {
      const ts = r.data ? new Date(r.data).getTime() : new Date(meta.createdAt).getTime();
      if (!ts || ts < startMs) continue;

      const dep = Number(r.deposito || 0);
      const saq = Number(r.saque || 0);
      const originalRc = Number(r.contas || 0);
      let normais = Number(r.contasNormais || 0);
      let baixas = Number(r.contasBaixas || 0);
      if (meta.modelo === 'Recarga') { normais = 0; baixas = 0; }
      if (r.naoContabilizarSalario) { normais = 0; baixas = 0; }

      const prop = totalContasMeta > 0
        ? originalRc / totalContasMeta
        : remessas.length > 0 ? 1 / remessas.length : 1;

      const remSal = sal * prop;
      let remAutoSal = 0;
      if (!meta.isAdminMeta && !r.naoContabilizarSalario) {
        if (meta.modelo === 'Recarga') remAutoSal = pagOp * prop;
        else remAutoSal = normais * 2 + baixas * 1;
      }

      const contribution = saq - dep + remSal - remAutoSal;
      for (const a of admins) {
        if (workspaceOfAdmin[a.username].has(owner)) {
          profitByAdmin.set(a.username, (profitByAdmin.get(a.username) || 0) + contribution);
        }
      }
    }
  }

  for (const cost of costs) {
    const costDate = cost.date
      ? new Date(cost.date + 'T12:00:00').getTime()
      : cost.createdAt ? new Date(cost.createdAt).getTime() : 0;
    if (!costDate || costDate < startMs) continue;
    const amt = Number(cost.amount || 0);
    const costOp = cost.operador;
    for (const a of admins) {
      if (!costOp) continue;
      if (workspaceOfAdmin[a.username].has(costOp)) {
        profitByAdmin.set(a.username, (profitByAdmin.get(a.username) || 0) - amt);
      }
    }
  }

  const nameByAdmin: Record<string, string> = {};
  for (const a of admins) nameByAdmin[a.username] = capitalize(String(a.displayName || a.username));

  const rows: any[] = [];
  for (const [admin, total] of profitByAdmin.entries()) {
    rows.push({
      admin_username: admin,
      period,
      period_start: new Date(startMs).toISOString(),
      total: Number(total.toFixed(2)),
      display_name: nameByAdmin[admin] || capitalize(admin),
      computed_at: new Date().toISOString(),
    });
  }

  // monthly/30d → enrich with goal pct
  if (period === 'monthly' || period === '30d') {
    for (const row of rows) {
      try {
        const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/user_data/${encodeURIComponent(row.admin_username + '_nytzer-goals')}?key=${FIREBASE_API_KEY}`;
        const r = await fetch(url);
        if (!r.ok) continue;
        const j = await r.json();
        const value = fsValue(j.fields?.value);
        const goals: any[] = Array.isArray(value) ? value : [];
        const monthly = goals.find((g: any) => g?.type === 'monthly' && Number(g?.target) > 0);
        if (monthly) row.goal_pct = Number(((row.total / Number(monthly.target)) * 100).toFixed(2));
      } catch { /* ignore */ }
    }
  }

  return rows;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const [users, metas, costs] = await Promise.all([
      fetchCollection('users'),
      fetchCollection('metas'),
      fetchCollection('costs', { optional: true }),
    ]);

    const summary: Record<string, number> = {};
    for (const period of ALL_PERIODS) {
      const rows = await computeForPeriod(period, users, metas, costs);
      if (rows.length === 0) { summary[period] = 0; continue; }
      const { error } = await supabase
        .from('profit_aggregates')
        .upsert(rows, { onConflict: 'admin_username,period,period_start' });
      if (error) throw new Error(`upsert ${period}: ${error.message}`);
      summary[period] = rows.length;
    }

    return new Response(JSON.stringify({ ok: true, summary, computedAt: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[sync-profit-aggregates]', e);
    const msg = String(e);
    const isQuota = /429|RESOURCE_EXHAUSTED|Quota exceeded/i.test(msg);
    return new Response(
      JSON.stringify({ ok: false, error: msg, quota: isQuota }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
