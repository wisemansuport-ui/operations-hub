import { Sparkles, AlertTriangle, TrendingUp, Lightbulb, Shield } from "lucide-react";

export interface Insight {
  type: "opportunity" | "risk" | "forecast" | "recommendation";
  title: string;
  description: string;
  metric?: string;
  confidence?: number; // 0-100
}

const typeMap = {
  opportunity: {
    icon: TrendingUp,
    label: "Oportunidade",
    accent: "text-success",
    bg: "bg-success/10 border-success/25",
    chip: "bg-success/15 text-success border-success/30",
  },
  risk: {
    icon: AlertTriangle,
    label: "Risco",
    accent: "text-destructive",
    bg: "bg-destructive/10 border-destructive/25",
    chip: "bg-destructive/15 text-destructive border-destructive/30",
  },
  forecast: {
    icon: Sparkles,
    label: "Previsão",
    accent: "text-primary",
    bg: "bg-primary/10 border-primary/25",
    chip: "bg-primary/15 text-primary border-primary/30",
  },
  recommendation: {
    icon: Lightbulb,
    label: "Recomendação",
    accent: "text-primary",
    bg: "bg-primary/10 border-primary/25",
    chip: "bg-primary/15 text-primary border-primary/30",
  },
} as const;

export const DecisionEngine = ({ insights }: { insights: Insight[] }) => {
  if (insights.length === 0) {
    return (
      <section className="hairline-gold surface-3 rounded-2xl p-5 md:p-6 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-bold text-foreground tracking-tight">Decision Engine</h3>
          <span className="text-[9px] uppercase tracking-widest text-primary/70 font-semibold ml-1">IA</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Aguardando dados operacionais suficientes para gerar recomendações.
        </p>
      </section>
    );
  }

  return (
    <section className="hairline-gold surface-3 rounded-2xl p-5 md:p-6 relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <header className="flex items-center justify-between mb-5 relative">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center animate-pulse-glow">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground tracking-tight inline-flex items-center gap-2">
              Decision Engine
              <span className="text-[9px] uppercase tracking-widest text-primary/70 font-semibold px-1.5 py-0.5 rounded border border-primary/25 bg-primary/5">
                IA
              </span>
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Inteligência operacional · {insights.length} sinal{insights.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Shield className="w-3 h-3" /> Heurísticas sobre dados próprios
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 relative">
        {insights.map((ins, i) => {
          const cfg = typeMap[ins.type];
          const Icon = cfg.icon;
          return (
            <article
              key={i}
              className={`relative rounded-xl p-4 border ${cfg.bg} transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.3)]`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded border ${cfg.chip}`}>
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                </span>
                {typeof ins.confidence === "number" && (
                  <span className="text-[10px] text-muted-foreground font-semibold tabular-nums">
                    {ins.confidence}% conf.
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-foreground tracking-tight leading-snug">{ins.title}</h4>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-3">{ins.description}</p>
              {ins.metric && (
                <p className={`mt-3 text-base font-extrabold tabular-nums tracking-tight ${cfg.accent}`}>
                  {ins.metric}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};
