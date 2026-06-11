// Sends daily / weekly / monthly profit push summary to each admin.
// Mirrors the Dashboard "Receita líquida — período" formula exactly:
//   For each fechada meta visible in the admin workspace, for each remessa
//   whose `data` falls inside the period:
//     contribution = (saque - deposito) + (salarioOperador * prop) - autoSalario
//   prop  = remessa.contas / sum(contas of meta), or 1/len if zero
//   autoSal: Recarga model => pagamentoOperador * prop
//            other       => contasNormais*2 + contasBaixas*1
//            (skipped if isAdminMeta or naoContabilizarSalario)
//   Finally subtract custos in period for the workspace.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIREBASE_PROJECT = 'nytzer-vision';
const FIREBASE_API_KEY = 'AIzaSyDiiKqZWL3X880z1Lcy5_QGXgjSaOHUdhA';
const NOTIFY_URL = 'https://www.nytzervision.com/api/notify';
const CACHE_MAX_AGE_MS = 90 * 60 * 1000; // 90 min
const STALE_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // permite último cache do dia sem bater no Firestore

// Tone tiers based on profit value:
//   negative          -> motivacional / levante
//   0 < x <= 500      -> "dá pra melhorar"
//   500 < x < 1500    -> positivo padrão "continue assim"
//   x >= 1500         -> descontraído / brincadeira

type Tier = 'neg' | 'low' | 'mid' | 'high';

const PHRASES: Record<'daily' | 'weekly' | 'monthly', Record<Tier, ((name: string, valueStr: string) => string)[]>> = {
  daily: {
    neg: [
      (n, v) => `Ô, ${n}... o dia fechou em ${v}. Respira, levanta a cabeça e amanhã a gente corre em dobro! 💪`,
      (n, v) => `Calma, ${n}. ${v} hoje não define nada — amanhã é dia de virar o jogo! 🔥`,
      (n, v) => `${n}, hoje deu ruim (${v}). Mas operador de verdade se mede na recuperação. Bora pra cima! ⚡`,
      (n, v) => `Eita, ${n}! ${v} hoje. Limpa a mente, foca no plano e amanhã a gente devolve com juros! 🚀`,
    ],
    low: [
      (n, v) => `Boa, ${n}! Você lucrou ${v} hoje. Tá no caminho, mas dá pra melhorar! 📈`,
      (n, v) => `Salve, ${n}! ${v} hoje — resultado positivo, mas a gente sabe que tem mais aí dentro! 💡`,
      (n, v) => `${n}, fechou em ${v}. Tá no verde, mas amanhã a meta é dobrar! 🎯`,
      (n, v) => `${v} no bolso hoje, ${n}. Bom começo — agora é hora de subir o nível! ⚙️`,
    ],
    mid: [
      (n, v) => `Boa, ${n}! Você já lucrou ${v} hoje. Continue assim! 💰`,
      (n, v) => `Salve, ${n}! ${v} no dia. Operação afiada — segue o jogo! 🔥`,
      (n, v) => `${n}, ${v} hoje. Disciplina pagando — não desacelera! 🚀`,
      (n, v) => `Mandou bem, ${n}! ${v} fechados hoje. Constância é tudo! 💎`,
    ],
    high: [
      (n, v) => `Caraca, ${n}! O que um CLT faz no mês, você lucrou HOJE! HAHAHA — Resultado ${v} 🍾🍾`,
      (n, v) => `${n}, isso é roubo? ${v} em UM dia! O mercado tá pagando pedágio pra você! 🍾🍾`,
      (n, v) => `MONSTRO, ${n}! ${v} em um único dia. Imprime esse print e cola na geladeira! 🏆🍾`,
      (n, v) => `${n}, calma aí... ${v} HOJE?! Cê tá imprimindo dinheiro?? HAHAHA 🤑🍾`,
    ],
  },
  weekly: {
    neg: [
      (n, v) => `${n}, a semana fechou em ${v}. Faz parte — agora é resetar a cabeça e atacar a próxima com tudo! 💪`,
      (n, v) => `Semana difícil, ${n} (${v}). Mas é nas quedas que se mede operador. Próxima semana é nossa! 🔥`,
      (n, v) => `Olha, ${n}, ${v} essa semana. Analisa o que travou, ajusta o plano e bora pra cima! ⚡`,
    ],
    low: [
      (n, v) => `Boa, ${n}! Semana fechada em ${v}. Tá no azul, mas a próxima a gente sobe o ritmo! 📈`,
      (n, v) => `${n}, ${v} na semana. Resultado positivo — agora bora multiplicar isso! 💡`,
      (n, v) => `Semana ${v}, ${n}. Tá no caminho, mas tem espaço pra MUITO mais! 🎯`,
    ],
    mid: [
      (n, v) => `Boa, ${n}! Semana fechada em ${v}. Continue assim! 💰`,
      (n, v) => `${n}, ${v} na semana. 7 dias de execução fina — segue o jogo! 🏆`,
      (n, v) => `Mandou bem, ${n}! ${v} na semana. Constância é o motor do crescimento! ⚡`,
    ],
    high: [
      (n, v) => `Caraca, ${n}! ${v} em UMA semana?! Tem gente que não ganha isso em SEIS MESES! HAHAHA 🍾🍾`,
      (n, v) => `${n}, isso aí é coisa de outro patamar! ${v} na semana. Imperador! 👑🍾`,
      (n, v) => `MONSTRO, ${n}! ${v} de lucro semanal. O jogo é seu! 🏆🍾`,
    ],
  },
  monthly: {
    neg: [
      (n, v) => `${n}, o mês fechou em ${v}. Mês ruim acontece — agora é levantar, revisar e voltar com fome dobrada! 💪🔥`,
      (n, v) => `Mês desafiador, ${n} (${v}). Mas operador de elite se forja na adversidade. Próximo mês é virada! ⚡`,
      (n, v) => `Olha, ${n}, ${v} no mês. Hora de auditar tudo, ajustar a estratégia e atacar com tudo! 🚀`,
    ],
    low: [
      (n, v) => `Boa, ${n}! Mês fechado em ${v}. Tá no positivo — próximo mês a gente dobra! 📈`,
      (n, v) => `${n}, ${v} no mês. Resultado válido, mas o teto é MUITO mais alto! 💡`,
      (n, v) => `Mês ${v}, ${n}. Tá no caminho — bora subir o nível! 🎯`,
    ],
    mid: [
      (n, v) => `Boa, ${n}! Mês fechado em ${v}. Continue assim! 💰`,
      (n, v) => `${n}, ${v} no mês. Mais um mês de história escrita no preto! 🏛️`,
      (n, v) => `Mandou bem, ${n}! ${v} no mês. Império em expansão! 👑`,
    ],
    high: [
      (n, v) => `Caraca, ${n}! ${v} em UM mês?! HAHAHA o que CLT faz em ANOS, cê faz em 30 dias! 🍾🍾`,
      (n, v) => `${n}, ${v} mensais?! Cê tá jogando outro game! REI! 👑🍾`,
      (n, v) => `MONSTRO, ${n}! ${v} de lucro no mês. Imprime, emoldura e pendura na parede! 🏆🍾`,
    ],
  },
};

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

