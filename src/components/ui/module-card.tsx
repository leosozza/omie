import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type ModuleColor = 
  | "crm" 
  | "vendas" 
  | "servicos" 
  | "financas" 
  | "estoque" 
  | "compras" 
  | "producao" 
  | "contador";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: ModuleColor;
  badge?: string;
  stats?: {
    label: string;
    value: string | number;
  };
}

const colorClasses: Record<ModuleColor, { bg: string; shadow: string }> = {
  crm: { 
    bg: "bg-module-crm", 
    shadow: "hover:shadow-[0_0_30px_hsl(280_80%_60%/0.4)]" 
  },
  vendas: { 
    bg: "bg-module-vendas", 
    shadow: "hover:shadow-[0_0_30px_hsl(25_95%_55%/0.4)]" 
  },
  servicos: { 
    bg: "bg-module-servicos", 
    shadow: "hover:shadow-[0_0_30px_hsl(180_100%_42%/0.4)]" 
  },
  financas: { 
    bg: "bg-module-financas", 
    shadow: "hover:shadow-[0_0_30px_hsl(142_76%_45%/0.4)]" 
  },
  estoque: { 
    bg: "bg-module-estoque", 
    shadow: "hover:shadow-[0_0_30px_hsl(200_80%_55%/0.4)]" 
  },
  compras: { 
    bg: "bg-module-compras", 
    shadow: "hover:shadow-[0_0_30px_hsl(340_80%_55%/0.4)]" 
  },
  producao: { 
    bg: "bg-module-producao", 
    shadow: "hover:shadow-[0_0_30px_hsl(45_95%_50%/0.4)]" 
  },
  contador: { 
    bg: "bg-module-contador", 
    shadow: "hover:shadow-[0_0_30px_hsl(260_70%_55%/0.4)]" 
  },
};

export function ModuleCard({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  color, 
  badge,
  stats 
}: ModuleCardProps) {
  const { bg, shadow } = colorClasses[color];

  return (
    <Link
      to={href}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border/50",
        "bg-card p-5 transition-all duration-300",
        "hover:border-primary/30 hover:translate-y-[-2px]",
        shadow
      )}
    >
      {/* Icon Container */}
      <div
        className={cn(
          "mb-4 flex h-12 w-12 items-center justify-center rounded-lg",
          bg,
          "transition-transform duration-300 group-hover:scale-110"
        )}
      >
        <Icon className="h-6 w-6 text-primary-foreground" />
      </div>

      {/* Badge */}
      {badge && (
        <span className="absolute right-3 top-3 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
          {badge}
        </span>
      )}

      {/* Content */}
      <h3 className="mb-1 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground line-clamp-2">
        {description}
      </p>

      {/* Stats */}
      {stats && (
        <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
          <span className="text-xs text-muted-foreground">{stats.label}</span>
          <span className="text-sm font-semibold text-primary">{stats.value}</span>
        </div>
      )}

      {/* Hover Indicator */}
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-primary transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}
