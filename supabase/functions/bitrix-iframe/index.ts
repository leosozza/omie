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
        {
          headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
        }
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

    // Build the app interface HTML
    const appHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Conector Omie</title>
    <script src="https://api.bitrix24.com/api/v1/"></script>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #0d1f2d 0%, #1a3a4a 100%);
        min-height: 100vh;
        padding: 24px;
        color: #fff;
      }
      .container { max-width: 900px; margin: 0 auto; }
      .card {
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(0,212,212,0.2);
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 20px;
        backdrop-filter: blur(10px);
      }
      .header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
      }
      .logo {
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, #00d4d4 0%, #00a5a5 100%);
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #0d1f2d;
        font-weight: bold;
        font-size: 24px;
      }
      h1 { font-size: 26px; color: #fff; font-weight: 600; }
      .subtitle { color: rgba(255,255,255,0.7); font-size: 14px; margin-top: 4px; }
      .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
      .status-item {
        padding: 20px;
        background: rgba(0,212,212,0.08);
        border: 1px solid rgba(0,212,212,0.15);
        border-radius: 12px;
        transition: all 0.2s ease;
      }
      .status-item:hover { background: rgba(0,212,212,0.12); }
      .status-label { font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
      .status-value { font-size: 16px; font-weight: 600; color: #fff; }
      .status-value.success { color: #00d4d4; }
      .status-value.warning { color: #f59e0b; }
      .status-value.error { color: #ef4444; }
      .actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 20px; }
      .btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 14px 28px;
        background: linear-gradient(135deg, #00d4d4 0%, #00a5a5 100%);
        color: #0d1f2d;
        text-decoration: none;
        border-radius: 10px;
        font-weight: 600;
        font-size: 14px;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,212,212,0.3); }
      .btn-secondary {
        background: rgba(255,255,255,0.1);
        color: #fff;
        border: 1px solid rgba(255,255,255,0.2);
      }
      .btn-secondary:hover { background: rgba(255,255,255,0.15); box-shadow: none; }
      .warning-box {
        margin-top: 24px;
        padding: 20px;
        background: rgba(245,158,11,0.1);
        border-radius: 12px;
        border-left: 4px solid #f59e0b;
      }
      .warning-box strong { color: #f59e0b; font-size: 15px; }
      .warning-box p { margin-top: 8px; color: rgba(255,255,255,0.8); font-size: 14px; line-height: 1.5; }
      h2 { font-size: 18px; margin-bottom: 16px; color: #fff; font-weight: 500; }
      .robot-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
      .robot-badge {
        padding: 6px 12px;
        background: rgba(0,212,212,0.15);
        border: 1px solid rgba(0,212,212,0.3);
        border-radius: 20px;
        font-size: 12px;
        color: #00d4d4;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="card">
        <div class="header">
          <div class="logo">O</div>
          <div>
            <h1>Conector Omie</h1>
            <p class="subtitle">Integração Bitrix24 + Omie ERP</p>
          </div>
        </div>
        
        <div class="status-grid">
          <div class="status-item">
            <div class="status-label">Status</div>
            <div class="status-value success">✓ Ativo</div>
          </div>
          <div class="status-item">
            <div class="status-label">Tenant ID</div>
            <div class="status-value">${installation.member_id.substring(0, 12)}...</div>
          </div>
          <div class="status-item">
            <div class="status-label">Omie</div>
            <div class="status-value ${omieConfig?.is_active ? 'success' : 'warning'}">${omieConfig?.is_active ? '✓ Configurado' : '⚠ Pendente'}</div>
          </div>
          <div class="status-item">
            <div class="status-label">Robôs</div>
            <div class="status-value ${installation.robots_registered ? 'success' : 'warning'}">${installation.robots_registered ? '✓ Registrados' : '⏳ Registrando...'}</div>
          </div>
        </div>
        
        ${!omieConfig?.is_active ? `
        <div class="warning-box">
          <strong>⚠ Configuração Pendente</strong>
          <p>Para usar a integração, configure suas credenciais do Omie (App Key e App Secret). Acesse o painel de administração para completar a configuração.</p>
        </div>
        ` : ''}
        
        <div class="actions">
          <button class="btn" onclick="openConfig()">
            ⚙️ Configurar Omie
          </button>
          <button class="btn btn-secondary" onclick="openMappings()">
            🔗 Mapeamentos de Campos
          </button>
          <button class="btn btn-secondary" onclick="openLogs()">
            📋 Ver Logs
          </button>
        </div>
      </div>
      
      <div class="card">
        <h2>Robôs Disponíveis</h2>
        <p style="color: rgba(255,255,255,0.6); font-size: 14px; margin-bottom: 12px;">
          Use estes robôs nos fluxos de automação do Bitrix24:
        </p>
        <div class="robot-list">
          <span class="robot-badge">Omie: Vendas</span>
          <span class="robot-badge">Omie: Financeiro</span>
          <span class="robot-badge">Omie: Estoque</span>
          <span class="robot-badge">Omie: Clientes/CRM</span>
          <span class="robot-badge">Omie: Contratos</span>
        </div>
      </div>
    </div>
    
    <script>
      BX24.init(function() {
        console.log('Bitrix24 SDK initialized');
      });
      
      function openConfig() {
        // Open configuration slider
        BX24.openApplication({
          'bx24_width': 800,
          'action': 'config'
        });
      }
      
      function openMappings() {
        BX24.openApplication({
          'bx24_width': 900,
          'action': 'mappings'
        });
      }
      
      function openLogs() {
        BX24.openApplication({
          'bx24_width': 900,
          'action': 'logs'
        });
      }
    </script>
  </body>
</html>`;

    return new Response(appHtml, {
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error: unknown) {
    console.error("Iframe handler error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
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
