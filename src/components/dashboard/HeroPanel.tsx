import { TrendingUp, TrendingDown, Sparkles, Zap } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface HeroPanelProps {
  title: string;
  subtitle?: string;
  primaryLabel: string;
  primaryValue: string;
  primaryDelta?: { value: string; positive: boolean };
  forecastLabel?: string;
  forecastValue?: string;
  aiInsight?: string;
  trendData?: Array<{ name: string; value: number }>;
  sideStats?: Array<{ label: string; value: string; tone?: "primary" | "success" | "destructive" | "muted" }>;
  status?: { label: string; tone: "live" | "warn" | "ok" };
}

const toneClass = {
  primary: "text-primary",
  success: "text-success",
  destructive: "text-destructive",
  muted: "text-muted-foreground",
} as const;

/**
 * Airy-linear "Command center" hero — editorial, restrained, no heavy card chrome.
 * Headline + projection w/ sparkline on top, hairline-divided KPI strip below,
 * Motor de Decisão as a minimal accent-bar note at the bottom.
 */
export const HeroPanel = ({
  title,
  subtitle,
  primaryLabel,
  primaryValue,
  primaryDelta,
  forecastLabel = "Projeção fim do período",
  forecastValue,
  aiInsight,
  trendData = [],
  sideStats = [],
  status,
}: HeroPanelProps) => {
  const dotClass =
    status?.tone === "live"
      ? "bg-success animate-pulse"
      : status?.tone === "warn"
      ? "bg-warning"
      : "bg-primary";

  return (
    <section className="relative">
      {/* Soft background glow */}
      <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-primary/[0.05] blur-[120px] pointer-events-none" />

      <div className="relative flex flex-col gap-10 px-1 sm:px-2">
        {/* Header — eyebrow + headline + hero metric + projection */}
        <div className="pb-7 border-b border-primary/10">
          <div className="flex items-center gap-2 mb-4">
            {status && (
              <>
                <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                <span className="text-[10px] uppercase tracking-[0.22em] text-primary/70 font-semibold">
                  {status.label}
                </span>
                <span className="text-[10px] text-muted-foreground/40">·</span>
              </>
            )}
            <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">
              {primaryLabel}
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            {/* Left — title + hero metric */}
            <div className="space-y-3 min-w-0">
              <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter leading-[1.02]">
                {title}
                <span className="text-primary">.</span>
              </h1>
              {subtitle && (
                <p className="text-muted-foreground max-w-md text-sm leading-relaxed">{subtitle}</p>
              )}
              <div className="flex items-center gap-3 pt-2 flex-wrap">
                <span className="text-4xl md:text-5xl font-black text-primary tabular-nums tracking-tighter leading-none">
                  {primaryValue}
                </span>
                {primaryDelta && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border ${
                      primaryDelta.positive
                        ? "text-success border-success/20 bg-success/5"
                        : "text-destructive border-destructive/20 bg-destructive/5"
                    }`}
                  >
                    {primaryDelta.positive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {primaryDelta.value}
                  </span>
                )}
              </div>
            </div>

            {/* Right — projection + sparkline */}
            {forecastValue && (
              <div className="flex flex-col lg:items-end gap-2 shrink-0">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                  {forecastLabel}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-2xl md:text-3xl font-bold text-foreground tabular-nums tracking-tight">
                    {forecastValue}
                  </span>
                  {trendData.length > 1 && (
                    <div className="w-28 h-10 opacity-90">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="heroSpark" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="hsl(var(--primary))"
                            strokeWidth={1.75}
                            fill="url(#heroSpark)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* KPI strip */}
        {sideStats.length > 0 && (
          <div
            className="grid gap-8 md:gap-12"
            style={{ gridTemplateColumns: `repeat(${Math.min(sideStats.length, 4)}, minmax(0, 1fr))` }}
          >
            {sideStats.map((s, i) => (
              <div key={`${s.label}-${i}`} className="group">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 transition-colors group-hover:text-primary">
                  {s.label}
                </p>
                <p
                  className={`text-2xl md:text-3xl font-black tabular-nums tracking-tight ${
                    toneClass[s.tone || "primary"]
                  }`}
                >
                  {s.value}
                </p>
                <div className="mt-4 h-px w-8 bg-primary/30" />
              </div>
            ))}
          </div>
        )}

        {/* Motor de Decisão — minimal accent-bar note */}
        {aiInsight && (
          <div className="flex items-start gap-4 pt-2">
            <div className="w-[2px] self-stretch min-h-10 bg-primary/60 rounded-full shadow-[0_0_8px_hsl(var(--primary)/0.35)]" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-primary">
                  Motor de Decisão
                </span>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed max-w-3xl">{aiInsight}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
