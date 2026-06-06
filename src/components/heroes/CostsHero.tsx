import { Wallet, TrendingDown, TrendingUp, Gauge, PiggyBank } from "lucide-react";

interface Props {
  custoPeriodo: string;
  lucroBruto: string;
  lucroLiquido: string;
  liquidoPositive: boolean;
  eficiencia: number; // 0-100  (1 - custo/bruto) * 100
  registros: number;
  topCategory?: { label: string; value: string };
}

// "Cost Intelligence Center" — treasury/gauge identity for Costs module
export const CostsHero = ({
  custoPeriodo,
  lucroBruto,
  lucroLiquido,
  liquidoPositive,
  eficiencia,
  registros,
  topCategory,
}: Props) => {
  const eff = Math.max(0, Math.min(100, eficiencia));
  const effColor = eff >= 70 ? "text-success" : eff >= 40 ? "text-primary" : "text-destructive";
  const strokeColor = eff >= 70 ? "hsl(var(--success))" : eff >= 40 ? "hsl(var(--primary))" : "hsl(var(--destructive))";

  // Gauge math (semi-circle)
  const r = 60;
  const c = Math.PI * r;
  const offset = c - (eff / 100) * c;

  return (
    <section className="hairline-gold glass-premium rounded-3xl relative overflow-hidden">
      <div className="absolute -bottom-24 -right-24 w-[420px] h-[420px] rounded-full bg-primary/[0.06] blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="relative grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 p-6 md:p-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-primary/80">
              <PiggyBank className="w-3 h-3" /> Cost Intelligence
            </span>
            <span className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground">{registros} lançamentos</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight gradient-gold-text leading-[1.05]">
            Custos Operacionais
          </h1>
          <p className="text-sm text-muted-foreground/90 mt-3 max-w-md leading-relaxed">
            Tesouraria operacional. Proxy, SMS, bots, VPS e gastos diretos sob radar — eficiência e margem em tempo real.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="surface-1 rounded-xl p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-success" />
                <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Bruto</p>
              </div>
              <p className="text-sm font-black tabular-nums text-foreground">{lucroBruto}</p>
            </div>
            <div className="surface-1 rounded-xl p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingDown className="w-3 h-3 text-destructive" />
                <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Custo</p>
              </div>
              <p className="text-sm font-black tabular-nums text-destructive">- {custoPeriodo}</p>
            </div>
            <div className="surface-3 hairline-gold rounded-xl p-3">
              <div className="flex items-center gap-1 mb-1">
                <Wallet className="w-3 h-3 text-primary" />
                <p className="text-[9px] uppercase tracking-widest font-bold text-primary/80">Líquido</p>
              </div>
              <p className={`text-sm font-black tabular-nums ${liquidoPositive ? "text-success" : "text-destructive"}`}>{lucroLiquido}</p>
            </div>
          </div>

          {topCategory && (
            <p className="text-[10px] text-muted-foreground mt-4">
              Maior consumo: <span className="text-foreground font-bold">{topCategory.label}</span> · {topCategory.value}
            </p>
          )}
        </div>

        {/* Right — efficiency gauge */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative">
            <svg width="160" height="100" viewBox="0 0 160 100">
              <path d="M 20 90 A 60 60 0 0 1 140 90" fill="none" stroke="hsl(var(--border))" strokeWidth="10" strokeLinecap="round" opacity="0.45" />
              <path
                d="M 20 90 A 60 60 0 0 1 140 90"
                fill="none"
                stroke={strokeColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 1s ease-out", filter: `drop-shadow(0 0 6px ${strokeColor})` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
              <div className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold text-muted-foreground">
                <Gauge className="w-3 h-3 text-primary" /> Eficiência
              </div>
              <p className={`text-3xl font-black tabular-nums tracking-tight ${effColor}`}>{Math.round(eff)}%</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 text-center max-w-[200px]">
            % do bruto que vira líquido após custos operacionais
          </p>
        </div>
      </div>
    </section>
  );
};
