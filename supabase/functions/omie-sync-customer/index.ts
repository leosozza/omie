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

    const { tenant_id, action, customer_data, bitrix_entity_id } = await req.json();

    if (!tenant_id) {
      throw new Error("Missing tenant_id");
    }

    const credentials = await getOmieCredentials(supabase, tenant_id);

    let result;
    let logAction = action;

    switch (action) {
      case "create":
        // Create customer in Omie
        const createPayload = {
          codigo_cliente_integracao: bitrix_entity_id || `BITRIX_${Date.now()}`,
          razao_social: customer_data.company_name || customer_data.name,
          nome_fantasia: customer_data.name,
          cnpj_cpf: customer_data.document || "",
          email: customer_data.email || "",
          telefone1_numero: customer_data.phone || "",
          endereco: customer_data.address || "",
          endereco_numero: customer_data.address_number || "",
          bairro: customer_data.neighborhood || "",
          cidade: customer_data.city || "",
          estado: customer_data.state || "",
          cep: customer_data.zip || "",
        };

        result = await callOmieApi(
          "geral/clientes",
          "IncluirCliente",
          createPayload,
          credentials
        );
        break;

      case "update":
        // Update existing customer
        if (!customer_data.codigo_cliente_omie) {
          throw new Error("Missing codigo_cliente_omie for update");
        }

        const updatePayload = {
          codigo_cliente: customer_data.codigo_cliente_omie,
          razao_social: customer_data.company_name || customer_data.name,
          nome_fantasia: customer_data.name,
          email: customer_data.email || "",
          telefone1_numero: customer_data.phone || "",
        };

        result = await callOmieApi(
          "geral/clientes",
          "AlterarCliente",
          updatePayload,
          credentials
        );
        break;

      case "search":
        // Search for customer by document or email
        const searchPayload = {
          pagina: 1,
          registros_por_pagina: 10,
          clientesFiltro: {
            cnpj_cpf: customer_data.document || "",
            email: customer_data.email || "",
          },
        };

        result = await callOmieApi(
          "geral/clientes",
          "ListarClientes",
          searchPayload,
          credentials
        );
        break;

      case "get":
        // Get specific customer
        if (!customer_data.codigo_cliente_omie) {
          throw new Error("Missing codigo_cliente_omie");
        }

        result = await callOmieApi(
          "geral/clientes",
          "ConsultarCliente",
          { codigo_cliente: customer_data.codigo_cliente_omie },
          credentials
        );
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const executionTime = Date.now() - startTime;

    // Log successful sync
    await supabase.from("integration_logs").insert({
      tenant_id,
      action: `customer_${logAction}`,
      entity_type: "customer",
      entity_id: bitrix_entity_id,
      status: "success",
      request_payload: customer_data,
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
    console.error("Customer sync error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Log error
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.clone().json().catch(() => ({}));
    
    await supabase.from("integration_logs").insert({
      tenant_id: body.tenant_id,
      action: `customer_${body.action || "unknown"}`,
      entity_type: "customer",
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
