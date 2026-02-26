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

const colorClasses: Record<ModuleColor, string> = {
  crm: "bg-module-crm",
  vendas: "bg-module-vendas",
  servicos: "bg-module-servicos",
  financas: "bg-module-financas",
  estoque: "bg-module-estoque",
  compras: "bg-module-compras",
  producao: "bg-module-producao",
  contador: "bg-module-contador",
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
  const bg = colorClasses[color];

  return (
    <Link
      to={href}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border",
        "bg-card p-5 transition-all duration-200",
        "hover:shadow-md hover:border-primary/30"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            bg,
            "transition-transform duration-200 group-hover:scale-105"
          )}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        {badge && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {badge}
          </span>
        )}
      </div>

      <h3 className="mb-1 text-base font-semibold text-foreground group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground line-clamp-2">
        {description}
      </p>

      {stats && (
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">{stats.label}</span>
          <span className="text-sm font-semibold text-primary">{stats.value}</span>
        </div>
      )}
    </Link>
  );
}
