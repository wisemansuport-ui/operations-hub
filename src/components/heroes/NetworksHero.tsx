import { Radio, Activity, Target, BarChart2, Signal } from "lucide-react";

interface Props {
  totalRedes: number;
  redesLucrativas: number;
  scoreMedio: number;
  roiMedio: string;
  lucroTotal: string;
  lucroPositive: boolean;
}

// "Intelligence Center" — radar/signal identity for Networks module
export const NetworksHero = ({
  totalRedes,
  redesLucrativas,
  scoreMedio,
  roiMedio,
  lucroTotal,
  lucroPositive,
}: Props) => {
  const scoreColor = scoreMedio >= 70 ? "text-success" : scoreMedio >= 45 ? "text-primary" : "text-destructive";

  return (
    <section className="hairline-gold glass-premium rounded-3xl relative overflow-hidden">
      {/* Radar grid background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.18]">
        <div className="absolute top-1/2 right-12 -translate-y-1/2 w-[340px] h-[340px] rounded-full border border-primary/40" />
        <div className="absolute top-1/2 right-12 -translate-y-1/2 w-[240px] h-[240px] rounded-full border border-primary/30" />
        <div className="absolute top-1/2 right-12 -translate-y-1/2 w-[140px] h-[140px] rounded-full border border-primary/30" />
        <div className="absolute top-1/2 right-12 -translate-y-1/2 w-2 h-2 rounded-full bg-primary animate-pulse" />
      </div>
      <div className="absolute -top-24 -left-16 w-[420px] h-[300px] rounded-full bg-primary/[0.07] blur-3xl pointer-events-none" />

      <div className="relative grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8 p-6 md:p-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-primary/80">
              <Radio className="w-3 h-3" /> Intelligence Center
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-semibold text-muted-foreground">
              <Signal className="w-3 h-3 text-success" /> Sinal estável
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight gradient-gold-text leading-[1.05]">
            Redes de Operação
          </h1>
          <p className="text-sm text-muted-foreground/90 mt-3 max-w-md leading-relaxed">
            Radar estratégico das redes. Scoring inteligente, heatmap de capital e recomendações táticas por canal.
          </p>

          <div className="mt-5 inline-flex items-center gap-4 surface-2 rounded-xl px-4 py-3 ring-gold">
            <div className="text-center">
              <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Score médio</p>
              <p className={`text-2xl font-black tabular-nums tracking-tight ${scoreColor}`}>{scoreMedio}<span className="text-sm text-muted-foreground/60">/100</span></p>
            </div>
            <div className="h-10 w-px bg-border/60" />
            <div className="text-center">
              <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">ROI médio</p>
              <p className="text-2xl font-black tabular-nums tracking-tight text-foreground">{roiMedio}</p>
            </div>
            <div className="h-10 w-px bg-border/60" />
            <div className="text-center">
              <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Lucro total</p>
              <p className={`text-2xl font-black tabular-nums tracking-tight ${lucroPositive ? "text-success" : "text-destructive"}`}>{lucroTotal}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 content-center">
          <div className="surface-1 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className="w-3 h-3 text-primary/70" />
              <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Redes ativas</p>
            </div>
            <p className="text-2xl font-black tabular-nums tracking-tight text-foreground">{totalRedes}</p>
          </div>
          <div className="surface-1 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="w-3 h-3 text-success/80" />
              <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Lucrativas</p>
            </div>
            <p className="text-2xl font-black tabular-nums tracking-tight text-success">{redesLucrativas}</p>
          </div>
          <div className="surface-3 hairline-gold col-span-2 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <BarChart2 className="w-3 h-3 text-primary" />
              <p className="text-[9px] uppercase tracking-widest font-bold text-primary/80">Cobertura de mercado</p>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-border/50 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary/70 to-primary rounded-full transition-all duration-700"
                style={{ width: `${totalRedes > 0 ? Math.min(100, (redesLucrativas / totalRedes) * 100) : 0}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              {totalRedes > 0 ? `${Math.round((redesLucrativas / totalRedes) * 100)}% das redes operam no positivo` : "Sem dados ainda"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
