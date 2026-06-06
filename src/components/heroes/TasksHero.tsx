// Airy linear hero — generic editorial header used across Planilhas segments.

export interface HeroKpi {
  label: string;
  value: string;
  accent?: boolean; // gold treatment for the value + full underline
  tone?: "default" | "destructive" | "success" | "muted";
}

interface Props {
  eyebrow?: string;
  title: string;
  accentDot?: string; // gold dot at the end of title (default ".")
  description?: string;
  pulseDotClass?: string; // tailwind color class for the leading status dot
  progressLabel?: string;
  progressValue?: number; // 0-100, when defined shows the progress block
  kpis: HeroKpi[];
}

const toneClass = (tone?: HeroKpi["tone"]) => {
  switch (tone) {
    case "destructive":
      return "text-destructive";
    case "success":
      return "text-success";
    case "muted":
      return "text-muted-foreground/60";
    default:
      return "text-foreground";
  }
};

export const TasksHero = ({
  eyebrow = "Operational Workspace",
  title,
  accentDot = ".",
  description,
  pulseDotClass = "bg-primary",
  progressLabel = "Progresso médio",
  progressValue,
  kpis,
}: Props) => {
  const progress = typeof progressValue === "number" ? Math.max(0, Math.min(100, progressValue)) : null;

  return (
    <section className="relative">
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/[0.05] blur-[120px] rounded-full pointer-events-none" />

      <div className="relative flex flex-col gap-6 md:gap-10 px-1 sm:px-2 min-w-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 md:gap-6 pb-5 md:pb-7 border-b border-primary/10">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${pulseDotClass}`} />
              <span className="text-[10px] uppercase tracking-[0.22em] text-primary/60 font-semibold truncate">
                {eyebrow}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-foreground tracking-tighter leading-[1.02] break-words">
              {title}
              {accentDot && <span className="text-primary">{accentDot}</span>}
            </h1>
            {description && (
              <p className="text-muted-foreground max-w-md text-xs sm:text-sm leading-relaxed">{description}</p>
            )}
          </div>

          {progress !== null && (
            <div className="flex flex-col md:items-end gap-2 w-full md:w-auto">
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {progressLabel}
                </span>
                <span className="text-xl md:text-2xl font-bold text-primary tabular-nums">{Math.round(progress)}%</span>
              </div>
              <div className="w-full md:w-48 h-1 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* KPI strip */}
        <div
          className="grid gap-4 sm:gap-6 md:gap-12 grid-cols-2"
          style={{ ['--md-cols' as string]: Math.min(kpis.length, 4) }}
        >
          {kpis.map((kpi, i) => (
            <div
              key={`${kpi.label}-${i}`}
              className="group min-w-0"
              style={{ gridColumn: 'span 1 / span 1' }}
            >
              <p
                className={`text-[10px] uppercase tracking-widest mb-1 transition-colors truncate ${
                  kpi.accent ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                }`}
              >
                {kpi.label}
              </p>
              <p
                className={`text-xl sm:text-2xl md:text-3xl font-black tabular-nums tracking-tight break-words ${
                  kpi.accent ? "text-primary" : toneClass(kpi.tone)
                }`}
              >
                {kpi.value}
              </p>
              <div className={`mt-3 md:mt-4 h-px ${kpi.accent ? "w-full bg-primary/10" : "w-8 bg-primary/30"}`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
