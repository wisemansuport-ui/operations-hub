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
      (n, v) => `${n}, dia fechou em ${v}. Toda curva tem retomada — amanhã o ringue é seu de novo. 🥊`,
      (n, v) => `Vermelho hoje (${v}), ${n}. Mas o histórico de quem vence é cheio de dias assim. Segue firme! 🛡️`,
      (n, v) => `${n}, ${v} hoje não é fracasso, é dado. Ajusta a mira e amanhã acerta no centro! 🎯`,
      (n, v) => `Dia complicado, ${n} (${v}). Hoje o mercado falou — amanhã quem fala é você. 🗣️`,
      (n, v) => `${n}, perdeu uma batalha (${v}), não a guerra. Recarrega e volta com tudo! ⚔️`,
      (n, v) => `Respira fundo, ${n}. ${v} hoje, mas a régua segue subindo no longo prazo. 📊`,
    ],
    low: [
      (n, v) => `Boa, ${n}! Você lucrou ${v} hoje. Tá no caminho, mas dá pra melhorar! 📈`,
      (n, v) => `Salve, ${n}! ${v} hoje — resultado positivo, mas a gente sabe que tem mais aí dentro! 💡`,
      (n, v) => `${n}, fechou em ${v}. Tá no verde, mas amanhã a meta é dobrar! 🎯`,
      (n, v) => `${v} no bolso hoje, ${n}. Bom começo — agora é hora de subir o nível! ⚙️`,
      (n, v) => `${n}, ${v} hoje. Tijolinho colocado — o prédio só cresce com constância. 🧱`,
      (n, v) => `Verde modesto hoje, ${n} (${v}). Repete isso 30x e o mês muda de figura. 📅`,
      (n, v) => `${n}, ${v} é começo de jornada. Próximo lance vamos atrás de um número mais gordo! 💪`,
      (n, v) => `Resultado positivo, ${n}: ${v}. Hora de afinar a operação e acelerar! ⚡`,
      (n, v) => `${n}, ${v} hoje. Sem celebrar demais nem reclamar — só executar amanhã. 🧭`,
      (n, v) => `Lucrou ${v}, ${n}. Pequeno hoje, gigante amanhã se mantiver a disciplina. 🥇`,
    ],
    mid: [
      (n, v) => `Boa, ${n}! Você já lucrou ${v} hoje. Continue assim! 💰`,
      (n, v) => `Salve, ${n}! ${v} no dia. Operação afiada — segue o jogo! 🔥`,
      (n, v) => `${n}, ${v} hoje. Disciplina pagando — não desacelera! 🚀`,
      (n, v) => `Mandou bem, ${n}! ${v} fechados hoje. Constância é tudo! 💎`,
      (n, v) => `${n}, ${v} hoje. Esse é o ritmo de quem constrói patrimônio! 🏗️`,
      (n, v) => `Dia sólido, ${n}: ${v}. Mantém esse padrão que o mês fica lindo. 📈`,
      (n, v) => `${n}, ${v} no dia. Execução limpa, decisão fria — assim que se faz! ❄️`,
      (n, v) => `Verde firme hoje, ${n} (${v}). O processo tá fluindo, segue. 🌊`,
      (n, v) => `${n}, ${v} hoje. Cada dia desses é um passo a mais da liberdade. 🗝️`,
      (n, v) => `${v} hoje, ${n}. Sem barulho, sem sorte — só método. 🎯`,
    ],
    high: [
      (n, v) => `Caraca, ${n}! O que um CLT faz no mês, você lucrou HOJE! Resultado ${v} 🍾🍾`,
      (n, v) => `${n}, isso é roubo? ${v} em UM dia! O mercado tá pagando pedágio pra você! 🍾🍾`,
      (n, v) => `Show, ${n}! ${v} em um único dia. Imprime esse print e cola na geladeira! 🏆🍾`,
      (n, v) => `${n}, calma aí... ${v} HOJE?! Cê tá imprimindo dinheiro?? 🤑🍾`,
      (n, v) => `${n}, ${v} num dia só?! O mercado tá te devendo aluguel já! 🏠💸`,
      (n, v) => `${n}, ${v} hoje é coisa de quem opera em outro nível. Respeita! 👑`,
      (n, v) => `Hoje foi cinema, ${n}: ${v}! Próxima cena, mesma direção. 🎬🍾`,
      (n, v) => `${n}, ${v} num dia. Tá brincando comigo?! Vai com tudo amanhã também! 🚀`,
      (n, v) => `Resultado de fim de mês em UM dia, ${n}: ${v}. Inacreditável! 🤯`,
      (n, v) => `${n}, ${v} hoje. Esse aí entra pro hall da fama do seu histórico! 🏛️`,
    ],
  },
  weekly: {
    neg: [
      (n, v) => `${n}, a semana fechou em ${v}. Faz parte — agora é resetar a cabeça e atacar a próxima com tudo! 💪`,
      (n, v) => `Semana difícil, ${n} (${v}). Mas é nas quedas que se mede operador. Próxima semana é nossa! 🔥`,
      (n, v) => `Olha, ${n}, ${v} essa semana. Analisa o que travou, ajusta o plano e bora pra cima! ⚡`,
      (n, v) => `${n}, semana ${v}. 7 dias podem ser ruins, o mês ainda é seu. Próxima é virada! 🔁`,
      (n, v) => `Semana no vermelho (${v}), ${n}. Hoje é dia de revisar, amanhã é dia de vencer. 🧠`,
      (n, v) => `${n}, ${v} na semana. Não é o final, é só um capítulo. Vira a página! 📖`,
      (n, v) => `Calma, ${n}: ${v} na semana. Quem desiste aqui não chega no topo. Continua! 🧗`,
    ],
    low: [
      (n, v) => `Boa, ${n}! Semana fechada em ${v}. Tá no azul, mas a próxima a gente sobe o ritmo! 📈`,
      (n, v) => `${n}, ${v} na semana. Resultado positivo — agora bora multiplicar isso! 💡`,
      (n, v) => `Semana ${v}, ${n}. Tá no caminho, mas tem espaço pra MUITO mais! 🎯`,
      (n, v) => `${n}, ${v} na semana. Pé no chão, mas próxima a gente acelera. 🏎️`,
      (n, v) => `Verde modesto, ${n} (${v}) na semana. Repete 4x e o mês fecha forte! 🗓️`,
      (n, v) => `${n}, ${v} em 7 dias. Tem combustível pra mais — bora gastar! ⛽`,
      (n, v) => `Semana positiva, ${n}: ${v}. Próxima a gente coloca um zero a mais. ⚙️`,
    ],
    mid: [
      (n, v) => `Boa, ${n}! Semana fechada em ${v}. Continue assim! 💰`,
      (n, v) => `${n}, ${v} na semana. 7 dias de execução fina — segue o jogo! 🏆`,
      (n, v) => `Mandou bem, ${n}! ${v} na semana. Constância é o motor do crescimento! ⚡`,
      (n, v) => `${n}, ${v} essa semana. Esse é o ritmo de quem vai longe. 🛤️`,
      (n, v) => `Semana sólida, ${n}: ${v}. Mantém o padrão e o mês vira festa. 🎉`,
      (n, v) => `${n}, ${v} na semana. Operação afinada, mente fria. 🧊`,
      (n, v) => `Resultado limpo, ${n}: ${v} em 7 dias. Próxima a gente repete. 🔁`,
    ],
    high: [
      (n, v) => `Caraca, ${n}! ${v} em UMA semana?! Tem gente que não ganha isso em SEIS MESES! 🍾🍾`,
      (n, v) => `${n}, isso aí é coisa de outro patamar! ${v} na semana. Imperador! 👑🍾`,
      (n, v) => `Show, ${n}! ${v} de lucro semanal. O jogo é seu! 🏆🍾`,
      (n, v) => `${n}, ${v} em 7 dias?! Isso vale ano de CLT, hein! 💼💥`,
      (n, v) => `Semana monstra, ${n}: ${v}! Print, salva e olha quando bater dúvida. 📸`,
      (n, v) => `${n}, ${v} na semana. Esse é o tipo de número que muda a vida! 🌍`,
      (n, v) => `${v} em UMA semana, ${n}?! Cê tá descontrolado (do bem)! 🚀🍾`,
    ],
  },
  monthly: {
    neg: [
      (n, v) => `${n}, o mês fechou em ${v}. Mês ruim acontece — agora é levantar, revisar e voltar com fome dobrada! 💪🔥`,
      (n, v) => `Mês desafiador, ${n} (${v}). Mas operador de elite se forja na adversidade. Próximo mês é virada! ⚡`,
      (n, v) => `Olha, ${n}, ${v} no mês. Hora de auditar tudo, ajustar a estratégia e atacar com tudo! 🚀`,
      (n, v) => `${n}, mês ${v}. Reseta o psicológico, refaz o plano — o próximo é nosso! 🧠`,
      (n, v) => `Mês no vermelho (${v}), ${n}. Quem aguenta esse round, vence o próximo. 🥊`,
      (n, v) => `${n}, ${v} no mês. Vai doer, mas é combustível pra próxima fase. 🔥`,
    ],
    low: [
      (n, v) => `Boa, ${n}! Mês fechado em ${v}. Tá no positivo — próximo mês a gente dobra! 📈`,
      (n, v) => `${n}, ${v} no mês. Resultado válido, mas o teto é MUITO mais alto! 💡`,
      (n, v) => `Mês ${v}, ${n}. Tá no caminho — bora subir o nível! 🎯`,
      (n, v) => `${n}, ${v} em 30 dias. Base construída, agora é multiplicar. ✖️`,
      (n, v) => `Mês positivo, ${n}: ${v}. Próximo a gente coloca pra rodar mais forte. ⚙️`,
      (n, v) => `${n}, ${v} no mês. Pé no chão, olho na próxima escalada. 🧗`,
    ],
    mid: [
      (n, v) => `Boa, ${n}! Mês fechado em ${v}. Continue assim! 💰`,
      (n, v) => `${n}, ${v} no mês. Mais um mês de história escrita no preto! 🏛️`,
      (n, v) => `Mandou bem, ${n}! ${v} no mês. Império em expansão! 👑`,
      (n, v) => `${n}, ${v} no mês. Esse é o ritmo de quem constrói patrimônio sério. 🏗️`,
      (n, v) => `Mês sólido, ${n}: ${v}. Próximo a gente sobe mais um degrau. 🪜`,
      (n, v) => `${n}, ${v} em 30 dias. Disciplina virando dinheiro — segue. 💎`,
    ],
    high: [
      (n, v) => `Caraca, ${n}! ${v} em UM mês?! O que CLT faz em ANOS, cê faz em 30 dias! 🍾🍾`,
      (n, v) => `${n}, ${v} mensais?! Cê tá jogando outro game! REI! 👑🍾`,
      (n, v) => `Show, ${n}! ${v} de lucro no mês. Imprime, emoldura e pendura na parede! 🏆🍾`,
      (n, v) => `${n}, ${v} num mês?! Salário de diretor de multinacional, hein! 💼🚀`,
      (n, v) => `Mês histórico, ${n}: ${v}! Esse vai no portfólio pra sempre. 📚`,
      (n, v) => `${n}, ${v} em 30 dias. O mercado tá te devendo bônus já! 🎁`,
      (n, v) => `${v} no mês, ${n}?! Tá imprimindo do bom e do melhor! 🖨️💵`,
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

// ─── AI-powered phrase generator (Lovable AI Gateway) ─────────────────────
// Sempre tenta gerar uma frase fresca via IA. Em caso de falha (sem chave,
// rate limit, timeout ou resposta vazia), cai pro catálogo local — então a
// notificação NUNCA falha por causa da IA.
async function generateAiPhrase(
  period: 'daily' | 'weekly' | 'monthly',
  tier: Tier,
  name: string,
  valueStr: string,
): Promise<string | null> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) return null;

  const periodLabel =
    period === 'daily' ? 'do DIA de hoje'
    : period === 'weekly' ? 'da SEMANA'
    : 'do MÊS';

  const toneLabel =
    tier === 'neg'  ? 'O resultado foi NEGATIVO. Tom acolhedor, motivacional e de levante — sem clichês fracos, sem pena. Frase que faz o operador respirar fundo e voltar com fome.'
    : tier === 'low' ? 'Resultado POSITIVO mas modesto (até R$500). Tom de "tá no caminho, bora subir o nível" — reconhece e provoca pra mais.'
    : tier === 'mid' ? 'Resultado POSITIVO sólido (R$500 a R$1500). Tom de "operação afiada, continue assim" — celebra com pé no chão.'
    : 'Resultado EXCEPCIONAL (R$1500+). Tom descontraído, de brincadeira e festa — celebra com humor, sem ser cafona.';

  const prompt = `Você escreve UMA frase curta de notificação push em PORTUGUÊS BRASILEIRO para um operador chamado "${name}" sobre o lucro ${periodLabel}: ${valueStr}.

${toneLabel}

REGRAS OBRIGATÓRIAS:
- Máximo 160 caracteres.
- Inclua o nome "${name}" e o valor exato "${valueStr}" na frase.
- Pode usar 1 a 2 emojis no final, com moderação.
- Linguagem direta, brasileira, com personalidade — nada genérico tipo "parabéns pelo seu desempenho".
- NÃO comece com "MONSTRO", "Caraca" nem clichês repetidos.
- NÃO use aspas, nem hashtags, nem markdown.
- Retorne SOMENTE a frase final, sem prefixo, sem explicação.`;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'Você é um copywriter brasileiro de elite especializado em mensagens curtas, criativas e variadas de notificação push para traders e operadores. Cada frase deve ser ORIGINAL — nunca repita o mesmo gancho.' },
          { role: 'user', content: prompt },
        ],
        temperature: 1.1,
      }),
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = await res.json();
    let text: string = json?.choices?.[0]?.message?.content ?? '';
    text = String(text).trim().replace(/^["'`]+|["'`]+$/g, '').trim();
    if (!text) return null;
    // Garante que nome e valor estão presentes; se não, descarta e usa fallback local
    if (!text.includes(name) || !text.includes(valueStr)) return null;
    if (text.length > 220) text = text.slice(0, 217).trimEnd() + '…';
    return text;
  } catch {
    return null;
  }
}

