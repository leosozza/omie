// bitrix-iframe v2 - with client_endpoint fix
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

    const appUrl = Deno.env.get("APP_URL");
    if (!appUrl) {
      console.error("bitrix-iframe: APP_URL not configured");
      return new Response("APP_URL not configured", { status: 500, headers: corsHeaders });
    }

    // Parse query parameters or body
    const url = new URL(req.url);
    let memberId: string | null = url.searchParams.get("member_id");
    let domain: string | null = url.searchParams.get("DOMAIN") || url.searchParams.get("domain");
    const action = url.searchParams.get("action") || "";

    // If POST, also check body
    if (req.method === "POST") {
      const contentType = req.headers.get("content-type") || "";
      
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await req.formData();
        memberId = memberId || formData.get("member_id")?.toString() || null;
        domain = domain || formData.get("DOMAIN")?.toString() || formData.get("domain")?.toString() || null;
      } else if (contentType.includes("application/json")) {
        const body = await req.json();
        memberId = memberId || body.member_id || null;
        domain = domain || body.DOMAIN || body.domain || null;
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

    // If no member_id, use BX24 JS to get auth and redirect
    if (!memberId) {
      console.log("bitrix-iframe: no member_id, returning BX24 auth HTML");
      
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Conector Omie</title>
  <script src="https://api.bitrix24.com/api/v1/"></script>
</head>
<body>
  <p>Carregando...</p>
  <script>
    BX24.init(function() {
      var auth = BX24.getAuth();
      if (auth && auth.member_id) {
        window.location.href = '${appUrl}?member_id=' + encodeURIComponent(auth.member_id) + '&domain=' + encodeURIComponent(auth.domain || '');
      } else {
        document.body.innerHTML = '<p>Erro: Não foi possível autenticar com Bitrix24</p>';
      }
    });
  </script>
</body>
</html>`;

      return new Response(html, {
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Get installation to trigger background tasks
    const { data: installation } = await supabase
      .from("bitrix_installations")
      .select("*")
      .eq("member_id", memberId)
      .single();

    if (installation) {
      // Fix client_endpoint if it points to oauth.bitrix.info
      if (installation.client_endpoint?.includes("oauth.bitrix.info") && installation.domain && installation.domain !== "oauth.bitrix.info") {
        installation.client_endpoint = `https://${installation.domain}/rest/`;
        console.log(`bitrix-iframe: fixed client_endpoint to ${installation.client_endpoint}`);
        await supabase
          .from("bitrix_installations")
          .update({ client_endpoint: installation.client_endpoint, robots_registered: false })
          .eq("member_id", memberId);
      }

      // Check if token needs refresh
      const expiresAt = new Date(installation.expires_at);
      const now = new Date();
      const fiveMinutes = 5 * 60 * 1000;

      if (expiresAt.getTime() - now.getTime() < fiveMinutes) {
        const refreshUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/bitrix-refresh-token`;
        fetch(refreshUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ member_id: memberId }),
        }).catch(console.error);
      }

      // Lazy robot registration - also check if robots actually registered successfully
      if (!installation.robots_registered) {
        registerRobots(supabase, installation).catch(console.error);
      } else {
        // Verify robots are actually registered (not just flagged)
        const { data: failedRobots } = await supabase
          .from("robots_registry")
          .select("id")
          .eq("tenant_id", memberId)
          .eq("is_registered", false)
          .limit(1);
        
        if (failedRobots && failedRobots.length > 0) {
          console.log("bitrix-iframe: found unregistered robots, retrying registration");
          installation.robots_registered = false;
          registerRobots(supabase, installation).catch(console.error);
        }
      }
    }

    // Build redirect URL based on action
    let targetPath = "/crm";
    switch (action) {
      case "config":
        targetPath = "/config";
        break;
      case "mappings":
        targetPath = "/mapping";
        break;
      case "logs":
        targetPath = "/logs";
        break;
    }

    // Use URL object to avoid double-slash issues
    const redirectUrl = new URL(appUrl);
    // Normalize: remove trailing slash from pathname, then add targetPath
    redirectUrl.pathname = redirectUrl.pathname.replace(/\/$/, "") + targetPath;
    redirectUrl.searchParams.set("member_id", memberId);
    if (domain) {
      redirectUrl.searchParams.set("domain", domain);
    }
    
    console.log("bitrix-iframe: APP_URL =", appUrl);
    console.log("bitrix-iframe: redirecting to", redirectUrl.toString());

    // Return 302 redirect
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        Location: redirectUrl.toString(),
      },
    });
  } catch (error: unknown) {
    console.error("Iframe handler error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
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
    let successCount = 0;
    console.log(`registerRobots: using client_endpoint=${installation.client_endpoint}`);
    for (const robot of multiRobots) {
      const actionOptions: Record<string, string> = {};
      for (const action of robot.actions) {
        actionOptions[action.value] = action.label;
      }

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
          result_status: { Name: "Status", Type: "string" },
          result_id: { Name: "ID do Resultado", Type: "string" },
          result_url: { Name: "URL (se aplicável)", Type: "string" },
          result_message: { Name: "Mensagem", Type: "text" },
        },
      };

      const response = await fetch(
        `${installation.client_endpoint}bizproc.robot.add`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ auth: installation.access_token, ...registerPayload }),
        }
      );

      const result = await response.json();

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

      console.log(`Robot ${robot.code} registered:`, !result.error, result.error ? result.error_description : "");
      if (!result.error) successCount++;
    }

    const allSuccess = successCount === multiRobots.length;
    await supabase
      .from("bitrix_installations")
      .update({ robots_registered: allSuccess })
      .eq("member_id", installation.member_id);

    console.log("Multi-function robots registered for:", installation.member_id);
  } catch (error) {
    console.error("Error registering robots:", error);
  }
}