function tierOf(v: number): Tier {
  if (v < 0) return 'neg';
  if (v <= 500) return 'low';
  if (v < 1500) return 'mid';
  return 'high';
}

function buildMessage(period: Period, name: string, value: number, valueStr: string, goalPct?: number) {
  const key = periodKey(period);
  const t = tierOf(value);
  const fn = pick(PHRASES[key][t]);
  let msg = fn(name, valueStr);
  if (goalPct !== undefined && (period === 'monthly' || period === '30d')) {
    const pct = Math.round(goalPct);
    if (pct >= 100) msg += ` 🎯 Meta mensal BATIDA (${pct}%)!`;
    else if (pct >= 70) msg += ` 🎯 Você já bateu ${pct}% da meta mensal!`;
    else if (pct > 0) msg += ` 🎯 ${pct}% da meta mensal.`;
  }
  return msg;
}


function capitalize(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}


type Period = 'daily' | 'weekly' | 'monthly' | '7d' | '30d';

function getPeriodStart(period: Period): number {
  const now = new Date();
  if (period === '7d') return now.getTime() - 7 * 24 * 60 * 60 * 1000;
  if (period === '30d') return now.getTime() - 30 * 24 * 60 * 60 * 1000;
  // Brasília = UTC-3 (no DST). Shift to local then compute boundary in UTC.
  const local = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();
  let startLocalMs: number;
  if (period === 'daily') {
    startLocalMs = Date.UTC(y, m, d);
  } else if (period === 'weekly') {
    const dow = local.getUTCDay();
    startLocalMs = Date.UTC(y, m, d - dow);
  } else {
    startLocalMs = Date.UTC(y, m, 1);
  }
  return startLocalMs + 3 * 60 * 60 * 1000;
}

function periodKey(period: Period): 'daily' | 'weekly' | 'monthly' {
  if (period === 'daily') return 'daily';
  if (period === '7d' || period === 'weekly') return 'weekly';
  return 'monthly';
}

function periodTitleOf(period: Period): string {
  switch (period) {
    case 'daily':   return 'Fechamento do Dia 🗓️';
    case 'weekly':  return 'Fechamento Semanal 🗓️';
    case 'monthly': return 'Fechamento Mensal 🗓️';
    case '7d':      return 'Fechamento — Últimos 7 Dias 🗓️';
    case '30d':     return 'Fechamento — Últimos 30 Dias 🗓️';
  }
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
  const maxRetries = opts.retries ?? 3;
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
          // exponential backoff: 500ms, 1s, 2s
          await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
          continue;
        }
        break;
      }
      if (!res || !res.ok) {
        if (opts.optional) {
          console.warn(`[fetchCollection:${name}] ${res?.status} — degradando para vazio. ${lastTxt.slice(0, 200)}`);
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
      console.warn(`[fetchCollection:${name}] erro, degradando:`, e);
      return docs;
    }
    throw e;
  }
  return docs;
}

