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

    return new Response(
      JSON.stringify({
        success: true,
        installation: {
          id: installation.id,
          domain: installation.domain,
          member_id: installation.member_id,
          status: installation.status,
          fields_provisioned: installation.fields_provisioned,
          robots_registered: installation.robots_registered,
        },
        omie_configured: !!omieConfig?.is_active,
        omie_last_sync: omieConfig?.last_sync,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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

// Background function to register robots
async function registerRobots(supabase: any, installation: any) {
  const robots = [
    {
      code: "OMIE_CREATE_ORDER",
      name: "Gerar Pedido na Omie",
      handler: "omie-robot-handler",
      entity_type: "deal",
    },
    {
      code: "OMIE_CREATE_SERVICE_ORDER",
      name: "Gerar OS na Omie",
      handler: "omie-robot-handler",
      entity_type: "deal",
    },
    {
      code: "OMIE_CHECK_PAYMENT",
      name: "Consultar Status Financeiro",
      handler: "omie-robot-handler",
      entity_type: "deal",
    },
    {
      code: "OMIE_GET_INVOICE",
      name: "Obter Nota Fiscal (PDF)",
      handler: "omie-robot-handler",
      entity_type: "deal",
    },
    {
      code: "OMIE_SYNC_STOCK",
      name: "Sincronizar Estoque",
      handler: "omie-robot-handler",
      entity_type: "deal",
    },
  ];

  try {
    const handlerUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/omie-robot-handler`;

    for (const robot of robots) {
      // Register robot in Bitrix24
      const registerPayload = {
        CODE: robot.code,
        HANDLER: handlerUrl,
        AUTH_USER_ID: 1,
        NAME: robot.name,
        USE_PLACEMENT: "N",
        PLACEMENT_HANDLER: "",
        RETURN_FIELDS: [],
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

      // Save to registry (ignore if already exists)
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
    }

    // Mark installation as robots registered
    await supabase
      .from("bitrix_installations")
      .update({ robots_registered: true })
      .eq("member_id", installation.member_id);

    console.log("Robots registered for:", installation.member_id);
  } catch (error) {
    console.error("Error registering robots:", error);
  }
}
