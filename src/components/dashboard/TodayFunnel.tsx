import { DollarSign, Users, Package, TrendingUp } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

interface TodayFunnelProps {
  lucroHoje: number;
  contasHoje: number;
  remessasHoje: number;
  sparkData: { name: string; value: number }[];
}

const formatBRL = (val: number) =>
  `R$ ${Math.abs(val).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const TodayFunnel = ({ lucroHoje, contasHoje, remessasHoje, sparkData }: TodayFunnelProps) => {
  const sign = lucroHoje >= 0 ? "+" : "-";
  const profitColor = lucroHoje >= 0 ? "text-success" : "text-destructive";

  // Funnel proportions — visual cascade
  const max = Math.max(remessasHoje, contasHoje, 1);
  const widths = {
    lucro: 100,
    contas: Math.max(55, Math.min(95, (contasHoje / Math.max(max, 1)) * 100)),
    remessas: Math.max(35, Math.min(80, (remessasHoje / Math.max(max, 1)) * 100)),
  };

  return (
    <div className="hairline-gold surface-3 rounded-2xl p-5 md:p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />

      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-primary/80 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Performance de Hoje
          </p>
          <h3 className="text-base md:text-lg font-bold text-foreground mt-1 tracking-tight">
            Funil Operacional
          </h3>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">tempo real</span>
        </div>
      </div>

      {/* Sparkline */}
      <div className="h-14 -mx-2 mb-5 opacity-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="sparkToday" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#sparkToday)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-3">
        {/* Lucro Hoje */}
        <div
          className="relative rounded-xl border border-success/30 bg-gradient-to-r from-success/10 via-success/5 to-transparent p-4 transition-all hover:border-success/50 mx-auto"
          style={{ width: `${widths.lucro}%` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-success/15 border border-success/30 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-success/80">Lucro de Hoje</p>
                <p className="text-[11px] text-muted-foreground">Receita líquida do dia</p>
              </div>
            </div>
            <span className={`text-lg md:text-xl font-extrabold tabular-nums ${profitColor}`}>
              {sign}{formatBRL(lucroHoje)}
            </span>
          </div>
        </div>

        {/* Contas Produzidas */}
        <div
          className="relative rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 transition-all hover:border-primary/50 mx-auto"
          style={{ width: `${widths.contas}%` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-primary/80">Contas Produzidas</p>
                <p className="text-[11px] text-muted-foreground">Validadas nas últimas 24h</p>
              </div>
            </div>
            <span className="text-lg md:text-xl font-extrabold tabular-nums text-foreground">{contasHoje}</span>
          </div>
        </div>

        {/* Remessas Registradas */}
        <div
          className="relative rounded-xl border border-border/60 bg-gradient-to-r from-muted/30 via-muted/10 to-transparent p-4 transition-all hover:border-primary/40 mx-auto"
          style={{ width: `${widths.remessas}%` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted/40 border border-border flex items-center justify-center">
                <Package className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Remessas Registradas</p>
                <p className="text-[11px] text-muted-foreground">Lotes processados hoje</p>
              </div>
            </div>
            <span className="text-lg md:text-xl font-extrabold tabular-nums text-foreground">{remessasHoje}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border/40">
        <TrendingUp className="w-3.5 h-3.5 text-primary/60" />
        <p className="text-[11px] text-muted-foreground">
          Funil sincronizado em tempo real com suas remessas do dia.
        </p>
      </div>
    </div>
  );
};
