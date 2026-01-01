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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { app_key, app_secret, tenant_id, save = false } = await req.json();

    if (!app_key || !app_secret) {
      throw new Error("Missing app_key or app_secret");
    }

    console.log("Validating Omie credentials for tenant:", tenant_id);

    // Test the credentials by listing empresas (minimal API call)
    const credentials: OmieCredentials = { app_key, app_secret };
    
    const result = await callOmieApi(
      "geral/empresas",
      "ListarEmpresas",
      { pagina: 1, registros_por_pagina: 1 },
      credentials
    );

    const empresa = result.empresas_cadastro?.[0];

    if (!empresa) {
      throw new Error("Credenciais válidas mas nenhuma empresa encontrada");
    }

    console.log("Omie validation successful. Empresa:", empresa.nome_fantasia);

    // If save is true and we have a tenant_id, save the configuration
    if (save && tenant_id) {
      const { error: upsertError } = await supabase
        .from("omie_configurations")
        .upsert(
          {
            tenant_id,
            app_key,
            app_secret,
            environment: "production",
            is_active: true,
            last_sync: new Date().toISOString(),
            last_error: null,
          },
          { onConflict: "tenant_id" }
        );

      if (upsertError) {
        console.error("Error saving Omie config:", upsertError);
        throw upsertError;
      }

      // Log successful configuration
      await supabase.from("integration_logs").insert({
        tenant_id,
        action: "omie_config_save",
        entity_type: "configuration",
        status: "success",
        response_payload: { empresa: empresa.nome_fantasia },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        valid: true,
        empresa: {
          cnpj: empresa.cnpj,
          nome_fantasia: empresa.nome_fantasia,
          razao_social: empresa.razao_social,
          codigo_empresa: empresa.codigo_empresa,
        },
        saved: save && tenant_id ? true : false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Omie validation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({
        success: false,
        valid: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
