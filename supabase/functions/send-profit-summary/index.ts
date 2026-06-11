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

function getPeriodStart(period: 'daily' | 'weekly' | 'monthly'): number {
  const now = new Date();
  // Brasília = UTC-3 (no DST). Shift to local then compute boundary in UTC.
  const local = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();
  let startLocalMs: number;
  if (period === 'daily') {
    startLocalMs = Date.UTC(y, m, d);
  } else if (period === 'weekly') {
    // Week starts Sunday (matches getDay=0). Adjust day-of-week.
    const dow = local.getUTCDay();
    startLocalMs = Date.UTC(y, m, d - dow);
  } else {
    startLocalMs = Date.UTC(y, m, 1);
  }
  // Convert local-midnight back to real UTC instant
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

    const [users, metas, costs] = await Promise.all([
      fetchCollection('users'),
      fetchCollection('metas'),
      fetchCollection('costs'),
    ]);
    const startMs = getPeriodStart(period);

    // Build admin list: every user with role ADMIN
    const admins: any[] = users.filter((u: any) => u.role === 'ADMIN');

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

    const label = periodLabel(period);
    const results: any[] = [];

    for (const [admin, total] of profitByAdmin.entries()) {
      if (!total) continue;
      const phrase = periodPhrase(period);
      const periodTitle = period === 'daily' ? 'Resumo do dia' : period === 'weekly' ? 'Resumo da semana' : 'Resumo do mês';
      const title = `NytzerVision`;
      const body = `Lucro ${label}: ${formatBRLSigned(total)}\n${phrase}`;
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
              message: { stringValue: `Lucro ${label}: ${formatBRLSigned(total)} — ${phrase}` },
              type: { stringValue: 'info' },
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
