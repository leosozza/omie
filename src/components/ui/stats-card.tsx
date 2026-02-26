import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatVariant = "default" | "success" | "warning" | "error" | "info";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: StatVariant;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  description?: string;
}

const variantClasses: Record<StatVariant, { icon: string; value: string; bg: string }> = {
  default: {
    icon: "text-primary",
    value: "text-foreground",
    bg: "bg-primary/10",
  },
  success: {
    icon: "text-success",
    value: "text-success",
    bg: "bg-success/10",
  },
  warning: {
    icon: "text-warning",
    value: "text-warning",
    bg: "bg-warning/10",
  },
  error: {
    icon: "text-destructive",
    value: "text-destructive",
    bg: "bg-destructive/10",
  },
  info: {
    icon: "text-info",
    value: "text-info",
    bg: "bg-info/10",
  },
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  trend,
  description,
}: StatsCardProps) {
  const { icon: iconClass, value: valueClass, bg } = variantClasses[variant];

  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className={cn("rounded-lg p-2", bg)}>
          <Icon className={cn("h-4 w-4", iconClass)} />
        </div>
      </div>

      <div className="mb-1">
        <span className={cn("text-3xl font-bold tracking-tight", valueClass)}>
          {value}
        </span>
      </div>

      {trend ? (
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-xs font-medium",
              trend.isPositive ? "text-success" : "text-destructive"
            )}
          >
            {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-muted-foreground">{trend.label}</span>
        </div>
      ) : description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
