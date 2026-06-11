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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIREBASE_PROJECT = 'nytzer-vision';
const FIREBASE_API_KEY = 'AIzaSyDiiKqZWL3X880z1Lcy5_QGXgjSaOHUdhA';
const NOTIFY_URL = 'https://www.nytzervision.com/api/notify';

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
    case 'daily': return 'Resumo do dia';
    case 'weekly': return 'Resumo da semana';
    case 'monthly': return 'Resumo do mês';
    case '7d': return 'Resumo — últimos 7 dias';
    case '30d': return 'Resumo — últimos 30 dias';
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

    const [users, metas, costs] = await Promise.all([
      fetchCollection('users'),
      fetchCollection('metas'),
      fetchCollection('costs'),
    ]);
    const startMs = getPeriodStart(period);


    // Build admin list: every user with role ADMIN
    let admins: any[] = users.filter((u: any) => u.role === 'ADMIN');
    if (targetAdmin) admins = admins.filter((a: any) => a.username === targetAdmin);


    // For each admin, compute set of "visible operator usernames" (workspace):
    //   admin himself + every operator whose affiliatedTo === admin.username
    const workspaceOfAdmin: Record<string, Set<string>> = {};
    for (const a of admins) {
      const set = new Set<string>([a.username]);
      for (const u of users) {
        if (u.affiliatedTo === a.username) set.add(u.username);
      }
      workspaceOfAdmin[a.username] = set;
    }

    const profitByAdmin = new Map<string, number>();

    // Aggregate per-remessa contribution for fechada metas
    for (const meta of metas) {
      if (meta.status !== 'fechada') continue;
      const owner = meta.operador;
      if (!owner) continue;

      const remessas: any[] = meta.remessas || [];
      const sal = Number(meta.salarioOperador || 0);
      const pagOp = Number(meta.pagamentoOperador || 0);
      const totalContasMeta = remessas.reduce(
        (acc: number, r: any) => acc + Number(r.contas || 0),
        0
      );

      for (const r of remessas) {
        const ts = r.data ? new Date(r.data).getTime() : new Date(meta.createdAt).getTime();
        if (!ts || ts < startMs) continue;

        const dep = Number(r.deposito || 0);
        const saq = Number(r.saque || 0);
        const originalRc = Number(r.contas || 0);
        let normais = Number(r.contasNormais || 0);
        let baixas = Number(r.contasBaixas || 0);

        if (meta.modelo === 'Recarga') {
          normais = 0;
          baixas = 0;
        }
        if (r.naoContabilizarSalario) {
          normais = 0;
          baixas = 0;
        }

        const prop =
          totalContasMeta > 0
            ? originalRc / totalContasMeta
            : remessas.length > 0
            ? 1 / remessas.length
            : 1;

        const remSal = sal * prop;
        let remAutoSal = 0;
        if (!meta.isAdminMeta && !r.naoContabilizarSalario) {
          if (meta.modelo === 'Recarga') remAutoSal = pagOp * prop;
          else remAutoSal = normais * 2 + baixas * 1;
        }

        const contribution = saq - dep + remSal - remAutoSal;

        // attribute to every admin whose workspace includes this operator
        for (const a of admins) {
          if (workspaceOfAdmin[a.username].has(owner)) {
            profitByAdmin.set(a.username, (profitByAdmin.get(a.username) || 0) + contribution);
          }
        }
      }
    }

    // Subtract custos within period for each admin workspace
    for (const cost of costs) {
      const costDate = cost.date
        ? new Date(cost.date + 'T12:00:00').getTime()
        : cost.createdAt
        ? new Date(cost.createdAt).getTime()
        : 0;
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

    const results: any[] = [];

    // build admin -> displayName lookup
    const nameByAdmin: Record<string, string> = {};
    for (const a of admins) nameByAdmin[a.username] = capitalize(String(a.displayName || a.username));

    for (const [admin, total] of profitByAdmin.entries()) {
      if (!total) continue;
      const name = nameByAdmin[admin] || capitalize(admin);
      const valueStr = formatBRLSigned(total);
      const body = buildMessage(period, name, total, valueStr);
      const periodTitle = period === 'daily' ? 'Resumo do dia' : period === 'weekly' ? 'Resumo da semana' : 'Resumo do mês';
      const title = `NytzerVision`;
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

      // Also persist as an in-app notification (Firestore) so it shows
      // up in the bell center under "Todas" and "Info".
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
    console.error('[send-profit-summary]', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
