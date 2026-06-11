import { OperationMeta } from "@/pages/Tasks";

export type ProfitPeriod = "daily" | "weekly" | "monthly" | "7d" | "30d";

const MS_DAY = 24 * 60 * 60 * 1000;

const getBrasiliaPeriodStart = (period: ProfitPeriod) => {
  const now = new Date();
  if (period === "7d") return new Date(now.getTime() - 7 * MS_DAY);
  if (period === "30d") return new Date(now.getTime() - 30 * MS_DAY);

  const local = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const year = local.getUTCFullYear();
  const month = local.getUTCMonth();
  const day = local.getUTCDate();
  let startLocalMs: number;

  if (period === "daily") startLocalMs = Date.UTC(year, month, day);
  else if (period === "weekly") startLocalMs = Date.UTC(year, month, day - local.getUTCDay());
  else startLocalMs = Date.UTC(year, month, 1);

  return new Date(startLocalMs + 3 * 60 * 60 * 1000);
};

const getDisplayName = (username: string, users: any[]) => {
  const found = users.find((u) => u.username === username);
  const raw = found?.displayName || found?.fullName || username;
  return raw ? String(raw).charAt(0).toUpperCase() + String(raw).slice(1) : username;
};

export function calculateProfitSummary(params: {
  period: ProfitPeriod;
  adminUsername: string;
  metas: OperationMeta[];
  users: any[];
  costs: any[];
}) {
  const { period, adminUsername, metas, users, costs } = params;
  const start = getBrasiliaPeriodStart(period).getTime();
  let total = 0;

  const isVisibleToAdmin = (owner?: string) =>
    owner === adminUsername ||
    users.find((u) => u.username === owner)?.affiliatedTo === adminUsername ||
    (!owner && adminUsername === "wiseman");

  for (const meta of metas) {
    if (meta.status !== "fechada" || !isVisibleToAdmin(meta.operador)) continue;

    const remessas = meta.remessas || [];
    const sal = Number(meta.salarioOperador || 0);
    const pagOp = Number(meta.pagamentoOperador || 0);
    const totalContasMeta = remessas.reduce((acc, r) => acc + Number(r.contas || 0), 0);

    for (const remessa of remessas) {
      const ts = new Date(remessa.data || meta.createdAt).getTime();
      if (!ts || ts < start) continue;

      const dep = Number(remessa.deposito || 0);
      const saq = Number(remessa.saque || 0);
      const originalContas = Number(remessa.contas || 0);
      let normais = Number(remessa.contasNormais || 0);
      let baixas = Number(remessa.contasBaixas || 0);

      if (meta.modelo === "Recarga" || remessa.naoContabilizarSalario) {
        normais = 0;
        baixas = 0;
      }

      const prop = totalContasMeta > 0
        ? originalContas / totalContasMeta
        : remessas.length > 0 ? 1 / remessas.length : 1;

      const remSal = sal * prop;
      let remAutoSal = 0;
      if (!meta.isAdminMeta && !remessa.naoContabilizarSalario) {
        remAutoSal = meta.modelo === "Recarga" ? pagOp * prop : normais * 2 + baixas;
      }

      total += (saq - dep) + remSal - remAutoSal;
    }
  }

  for (const cost of costs) {
    if (!isVisibleToAdmin(cost.operador)) continue;
    const costTs = cost.date
      ? new Date(`${cost.date}T12:00:00`).getTime()
      : new Date(cost.createdAt || 0).getTime();
    if (!costTs || costTs < start) continue;
    total -= Number(cost.amount || 0);
  }

  return {
    adminUsername,
    displayName: getDisplayName(adminUsername, users),
    total: Number(total.toFixed(2)),
    periodStart: new Date(start).toISOString(),
    computedAt: new Date().toISOString(),
  };
}