async function buildMessage(period: Period, name: string, value: number, valueStr: string, goalPct?: number) {
  const key = periodKey(period);
  const t = tierOf(value);
  const ai = await generateAiPhrase(key, t, name, valueStr);
  let msg = ai ?? pick(PHRASES[key][t])(name, valueStr);
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
    const localSummary = bodyParams.localSummary && typeof bodyParams.localSummary === 'object'
      ? bodyParams.localSummary
      : null;
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

    const hasValidLocalSummary = !!targetAdmin &&
      localSummary?.adminUsername === targetAdmin &&
      Number.isFinite(Number(localSummary?.total));

    if (hasValidLocalSummary) {
      // localSummary é a fonte da verdade — espelha 100% a "Receita Líquida"
      // exibida no Dashboard. Sobrescreve qualquer cache potencialmente
      // calculado com fórmula diferente / desatualizada.
      const localTotal = Number(Number(localSummary.total).toFixed(2));
      console.log(`[sync] usando localSummary do app (dashboard-aligned) period=${period} total=${localTotal}`);
      profitByAdmin.set(targetAdmin, localTotal);
      nameByAdmin[targetAdmin] = localSummary.displayName || capitalize(targetAdmin);
      if (Number.isFinite(Number(localSummary.goalPct))) goalPctByAdmin[targetAdmin] = Number(localSummary.goalPct);

      try {
        await supabase
          .from('profit_aggregates')
          .upsert({
            admin_username: targetAdmin,
            period,
            period_start: startIsoExpected,
            total: localTotal,
            goal_pct: goalPctByAdmin[targetAdmin] ?? null,
            display_name: nameByAdmin[targetAdmin],
            computed_at: new Date().toISOString(),
          }, { onConflict: 'admin_username,period,period_start' });
      } catch (e) {
        console.warn('[cache:local-write]', e);
      }
    } else if (cacheUsable) {
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
      const body = await buildMessage(period, name, total, valueStr, goalPct);
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
    return new Response(
      JSON.stringify({
        error: /429|RESOURCE_EXHAUSTED|Quota exceeded/i.test(msg)
          ? 'Lucro ainda não sincronizado no banco. Aguarde a próxima atualização automática e tente novamente.'
          : msg,
        fallback: true,
        count: 0,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
