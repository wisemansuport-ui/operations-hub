import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  color: "primary" | "success" | "warning" | "destructive";
}

const colorMap = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

export const KPICard = ({ title, value, change, changeType = "neutral", icon: Icon, color }: KPICardProps) => (
  <div className="glass-card rounded-xl p-5 hover:glow-primary transition-all duration-300 group">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
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
