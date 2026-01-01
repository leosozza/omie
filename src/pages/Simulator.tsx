import { useState } from "react";
import { useTenant } from "@/hooks/useTenant";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  TestTube, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  AlertTriangle,
  Code
} from "lucide-react";
import { toast } from "sonner";

const TEST_SCENARIOS = [
  {
    id: "validate_omie",
    name: "Validar Credenciais Omie",
    description: "Testa se as credenciais da Omie estão configuradas corretamente",
    endpoint: "omie-validate",
  },
  {
    id: "create_customer",
    name: "Criar Cliente na Omie",
    description: "Simula a criação de um cliente na Omie",
    endpoint: "omie-sync-customer",
  },
  {
    id: "create_order",
    name: "Criar Pedido na Omie",
    description: "Simula a criação de um pedido de venda",
    endpoint: "omie-create-order",
  },
];

const SAMPLE_PAYLOADS: Record<string, any> = {
  validate_omie: {
    app_key: "sua_app_key",
    app_secret: "sua_app_secret",
    save: false,
  },
  create_customer: {
    action: "create",
    customer_data: {
      name: "Empresa Teste",
      company_name: "Empresa Teste LTDA",
      email: "teste@empresa.com",
      phone: "11999999999",
      document: "12345678000199",
    },
    bitrix_entity_id: "TEST_123",
  },
  create_order: {
    action: "create",
    order_data: {
      customer_omie_id: 123456,
      expected_date: new Date().toISOString().split("T")[0],
      products: [
        {
          code: "PROD001",
          name: "Produto Teste",
          quantity: 2,
          unit_price: 100.0,
        },
      ],
      notes: "Pedido de teste",
    },
    bitrix_deal_id: "DEAL_456",
  },
};

export default function Simulator() {
  const { memberId } = useTenant();
  const [selectedScenario, setSelectedScenario] = useState<string>("");
  const [payload, setPayload] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    data?: any;
    error?: string;
    executionTime?: number;
  } | null>(null);

  const handleScenarioChange = (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    const samplePayload = SAMPLE_PAYLOADS[scenarioId];
    if (samplePayload) {
      // Add tenant_id to payload
      const fullPayload = { ...samplePayload, tenant_id: memberId || "demo" };
      setPayload(JSON.stringify(fullPayload, null, 2));
    }
    setResult(null);
  };

  const runTest = async () => {
    if (!selectedScenario) {
      toast.error("Selecione um cenário de teste");
      return;
    }

    let parsedPayload;
    try {
      parsedPayload = JSON.parse(payload);
    } catch (e) {
      toast.error("JSON inválido no payload");
      return;
    }

    const scenario = TEST_SCENARIOS.find((s) => s.id === selectedScenario);
    if (!scenario) return;

    setIsRunning(true);
    setResult(null);

    const startTime = Date.now();

    try {
      const { data, error } = await supabase.functions.invoke(scenario.endpoint, {
        body: parsedPayload,
      });

      const executionTime = Date.now() - startTime;

      if (error) {
        setResult({
          success: false,
          error: error.message,
          executionTime,
        });
      } else {
        setResult({
          success: data.success !== false,
          data,
          executionTime,
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || "Erro desconhecido",
        executionTime: Date.now() - startTime,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const scenario = TEST_SCENARIOS.find((s) => s.id === selectedScenario);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Simulador de Testes
        </h1>
        <p className="text-muted-foreground">
          Teste as integrações antes de colocar em produção
        </p>
      </div>

      {/* Warning */}
      <Alert className="border-warning/50 bg-warning/10">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertTitle className="text-warning">Atenção</AlertTitle>
        <AlertDescription className="text-warning/80">
          O simulador executa chamadas reais às APIs. Alguns testes podem criar 
          dados reais na Omie. Use com cuidado em ambientes de produção.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Test Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5 text-primary" />
              Configurar Teste
            </CardTitle>
            <CardDescription>
              Selecione um cenário e configure o payload
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Cenário de Teste</Label>
              <Select value={selectedScenario} onValueChange={handleScenarioChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cenário" />
                </SelectTrigger>
                <SelectContent>
                  {TEST_SCENARIOS.map((scenario) => (
                    <SelectItem key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {scenario && (
                <p className="text-sm text-muted-foreground">{scenario.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Payload (JSON)
              </Label>
              <Textarea
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                placeholder='{"key": "value"}'
                className="min-h-[200px] font-mono text-sm bg-input"
              />
            </div>

            <Button
              onClick={runTest}
              disabled={!selectedScenario || isRunning}
              className="w-full gradient-primary shadow-glow"
            >
              {isRunning ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Executar Teste
            </Button>
          </CardContent>
        </Card>

        {/* Test Result */}
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
            <CardDescription>
              {result
                ? `Executado em ${result.executionTime}ms`
                : "Execute um teste para ver o resultado"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <Alert
                  className={
                    result.success
                      ? "border-green-500/50 bg-green-500/10"
                      : "border-red-500/50 bg-red-500/10"
                  }
                >
                  {result.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <AlertTitle className={result.success ? "text-green-500" : "text-red-500"}>
                    {result.success ? "Teste Passou" : "Teste Falhou"}
                  </AlertTitle>
                  {result.error && (
                    <AlertDescription className="text-red-400">
                      {result.error}
                    </AlertDescription>
                  )}
                </Alert>

                {result.data && (
                  <div>
                    <Label className="text-muted-foreground">Response</Label>
                    <ScrollArea className="mt-2 h-[300px] rounded border bg-muted/50 p-3">
                      <pre className="text-xs">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <TestTube className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  Nenhum teste executado ainda
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
