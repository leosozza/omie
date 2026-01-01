import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OMIE_API_URL = "https://app.omie.com.br/api/v1";

interface OmieCredentials {
  app_key: string;
  app_secret: string;
}

async function callOmieApi(
  endpoint: string,
  call: string,
  params: any,
  credentials: OmieCredentials
) {
  const response = await fetch(`${OMIE_API_URL}/${endpoint}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      call,
      app_key: credentials.app_key,
      app_secret: credentials.app_secret,
      param: [params],
    }),
  });

  const data = await response.json();

  if (data.faultstring) {
    throw new Error(data.faultstring);
  }

  return data;
}

async function getOmieCredentials(supabase: any, tenantId: string): Promise<OmieCredentials> {
  const { data, error } = await supabase
    .from("omie_configurations")
    .select("app_key, app_secret")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    throw new Error("Omie credentials not found or inactive");
  }

  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { 
      tenant_id, 
      action = "create",
      service_order_data,
      bitrix_deal_id,
    } = await req.json();

    if (!tenant_id) {
      throw new Error("Missing tenant_id");
    }

    const credentials = await getOmieCredentials(supabase, tenant_id);

    let result;

    switch (action) {
      case "create":
        // Prepare service items
        const servicos = (service_order_data.services || []).map((service: any, index: number) => ({
          nSeqItem: index + 1,
          cCodServico: service.code || "",
          cCodServMun: service.municipal_code || "",
          cDescricao: service.description || service.name,
          nQtde: service.quantity || 1,
          nValUnit: service.unit_price || 0,
          cRetemISS: service.retain_iss || "N",
        }));

        const createPayload = {
          Cabecalho: {
            cCodIntOS: bitrix_deal_id || `BITRIX_OS_${Date.now()}`,
            nCodCli: service_order_data.customer_omie_id,
            dDtPrevisao: service_order_data.expected_date || new Date().toISOString().split("T")[0],
            cEtapa: service_order_data.stage || "10", // 10 = Em aberto
            cCodParc: service_order_data.payment_code || "000",
          },
          ServicosPrestados: servicos,
          InformacoesAdicionais: {
            nCodCateg: service_order_data.category_code || "",
            nCodCC: service_order_data.account_code || "",
          },
          Observacoes: {
            cObsOS: service_order_data.notes || `OS criada via Bitrix24 - Deal #${bitrix_deal_id}`,
          },
        };

        result = await callOmieApi(
          "servicos/os",
          "IncluirOS",
          createPayload,
          credentials
        );
        break;

      case "status":
        // Get OS status
        if (!service_order_data.codigo_os) {
          throw new Error("Missing codigo_os");
        }

        result = await callOmieApi(
          "servicos/os",
          "StatusOS",
          { nCodOS: service_order_data.codigo_os },
          credentials
        );
        break;

      case "get":
        // Get OS details
        if (!service_order_data.codigo_os) {
          throw new Error("Missing codigo_os");
        }

        result = await callOmieApi(
          "servicos/os",
          "ConsultarOS",
          { nCodOS: service_order_data.codigo_os },
          credentials
        );
        break;

      case "list":
        // List service orders
        result = await callOmieApi(
          "servicos/os",
          "ListarOS",
          {
            nPagina: service_order_data.page || 1,
            nRegPorPagina: service_order_data.per_page || 50,
            dDtIncDe: service_order_data.date_from || "",
            dDtIncAte: service_order_data.date_to || "",
            cEtapa: service_order_data.stage_filter || "",
          },
          credentials
        );
        break;

      case "cancel":
        // Cancel OS
        if (!service_order_data.codigo_os) {
          throw new Error("Missing codigo_os");
        }

        result = await callOmieApi(
          "servicos/os",
          "TrocarEtapaOS",
          {
            nCodOS: service_order_data.codigo_os,
            cEtapa: "90", // 90 = Cancelada
          },
          credentials
        );
        break;

      case "invoice":
        // Generate NFS-e for the OS
        if (!service_order_data.codigo_os) {
          throw new Error("Missing codigo_os");
        }

        result = await callOmieApi(
          "servicos/os",
          "FaturarOS",
          { nCodOS: service_order_data.codigo_os },
          credentials
        );
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const executionTime = Date.now() - startTime;

    // Log successful operation
    await supabase.from("integration_logs").insert({
      tenant_id,
      action: `service_order_${action}`,
      entity_type: "service_order",
      entity_id: bitrix_deal_id || service_order_data.codigo_os,
      status: "success",
      request_payload: service_order_data,
      response_payload: result,
      execution_time_ms: executionTime,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        execution_time_ms: executionTime,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const executionTime = Date.now() - startTime;
    console.error("Service order operation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.clone().json().catch(() => ({}));

    await supabase.from("integration_logs").insert({
      tenant_id: body.tenant_id,
      action: `service_order_${body.action || "unknown"}`,
      entity_type: "service_order",
      status: "error",
      error_message: errorMessage,
      execution_time_ms: executionTime,
    });

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
