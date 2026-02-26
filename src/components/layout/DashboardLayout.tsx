import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useTenant } from "@/hooks/useTenant";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { memberId, isLoading } = useTenant();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const showDemoMode = !memberId;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto bg-background">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-card px-6">
            <SidebarTrigger className="-ml-2" />
            <div className="flex-1" />
            {showDemoMode && (
              <span className="rounded-full bg-warning/20 px-3 py-1 text-xs font-medium text-warning">
                Modo Demo
              </span>
            )}
          </header>
          <div className="p-6">
            {showDemoMode && (
              <Alert className="mb-6 border-warning/50 bg-warning/10">
                <AlertCircle className="h-4 w-4 text-warning" />
                <AlertTitle className="text-warning">Modo Demonstração</AlertTitle>
                <AlertDescription className="text-muted-foreground">
                  Você está visualizando o conector em modo demo. Para conectar ao Bitrix24, 
                  instale o app através do Marketplace.
                </AlertDescription>
              </Alert>
            )}
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
