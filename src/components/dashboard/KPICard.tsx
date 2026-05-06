import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  color: "primary" | "success" | "warning" | "destructive";
  tooltip?: string;
}

const colorMap = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

export const KPICard = ({ title, value, change, changeType = "neutral", icon: Icon, color, tooltip }: KPICardProps) => (
  <div className="glass-card rounded-xl p-5 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.2)] hover:border-primary/40 transition-all duration-300 group relative">
    <div className="flex items-start justify-between">
      <div className="relative">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          {tooltip && (
            <div className="group/tooltip relative flex items-center justify-center">
              <div className="w-4 h-4 rounded-full border border-muted-foreground/30 flex items-center justify-center text-[10px] font-bold text-muted-foreground cursor-help hover:text-primary hover:border-primary/50 transition-colors">
                i
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-black/90 backdrop-blur-md text-[10px] text-foreground border border-primary/20 rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 text-center pointer-events-none">
                {tooltip}
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-black/90 border-r border-b border-primary/20 rotate-45 -mt-1" />
              </div>
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-foreground mt-1.5">{value}</p>
        {change && (
          <div className="flex items-center gap-1 mt-2">
            {changeType === "positive" ? (
              <TrendingUp className="w-3 h-3 text-success" />
            ) : changeType === "negative" ? (
              <TrendingDown className="w-3 h-3 text-destructive" />
            ) : null}
            <span className={`text-xs font-medium ${
              changeType === "positive" ? "text-success" : changeType === "negative" ? "text-destructive" : "text-muted-foreground"
            }`}>
              {change}
            </span>
          </div>
        )}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]} group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </div>
);
