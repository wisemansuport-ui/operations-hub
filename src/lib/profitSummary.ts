import { OperationMeta } from "@/pages/Tasks";
import { buildDateFilter, isInRange, PeriodPreset } from "@/components/ui/period-filter";

export type ProfitPeriod = "daily" | "weekly" | "monthly" | "7d" | "30d";

const PERIOD_TO_PRESET: Record<ProfitPeriod, PeriodPreset> = {
  daily: "HOJE",
  weekly: "SEMANA",
  monthly: "MES",
  "7d": "7D",
  "30d": "30D",
};

const getDisplayName = (username: string, users: any[]) => {
  const found = users.find((u) => u.username === username);
  const raw = found?.displayName || found?.fullName || username;
  return raw ? String(raw).charAt(0).toUpperCase() + String(raw).slice(1) : username;
};

/**
 * Mirrors EXACTLY the "Receita Líquida — Período" KPI in src/pages/Dashboard.tsx.
 * Any change to the dashboard formula must be reflected here.
 */
export function calculateProfitSummary(params: {
  period: ProfitPeriod;
  adminUsername: string;
  metas: OperationMeta[];
  users: any[];
  costs: any[];
}) {
  const { period, adminUsername, metas, users, costs } = params;
  const dateFilter = buildDateFilter(PERIOD_TO_PRESET[period]);

  const isVisible = (owner?: string) =>
    owner === adminUsername ||
    users.find((u) => u.username === owner)?.affiliatedTo === adminUsername ||
    (!owner && adminUsername === "wiseman");

  let totalDep = 0;
  let totalSaq = 0;
  let totalSal = 0;
  let totalAutoSal = 0;

  for (const meta of metas) {
    if (meta.status !== "fechada") continue;
    if (!isVisible(meta.operador)) continue;

    const remessas = meta.remessas || [];
    const sal = Number(meta.salarioOperador) || 0;
    const pagOp = Number(meta.pagamentoOperador) || 0;
    const totalContasMeta = remessas.reduce((acc, r) => acc + Number(r.contas || 0), 0);

    for (const r of remessas) {
      const dep = Number(r.deposito || 0);
      const saq = Number(r.saque || 0);
      const originalRc = Number(r.contas || 0);
      let normais = Number((r as any).contasNormais || 0);
      let baixas = Number((r as any).contasBaixas || 0);

      if (meta.modelo === "Recarga") {
        normais = 0;
        baixas = 0;
      }
      if ((r as any).naoContabilizarSalario) {
        normais = 0;
        baixas = 0;
      }

      const prop = totalContasMeta > 0
        ? originalRc / totalContasMeta
        : (remessas.length > 0 ? 1 / remessas.length : 1);

      const remSal = sal * prop;
      let remAutoSal = 0;
      if (!meta.isAdminMeta && !(r as any).naoContabilizarSalario) {
        remAutoSal = meta.modelo === "Recarga" ? pagOp * prop : (normais * 2) + (baixas * 1);
      }

      const remessaDate = new Date(r.data || meta.createdAt);
      if (!isInRange(remessaDate, dateFilter)) continue;

      totalDep += dep;
      totalSaq += saq;
      totalSal += remSal;
      totalAutoSal += remAutoSal;
    }
  }

  let totalCustos = 0;
  for (const cost of costs) {
    if (!isVisible(cost.operador)) continue;
    const costDate = cost.date ? new Date(cost.date + "T12:00:00") : new Date(cost.createdAt);
    if (!isInRange(costDate, dateFilter)) continue;
    totalCustos += Number(cost.amount || 0);
  }

  const lucroBruto = totalSaq - totalDep;
  const lucroOperacional = lucroBruto + totalSal - totalAutoSal;
  const receitaLiquida = lucroOperacional - totalCustos;

  return {
    adminUsername,
    displayName: getDisplayName(adminUsername, users),
    total: Number(receitaLiquida.toFixed(2)),
    periodStart: (dateFilter.from || new Date(0)).toISOString(),
    periodEnd: (dateFilter.to || new Date()).toISOString(),
    computedAt: new Date().toISOString(),
  };
}
