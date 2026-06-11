// Sends daily / weekly / monthly profit push summary to each admin.
// Triggered via pg_cron with ?period=daily|weekly|monthly.
//
// Pipeline:
//   1) Read Firestore (users + metas) via public REST API.
//   2) Compute profit per admin for the requested period.
//   3) POST to https://www.nytzervision.com/api/notify (which uses OneSignal).

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIREBASE_PROJECT = 'nytzer-vision';
const FIREBASE_API_KEY = 'AIzaSyDiiKqZWL3X880z1Lcy5_QGXgjSaOHUdhA';
const NOTIFY_URL = 'https://www.nytzervision.com/api/notify';

const DAILY_PHRASES = [
  '🔥 Dia fechado com vitória! O resultado fala por si.',
  '💎 Outro dia, outra prova de consistência.',
  '🚀 Operação afiada — o lucro de hoje confirma a disciplina.',
  '✨ Cada dia produtivo é um tijolo a mais no império.',
];
const WEEKLY_PHRASES = [
  '📈 Semana encerrada com domínio total do jogo!',
  '🏆 7 dias de execução fina — resultado merecido.',
  '⚡ Semana fechada no azul. Vamos para a próxima!',
  '🎯 Constância semanal: o motor do crescimento.',
];
const MONTHLY_PHRASES = [
  '👑 Mês fechado como rei do tabuleiro!',
  '🌟 Um mês inteiro de execução premium — orgulhe-se.',
  '💰 Resultado mensal sólido. Império em expansão.',
  '🏛️ Mais um mês de história escrita no preto.',
];

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

function getPeriodStart(period: 'daily' | 'weekly' | 'monthly'): Date {
  const now = new Date();
  // Use Brazil timezone (UTC-3) approximation by shifting
  const local = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  if (period === 'daily') {
    return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) + 3 * 60 * 60 * 1000);
  }
  if (period === 'weekly') {
    const day = local.getUTCDay();
    const diff = day; // start of week: Sunday
    return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - diff) + 3 * 60 * 60 * 1000);
  }
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) + 3 * 60 * 60 * 1000);
}

// Convert Firestore REST document → plain JS object
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

function formatBRL(v: number) {
  const sign = v >= 0 ? '+' : '-';
  return `${sign}R$ ${Math.abs(v).toFixed(2).replace('.', ',')}`;
}

function periodLabel(p: string) {
  return p === 'daily' ? 'do dia' : p === 'weekly' ? 'da semana' : 'do mês';
}

function periodPhrase(p: string) {
  return p === 'daily' ? pick(DAILY_PHRASES) : p === 'weekly' ? pick(WEEKLY_PHRASES) : pick(MONTHLY_PHRASES);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const period = (url.searchParams.get('period') || 'daily') as 'daily' | 'weekly' | 'monthly';
    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return new Response(JSON.stringify({ error: 'invalid period' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [users, metas] = await Promise.all([fetchCollection('users'), fetchCollection('metas')]);
    const start = getPeriodStart(period).getTime();

    // Map operator → admin (workspace owner)
    const adminFor = (username: string): string | null => {
      const u = users.find((x: any) => x.username === username);
      if (!u) return null;
      if (u.affiliatedTo) return u.affiliatedTo;
      if (u.role === 'ADMIN') return u.username;
      return null;
    };

    // Aggregate profit per admin from each remessa within period
    const profitByAdmin = new Map<string, number>();
    for (const meta of metas) {
      if (meta.status === 'lixeira') continue;
      const owner = adminFor(meta.operador || '');
      if (!owner) continue;
      const remessas: any[] = meta.remessas || [];
      for (const r of remessas) {
        const ts = r.data ? new Date(r.data).getTime() : 0;
        if (!ts || ts < start) continue;
        const dep = Number(r.deposito || 0);
        const saq = Number(r.saque || 0);
        let result = saq - dep;
        // Apply admin salário / operator pagamento same as UI net result
        if (!meta.isAdminMeta) {
          const auto = ((Number(r.contasNormais || 0)) * 2) + ((Number(r.contasBaixas || 0)) * 1);
          result = result + (Number(meta.salarioOperador || 0) > 0 ? 0 : 0) - auto;
        }
        profitByAdmin.set(owner, (profitByAdmin.get(owner) || 0) + result);
      }
    }

    const label = periodLabel(period);
    const results: any[] = [];

    for (const [admin, total] of profitByAdmin.entries()) {
      if (total === 0) continue;
      const phrase = periodPhrase(period);
      const title = `NytzerVision`;
      const body = `Lucro ${label}: ${formatBRL(total)}\n${phrase}`;
      try {
        const r = await fetch(NOTIFY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body, targets: [admin] }),
        });
        const j = await r.json().catch(() => ({}));
        results.push({ admin, total, status: r.status, response: j });
      } catch (e) {
        results.push({ admin, total, error: String(e) });
      }
    }

    return new Response(JSON.stringify({ period, count: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[send-profit-summary]', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
