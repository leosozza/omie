import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Key, 
  Building2,
  ExternalLink,
  Shield
} from "lucide-react";
import { toast } from "sonner";

export default function ConfigOmie() {
  const { memberId } = useTenant();
  const queryClient = useQueryClient();
  
  const [appKey, setAppKey] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    empresa?: { nome_fantasia: string; cnpj: string };
    error?: string;
  } | null>(null);

  // Fetch existing config
  const { data: existingConfig, isLoading } = useQuery({
    queryKey: ["omie-config", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const { data } = await supabase
        .from("omie_configurations")
        .select("*")
        .eq("tenant_id", memberId)
        .single();
      return data;
    },
    enabled: !!memberId,
  });

  // Validate credentials
  const validateCredentials = async () => {
    if (!appKey || !appSecret) {
      toast.error("Preencha todos os campos");
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("omie-validate", {
        body: {
          app_key: appKey,
          app_secret: appSecret,
          tenant_id: memberId,
          save: false,
        },
      });

      if (error) throw error;

      setValidationResult({
        valid: data.valid,
        empresa: data.empresa,
        error: data.error,
      });

      if (data.valid) {
        toast.success("Credenciais válidas!");
      } else {
        toast.error(data.error || "Credenciais inválidas");
      }
    } catch (error: any) {
      setValidationResult({
        valid: false,
        error: error.message || "Erro ao validar credenciais",
      });
      toast.error("Erro ao validar credenciais");
    } finally {
      setIsValidating(false);
    }
  };

  // Save configuration
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("omie-validate", {
        body: {
          app_key: appKey,
          app_secret: appSecret,
          tenant_id: memberId || "demo",
          save: true,
        },
      });

      if (error) throw error;
      if (!data.valid) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["omie-config"] });
      toast.success("Configuração salva com sucesso!");
      setAppKey("");
      setAppSecret("");
      setValidationResult(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar configuração");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Configuração Omie
        </h1>
        <p className="text-muted-foreground">
          Configure as credenciais da API Omie para sincronização
        </p>
      </div>

      {/* Current Status */}
      {existingConfig && (
        <Alert className={existingConfig.is_active ? "border-green-500/50 bg-green-500/10" : "border-red-500/50 bg-red-500/10"}>
          {existingConfig.is_active ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <AlertTitle className={existingConfig.is_active ? "text-green-500" : "text-red-500"}>
            {existingConfig.is_active ? "Conectado" : "Desconectado"}
          </AlertTitle>
          <AlertDescription className={existingConfig.is_active ? "text-green-400" : "text-red-400"}>
            {existingConfig.is_active 
              ? `Última sincronização: ${existingConfig.last_sync ? new Date(existingConfig.last_sync).toLocaleString("pt-BR") : "Nunca"}`
              : existingConfig.last_error || "Configure suas credenciais abaixo"
            }
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Credentials Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Credenciais da API
            </CardTitle>
            <CardDescription>
              Obtenha suas credenciais no painel de desenvolvedor Omie
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="app_key">App Key</Label>
              <Input
                id="app_key"
                type="text"
                placeholder="Sua App Key da Omie"
                value={appKey}
                onChange={(e) => setAppKey(e.target.value)}
                className="bg-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="app_secret">App Secret</Label>
              <Input
                id="app_secret"
                type="password"
                placeholder="Seu App Secret da Omie"
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                className="bg-input"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={validateCredentials}
                disabled={isValidating || !appKey || !appSecret}
              >
                {isValidating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="mr-2 h-4 w-4" />
                )}
                Validar
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!validationResult?.valid || saveMutation.isPending}
                className="gradient-primary"
              >
                {saveMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar Configuração
              </Button>
            </div>

            {/* Validation Result */}
            {validationResult && (
              <Alert className={validationResult.valid ? "border-green-500/50 bg-green-500/10" : "border-red-500/50 bg-red-500/10"}>
                {validationResult.valid ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <AlertTitle className={validationResult.valid ? "text-green-500" : "text-red-500"}>
                  {validationResult.valid ? "Credenciais Válidas" : "Credenciais Inválidas"}
                </AlertTitle>
                <AlertDescription className={validationResult.valid ? "text-green-400" : "text-red-400"}>
                  {validationResult.valid && validationResult.empresa ? (
                    <>
                      Empresa: {validationResult.empresa.nome_fantasia}
                      <br />
                      CNPJ: {validationResult.empresa.cnpj}
                    </>
                  ) : (
                    validationResult.error
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Como obter as credenciais?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal space-y-3 pl-4 text-sm text-muted-foreground">
              <li>
                Acesse o{" "}
                <a
                  href="https://developer.omie.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Portal de Desenvolvedores Omie
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>Faça login com sua conta Omie</li>
              <li>Acesse "Minhas Aplicações" ou crie uma nova</li>
              <li>Copie o <strong>App Key</strong> e <strong>App Secret</strong></li>
              <li>Cole os valores nos campos ao lado</li>
              <li>Clique em "Validar" para testar a conexão</li>
              <li>Se tudo estiver correto, clique em "Salvar"</li>
            </ol>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Segurança</AlertTitle>
              <AlertDescription>
                Suas credenciais são armazenadas de forma segura e criptografada. 
                Nunca compartilhe seu App Secret com terceiros.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
