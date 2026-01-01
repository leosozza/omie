import { 
  LayoutDashboard, 
  Settings, 
  GitBranch, 
  ScrollText, 
  Bot, 
  TestTube,
  Wallet,
  ShoppingCart,
  Package,
  Users,
  FileText,
  Calculator,
  Truck,
  BarChart3,
  LucideIcon,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { OmieLogo } from "./OmieLogo";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: string;
  color?: string;
}

const mainNavItems: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Configuração", url: "/config", icon: Settings },
  { title: "Mapeamento", url: "/mapping", icon: GitBranch },
  { title: "Logs", url: "/logs", icon: ScrollText },
];

const moduleNavItems: NavItem[] = [
  { title: "Finanças", url: "/financas", icon: Wallet, color: "text-module-financas", badge: "Novo" },
  { title: "Vendas", url: "/vendas", icon: ShoppingCart, color: "text-module-vendas" },
  { title: "Estoque", url: "/estoque", icon: Package, color: "text-module-estoque" },
  { title: "Compras", url: "/compras", icon: Truck, color: "text-module-compras" },
  { title: "CRM", url: "/crm", icon: Users, color: "text-module-crm" },
  { title: "Contratos", url: "/contratos", icon: FileText, color: "text-module-servicos" },
  { title: "Contador", url: "/contador", icon: Calculator, color: "text-module-contador" },
];

const advancedNavItems: NavItem[] = [
  { title: "Robots", url: "/robots", icon: Bot },
  { title: "Simulador", url: "/simulator", icon: TestTube },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const renderNavItem = (item: NavItem) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200",
            location.pathname === item.url
              ? "bg-primary/10 text-primary border-l-2 border-primary"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-primary"
          )}
        >
          <item.icon className={cn("h-4 w-4", item.color || (location.pathname === item.url ? "text-primary" : ""))} />
          {!isCollapsed && (
            <span className="flex-1">{item.title}</span>
          )}
          {!isCollapsed && item.badge && (
            <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              {item.badge}
            </span>
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <OmieLogo size={isCollapsed ? "sm" : "md"} showText={!isCollapsed} />
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Principal */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Módulos */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Módulos
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {moduleNavItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Avançado */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Avançado
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {advancedNavItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-muted-foreground">
              Conector v2.0
            </span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
