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
}

const mainNavItems: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Configuração", url: "/config", icon: Settings },
  { title: "Mapeamento", url: "/mapping", icon: GitBranch },
  { title: "Logs", url: "/logs", icon: ScrollText },
];

const moduleNavItems: NavItem[] = [
  { title: "Finanças", url: "/financas", icon: Wallet, badge: "Novo" },
  { title: "Vendas", url: "/vendas", icon: ShoppingCart },
  { title: "Estoque", url: "/estoque", icon: Package },
  { title: "Compras", url: "/compras", icon: Truck },
  { title: "CRM", url: "/crm", icon: Users },
  { title: "Contratos", url: "/contratos", icon: FileText },
  { title: "Contador", url: "/contador", icon: Calculator },
];

const advancedNavItems: NavItem[] = [
  { title: "Robots", url: "/robots", icon: Bot },
  { title: "Placements", url: "/placements", icon: LayoutDashboard, badge: "Novo" },
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
              ? "bg-white/20 text-white font-medium"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          )}
        >
          <item.icon className="h-4 w-4" />
          {!isCollapsed && (
            <span className="flex-1">{item.title}</span>
          )}
          {!isCollapsed && item.badge && (
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-medium text-white">
              {item.badge}
            </span>
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" className="border-r-0" style={{ background: "linear-gradient(180deg, hsl(207 80% 52%) 0%, hsl(213 80% 42%) 100%)" }}>
      <SidebarHeader className="border-b border-white/10 p-4">
        <OmieLogo size={isCollapsed ? "sm" : "md"} showText={!isCollapsed} />
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            Módulos
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {moduleNavItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            Avançado
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {advancedNavItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 p-4">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-white/60">
              Conector v2.0
            </span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
