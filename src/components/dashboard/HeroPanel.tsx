import { TrendingUp, TrendingDown, Sparkles, Target, Activity } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

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

export const HeroPanel = ({
  title,
  subtitle,
  primaryLabel,
  primaryValue,
  primaryDelta,
  forecastLabel,
  forecastValue,
  aiInsight,
  trendData = [],
  sideStats = [],
  status,
}: HeroPanelProps) => {
  const dotClass =
    status?.tone === "live"
      ? "bg-primary animate-pulse"
      : status?.tone === "warn"
      ? "bg-warning"
      : "bg-primary";

  return (
    <section className="hairline-gold glass-premium rounded-2xl md:rounded-3xl p-5 md:p-8 relative overflow-hidden">
      {/* Atmospheric gold wash */}
      <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-16 w-[320px] h-[320px] rounded-full bg-primary/[0.04] blur-3xl pointer-events-none" />

      <div className="relative grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 lg:gap-10">
        {/* Left: hero metric */}
        <div className="flex flex-col justify-between min-h-[200px]">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              {status && (
                <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] font-semibold text-muted-foreground">
                  <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                  {status.label}
                </span>
              )}
              <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-primary/70">
                {primaryLabel}
              </span>
            </div>

            <h1 className="mt-3 text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight gradient-gold-text tabular-nums leading-none">
              {primaryValue}
            </h1>

            {primaryDelta && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full surface-2 ring-gold">
                {primaryDelta.positive ? (
                  <TrendingUp className="w-3.5 h-3.5 text-success" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                )}
                <span className={`text-xs font-semibold ${primaryDelta.positive ? "text-success" : "text-destructive"}`}>
                  {primaryDelta.value}
                </span>
              </div>
            )}

            <div className="mt-4">
              <h2 className="text-lg md:text-xl font-bold text-foreground tracking-tight">{title}</h2>
              {subtitle && <p className="text-xs md:text-sm text-muted-foreground mt-1">{subtitle}</p>}
            </div>
          </div>

          {aiInsight && (
            <div className="mt-5 flex items-start gap-3 p-3.5 rounded-xl surface-2 border-primary/15">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-primary/80 mb-0.5">
                  Motor de Decisão
                </p>
                <p className="text-xs md:text-sm text-foreground/90 leading-relaxed">{aiInsight}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: forecast + sparkline + side stats */}
        <div className="flex flex-col gap-4">
          {forecastValue && (
            <div className="surface-3 hairline-gold relative rounded-2xl p-4 md:p-5 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted-foreground inline-flex items-center gap-1.5">
                  <Target className="w-3 h-3 text-primary" />
                  {forecastLabel || "Previsão"}
                </span>
                <span className="text-[10px] font-semibold text-success/80 inline-flex items-center gap-1">
                  <Activity className="w-3 h-3" /> projeção
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-foreground tabular-nums tracking-tight">
                {forecastValue}
              </p>
              {trendData.length > 1 && (
                <div className="h-14 -mx-2 mt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                      <defs>
                        <linearGradient id="heroSpark" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Tooltip
                        cursor={false}
                        contentStyle={{
                          background: "hsl(var(--card) / 0.95)",
                          border: "1px solid hsl(var(--primary) / 0.25)",
                          borderRadius: 10,
                          fontSize: 11,
                        }}
                        labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#heroSpark)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {sideStats.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {sideStats.map((s) => (
                <div key={s.label} className="surface-1 rounded-xl p-3">
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold truncate">
                    {s.label}
                  </p>
                  <p className={`mt-1 text-base md:text-lg font-bold tabular-nums tracking-tight ${toneClass[s.tone || "primary"]}`}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
