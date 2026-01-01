import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse query parameters or body
    const url = new URL(req.url);
    let memberId: string | null = url.searchParams.get("member_id");
    let domain: string | null = url.searchParams.get("DOMAIN");

    // If POST, also check body
    if (req.method === "POST") {
      const contentType = req.headers.get("content-type") || "";
      
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await req.formData();
        memberId = memberId || formData.get("member_id")?.toString() || null;
        domain = domain || formData.get("DOMAIN")?.toString() || null;
      } else if (contentType.includes("application/json")) {
        const body = await req.json();
        memberId = memberId || body.member_id || null;
        domain = domain || body.DOMAIN || null;
      }
    }

    // If we have domain but no member_id, look it up
    if (!memberId && domain) {
      const { data: installation } = await supabase
        .from("bitrix_installations")
        .select("member_id")
        .eq("domain", domain)
        .single();
      
      if (installation) {
        memberId = installation.member_id;
      }
    }

    if (!memberId) {
      // Return HTML that will redirect to the app
      const appUrl = Deno.env.get("APP_URL") || "https://lovable.dev";

      const headers = new Headers(corsHeaders);
      headers.set("content-type", "text/html; charset=utf-8");
      headers.set("cache-control", "no-store, max-age=0");
      headers.set("pragma", "no-cache");

      return new Response(
        `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Conector Omie - Loading...</title>
            <script src="https://api.bitrix24.com/api/v1/"></script>
          </head>
          <body>
            <script>
              BX24.init(function() {
                const auth = BX24.getAuth();
                if (auth && auth.member_id) {
                  window.location.href = '${appUrl}?member_id=' + auth.member_id + '&domain=' + auth.domain;
                } else {
                  document.body.innerHTML = '<p>Error: Could not authenticate with Bitrix24</p>';
                }
              });
            </script>
            <p>Loading...</p>
          </body>
        </html>`,
        { headers }
      );
    }

    // Get installation details
    const { data: installation, error: fetchError } = await supabase
      .from("bitrix_installations")
      .select("*")
      .eq("member_id", memberId)
      .single();

    if (fetchError || !installation) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Installation not found",
          member_id: memberId,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // Check if token needs refresh
    const expiresAt = new Date(installation.expires_at);
    const now = new Date();
    const fiveMinutes = 5 * 60 * 1000;

    if (expiresAt.getTime() - now.getTime() < fiveMinutes) {
      // Trigger token refresh
      const refreshUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/bitrix-refresh-token`;
      await fetch(refreshUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ member_id: memberId }),
      });
    }

    // Lazy registration: Check if robots need to be registered
    if (!installation.robots_registered) {
      // Queue robot registration (don't block the response)
      registerRobots(supabase, installation).catch(console.error);
    }

    // Get Omie configuration status
    const { data: omieConfig } = await supabase
      .from("omie_configurations")
      .select("id, is_active, last_sync")
      .eq("tenant_id", memberId)
      .single();

    const headers = new Headers(corsHeaders);
    headers.set("cache-control", "no-store, max-age=0");
    headers.set("pragma", "no-cache");

    console.log("bitrix-iframe: served status for tenant", installation.member_id);

    const statusText = [
      "Conector Omie (Bitrix24 + Omie)",
      "",
      `Tenant: ${installation.member_id}`,
      `Instalação: ${installation.status}`,
      `Omie: ${omieConfig?.is_active ? "Configurado" : "Pendente (configure App Key/App Secret)"}`,
      `Robôs: ${installation.robots_registered ? "Registrados" : "Registrando..."}`,
      "",
      omieConfig?.is_active
        ? "Status OK. Você já pode usar os robôs no Bitrix24."
        : "Próximo passo: configurar as credenciais do Omie no painel do conector.",
    ].join("\n");

    return new Response(statusText, { headers });
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// Background function to register multi-function robots
async function registerRobots(supabase: any, installation: any) {
  const multiRobots = [
    {
      code: "OMIE_VENDAS",
      name: "Omie: Vendas",
      description: "Pedidos, OS, Faturamento e Notas Fiscais",
      entity_type: "deal",
      actions: [
        { value: "criar_pedido", label: "Gerar Pedido de Venda" },
        { value: "criar_os", label: "Gerar Ordem de Serviço" },
        { value: "faturar_pedido", label: "Faturar Pedido" },
        { value: "faturar_os", label: "Faturar OS" },
        { value: "obter_nfe", label: "Obter NF-e (PDF/XML)" },
        { value: "obter_nfse", label: "Obter NFS-e (PDF/XML)" },
      ],
    },
    {
      code: "OMIE_FINANCEIRO",
      name: "Omie: Financeiro",
      description: "Boletos, PIX, Cobranças e Títulos",
      entity_type: "deal",
      actions: [
        { value: "gerar_boleto", label: "Gerar Boleto (Omie.Cash)" },
        { value: "gerar_pix", label: "Gerar QR Code PIX" },
        { value: "consultar_pagamento", label: "Consultar Status de Pagamento" },
        { value: "baixar_titulo", label: "Baixar Título Manualmente" },
        { value: "prorrogar_boleto", label: "Prorrogar Vencimento" },
        { value: "verificar_inadimplencia", label: "Verificar Inadimplência do Cliente" },
      ],
    },
    {
      code: "OMIE_ESTOQUE",
      name: "Omie: Estoque",
      description: "Posição, Reservas e Preços",
      entity_type: "deal",
      actions: [
        { value: "consultar_estoque", label: "Consultar Estoque Disponível" },
        { value: "reservar_produtos", label: "Reservar Produtos" },
        { value: "atualizar_precos", label: "Sincronizar Preços" },
        { value: "alertar_minimo", label: "Verificar Estoque Mínimo" },
      ],
    },
    {
      code: "OMIE_CLIENTES",
      name: "Omie: Clientes/CRM",
      description: "Sincronização e Histórico de Clientes",
      entity_type: "deal",
      actions: [
        { value: "sincronizar_cliente", label: "Sincronizar Cliente" },
        { value: "consultar_historico", label: "Consultar Histórico de Compras" },
        { value: "verificar_credito", label: "Verificar Limite de Crédito" },
        { value: "obter_contatos", label: "Obter Contatos do Cliente" },
      ],
    },
    {
      code: "OMIE_CONTRATOS",
      name: "Omie: Contratos",
      description: "Recorrência e Faturamento de Contratos",
      entity_type: "deal",
      actions: [
        { value: "criar_contrato", label: "Criar Contrato de Recorrência" },
        { value: "faturar_contrato", label: "Faturar Contrato do Mês" },
        { value: "consultar_renovacao", label: "Consultar Renovações Pendentes" },
        { value: "cancelar_contrato", label: "Cancelar Contrato" },
      ],
    },
  ];

  try {
    const handlerUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/omie-multi-robot`;

    for (const robot of multiRobots) {
      // Build action options for the select field
      const actionOptions: Record<string, string> = {};
      for (const action of robot.actions) {
        actionOptions[action.value] = action.label;
      }

      // Register robot in Bitrix24 with action dropdown
      const registerPayload = {
        CODE: robot.code,
        HANDLER: handlerUrl,
        AUTH_USER_ID: 1,
        NAME: robot.name,
        USE_PLACEMENT: "N",
        PLACEMENT_HANDLER: "",
        PROPERTIES: {
          action: {
            Name: "Ação",
            Type: "select",
            Required: "Y",
            Options: actionOptions,
          },
          omie_entity_id: {
            Name: "ID da Entidade Omie (opcional)",
            Type: "string",
            Required: "N",
          },
        },
        RETURN_PROPERTIES: {
          result_status: {
            Name: "Status",
            Type: "string",
          },
          result_id: {
            Name: "ID do Resultado",
            Type: "string",
          },
          result_url: {
            Name: "URL (se aplicável)",
            Type: "string",
          },
          result_message: {
            Name: "Mensagem",
            Type: "text",
          },
        },
      };

      const response = await fetch(
        `${installation.client_endpoint}bizproc.robot.add`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auth: installation.access_token,
            ...registerPayload,
          }),
        }
      );

      const result = await response.json();

      // Save to registry
      await supabase.from("robots_registry").upsert(
        {
          tenant_id: installation.member_id,
          robot_code: robot.code,
          robot_name: robot.name,
          entity_type: robot.entity_type,
          is_registered: !result.error,
          last_error: result.error_description || null,
          registered_at: !result.error ? new Date().toISOString() : null,
        },
        { onConflict: "tenant_id,robot_code" }
      );

      console.log(`Robot ${robot.code} registered:`, !result.error);
    }

    // Mark installation as robots registered
    await supabase
      .from("bitrix_installations")
      .update({ robots_registered: true })
      .eq("member_id", installation.member_id);

    console.log("Multi-function robots registered for:", installation.member_id);
  } catch (error) {
    console.error("Error registering robots:", error);
  }
}