function formatBRLSigned(v: number) {
  const sign = v >= 0 ? '+' : '-';
  const abs = Math.abs(v).toFixed(2);
  const [int, dec] = abs.split('.');
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}R$ ${intFmt},${dec}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    let bodyParams: any = {};
    if (req.method === 'POST') {
      try { bodyParams = await req.json(); } catch { bodyParams = {}; }
    }
    const period = ((bodyParams.period || url.searchParams.get('period') || 'daily') as Period);
    const targetAdmin = (bodyParams.targetAdmin || url.searchParams.get('targetAdmin') || '').toString().trim();
    const allowZero = !!(bodyParams.allowZero || url.searchParams.get('allowZero'));
    if (!['daily', 'weekly', 'monthly', '7d', '30d'].includes(period)) {
      return new Response(JSON.stringify({ error: 'invalid period' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ────────────────────────────────────────────────────────────────
    // Tenta o cache (public.profit_aggregates) primeiro — zero quota.
    // ────────────────────────────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const startMsExpected = getPeriodStart(period);
    const startIsoExpected = new Date(startMsExpected).toISOString();

    let cacheRows: any[] = [];
    try {
      let q = supabase
        .from('profit_aggregates')
        .select('admin_username, total, goal_pct, display_name, computed_at, period_start')
        .eq('period', period)
        .eq('period_start', startIsoExpected);
      if (targetAdmin) q = q.eq('admin_username', targetAdmin);
      const { data, error } = await q;
      if (error) console.warn('[cache:read]', error.message);
      else cacheRows = data || [];
    } catch (e) {
      console.warn('[cache:read] excecao', e);
    }

    const cacheFresh = cacheRows.length > 0 &&
      cacheRows.every((r: any) => Date.now() - new Date(r.computed_at).getTime() < CACHE_MAX_AGE_MS);
    const cacheUsable = cacheRows.length > 0 &&
      cacheRows.every((r: any) => Date.now() - new Date(r.computed_at).getTime() < STALE_CACHE_MAX_AGE_MS);

    const profitByAdmin = new Map<string, number>();
    const nameByAdmin: Record<string, string> = {};
    const goalPctByAdmin: Record<string, number | undefined> = {};

    if (cacheUsable) {
      console.log(`[cache] ${cacheFresh ? 'hit' : 'stale-hit'} period=${period} rows=${cacheRows.length}`);
      for (const r of cacheRows) {
        profitByAdmin.set(r.admin_username, Number(r.total));
        nameByAdmin[r.admin_username] = r.display_name || capitalize(r.admin_username);
        if (r.goal_pct != null) goalPctByAdmin[r.admin_username] = Number(r.goal_pct);
      }
    } else {
      console.log(`[cache] miss period=${period} — disparo manual cancelado sem consultar Firestore`);
      return new Response(JSON.stringify({
        error: 'Lucro ainda não sincronizado no banco. Aguarde a próxima atualização automática e tente novamente.',
        fallback: true,
        cacheMissing: true,
        count: 0,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ensure target admin shows up even with zero profit (manual trigger)
    if (targetAdmin && !profitByAdmin.has(targetAdmin)) {
      profitByAdmin.set(targetAdmin, 0);
      if (!nameByAdmin[targetAdmin]) nameByAdmin[targetAdmin] = capitalize(targetAdmin);
    }


    const results: any[] = [];
    for (const [admin, total] of profitByAdmin.entries()) {
      if (!allowZero && !targetAdmin && !total) continue;
      const name = nameByAdmin[admin] || capitalize(admin);
      const valueStr = formatBRLSigned(total);
      const goalPct = goalPctByAdmin[admin];
      const body = buildMessage(period, name, total, valueStr, goalPct);
      const periodTitle = periodTitleOf(period);
      const titleMap: Record<string, string> = {
        daily:   'Fechamento do Dia 🗓️',
        weekly:  'Fechamento Semanal 🗓️',
        monthly: 'Fechamento Mensal 🗓️',
        '7d':    'Fechamento — Últimos 7 Dias 🗓️',
        '30d':   'Fechamento — Últimos 30 Dias 🗓️',
      };
      const title = titleMap[period] || 'Fechamento do Dia 🗓️';
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

      try {
        const fsUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/notifications?key=${FIREBASE_API_KEY}`;
        await fetch(fsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              title: { stringValue: periodTitle },
              message: { stringValue: body },
              type: { stringValue: total < 0 ? 'warning' : 'success' },
              read: { booleanValue: false },
              timestamp: { stringValue: new Date().toISOString() },
              targetUser: { stringValue: admin },
              targetRole: { stringValue: 'ADMIN' },
            },
          }),
        });
      } catch (e) {
        console.error('[firestore-notif]', admin, e);
      }
    }


    return new Response(JSON.stringify({ period, count: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = String(e);
    console.error('[send-profit-summary]', e);
    const isQuota = /429|RESOURCE_EXHAUSTED|Quota exceeded/i.test(msg);
    return new Response(
      JSON.stringify({
        error: isQuota
          ? 'Firestore atingiu o limite de quota. Tente novamente em alguns instantes.'
          : msg,
        fallback: true,
        count: 0,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
