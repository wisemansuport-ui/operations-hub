import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  color: "primary" | "success" | "warning" | "destructive";
  tooltip?: string;
  highlight?: boolean;
}

const colorMap = {
  primary: "bg-primary/10 text-primary border-primary/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
};

export const KPICard = ({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  color,
  tooltip,
  highlight = false,
}: KPICardProps) => (
  <div
    className={`relative rounded-2xl p-5 transition-all duration-300 group overflow-hidden min-h-[140px] flex ${
      highlight
        ? "hairline-gold surface-3 hover:-translate-y-1 hover:shadow-[0_18px_50px_-18px_hsl(var(--primary)/0.45)]"
        : "surface-2 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_-16px_hsl(var(--primary)/0.3)] hover:border-primary/40"
    }`}
  >
    {highlight && (
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
    )}
    <div className="flex items-start justify-between gap-3 relative w-full">
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em] leading-snug break-words">
            {title}
          </p>
          {tooltip && (
            <div className="group/tooltip relative flex items-center justify-center shrink-0 mt-0.5">
              <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 flex items-center justify-center text-[9px] font-bold text-muted-foreground cursor-help hover:text-primary hover:border-primary/50 transition-colors">
                i
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-popover/95 backdrop-blur-md text-[10px] text-foreground border border-primary/20 rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 text-center pointer-events-none">
                {tooltip}
              </div>
            </div>
          )}
        </div>

        <p
          className={`mt-2 font-extrabold text-foreground tabular-nums tracking-tight leading-none ${
            highlight ? "text-3xl md:text-[28px]" : "text-2xl"
          }`}
        >
          {value}
        </p>
        {change && (
          <div className="flex items-center gap-1 mt-2.5">
            {changeType === "positive" ? (
              <TrendingUp className="w-3 h-3 text-success" />
            ) : changeType === "negative" ? (
              <TrendingDown className="w-3 h-3 text-destructive" />
            ) : null}
            <span
              className={`text-[11px] font-medium leading-snug break-words ${
                changeType === "positive"
                  ? "text-success"
                  : changeType === "negative"
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {change}
            </span>
          </div>
        )}
      </div>
      <div
        className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${colorMap[color]} group-hover:scale-110 transition-transform`}
      >
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </div>
);
