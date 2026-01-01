import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatusCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  status?: "success" | "warning" | "error" | "info" | "default";
  trend?: {
    value: number;
    label: string;
  };
}

const statusColors = {
  success: "text-green-500",
  warning: "text-yellow-500",
  error: "text-red-500",
  info: "text-blue-500",
  default: "text-muted-foreground",
};

const statusBgColors = {
  success: "bg-green-500/10",
  warning: "bg-yellow-500/10",
  error: "bg-red-500/10",
  info: "bg-blue-500/10",
  default: "bg-muted",
};

export function StatusCard({
  title,
  value,
  description,
  icon: Icon,
  status = "default",
  trend,
}: StatusCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-md transition-all hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <p
              className={cn(
                "text-xs font-medium",
                trend.value >= 0 ? "text-green-500" : "text-red-500"
              )}
            >
              {trend.value >= 0 ? "+" : ""}
              {trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-lg",
            statusBgColors[status]
          )}
        >
          <Icon className={cn("h-6 w-6", statusColors[status])} />
        </div>
      </div>
    </div>
  );
}
