import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OMIE_API_URL = "https://app.omie.com.br/api/v1";

interface OmieCredentials {
  app_key: string;
  app_secret: string;
}

async function callOmieApi(endpoint: string, call: string, params: Record<string, unknown>, credentials: OmieCredentials) {
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

  if (!response.ok) {
    throw new Error(`Omie API error: ${response.status}`);
  }

  return response.json();
}

async function getOmieCredentials(supabase: ReturnType<typeof createClient>, tenantId: string): Promise<OmieCredentials> {
  const { data, error } = await supabase
    .from("omie_configurations")
    .select("app_key, app_secret")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    throw new Error("Omie credentials not found");
  }

  const config = data as { app_key: string; app_secret: string };
  return { app_key: config.app_key, app_secret: config.app_secret };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { tenant_id, action, data: requestData } = await req.json();

    if (!tenant_id) {
      throw new Error("tenant_id is required");
    }

    const credentials = await getOmieCredentials(supabase, tenant_id);
    let result;

    switch (action) {
      // === XMLS FISCAIS ===
      case "listar_xmls_nfe": {
        result = await callOmieApi("produtos/nfconsultar", "ListarNF", {
          nPagina: requestData?.pagina || 1,
          nRegPorPagina: requestData?.registros_por_pagina || 50,
          dDtEmissaoIni: requestData.data_inicio,
          dDtEmissaoFin: requestData.data_fim,
        }, credentials);
        break;
      }

      case "obter_xml_nfe": {
        result = await callOmieApi("produtos/nfconsultar", "ObterXmlNF", {
          nIdNF: requestData.id_nf,
        }, credentials);
        break;
      }

      case "listar_xmls_nfse": {
        result = await callOmieApi("servicos/nfse", "ListarNFSe", {
          nPagina: requestData?.pagina || 1,
          nRegPorPagina: requestData?.registros_por_pagina || 50,
          dDtEmissaoIni: requestData.data_inicio,
          dDtEmissaoFin: requestData.data_fim,
        }, credentials);
        break;
      }

      case "obter_xml_nfse": {
        result = await callOmieApi("servicos/nfse", "ObterXmlNFSe", {
          nIdNfse: requestData.id_nfse,
        }, credentials);
        break;
      }

      // === RELATÓRIOS CONTÁBEIS ===
      case "resumo_fiscal_mensal": {
        const [nfe, nfse, contasReceber, contasPagar] = await Promise.all([
          callOmieApi("produtos/nfconsultar", "ListarNF", {
            nPagina: 1,
            nRegPorPagina: 500,
            dDtEmissaoIni: requestData.data_inicio,
            dDtEmissaoFin: requestData.data_fim,
          }, credentials),
          callOmieApi("servicos/nfse", "ListarNFSe", {
            nPagina: 1,
            nRegPorPagina: 500,
            dDtEmissaoIni: requestData.data_inicio,
            dDtEmissaoFin: requestData.data_fim,
          }, credentials),
          callOmieApi("financas/contareceber", "ResumoContasReceber", {
            dDtInicio: requestData.data_inicio,
            dDtFim: requestData.data_fim,
          }, credentials),
          callOmieApi("financas/contapagar", "ResumoContasPagar", {
            dDtInicio: requestData.data_inicio,
            dDtFim: requestData.data_fim,
          }, credentials),
        ]);

        result = {
          periodo: { inicio: requestData.data_inicio, fim: requestData.data_fim },
          notas_fiscais: {
            nfe: {
              quantidade: nfe.total_de_registros || 0,
              documentos: nfe.nfCadastro || [],
            },
            nfse: {
              quantidade: nfse.nTotRegistros || 0,
              documentos: nfse.nfseCadastro || [],
            },
          },
          financeiro: {
            contas_receber: contasReceber,
            contas_pagar: contasPagar,
          },
        };
        break;
      }

      // === EXPORTAR XMLs EM LOTE ===
      case "exportar_xmls_periodo": {
        const tipo = requestData.tipo || "nfe"; // "nfe" ou "nfse"
        
        let documentos;
        if (tipo === "nfe") {
          const lista = await callOmieApi("produtos/nfconsultar", "ListarNF", {
            nPagina: 1,
            nRegPorPagina: 100,
            dDtEmissaoIni: requestData.data_inicio,
            dDtEmissaoFin: requestData.data_fim,
          }, credentials);
          
          documentos = await Promise.all(
            (lista.nfCadastro || []).slice(0, 50).map(async (nf: { nIdNF: number }) => {
              try {
                const xml = await callOmieApi("produtos/nfconsultar", "ObterXmlNF", {
                  nIdNF: nf.nIdNF,
                }, credentials);
                return { id: nf.nIdNF, xml: xml.cXml, status: "success" };
              } catch {
                return { id: nf.nIdNF, status: "error" };
              }
            })
          );
        } else {
          const lista = await callOmieApi("servicos/nfse", "ListarNFSe", {
            nPagina: 1,
            nRegPorPagina: 100,
            dDtEmissaoIni: requestData.data_inicio,
            dDtEmissaoFin: requestData.data_fim,
          }, credentials);
          
          documentos = await Promise.all(
            (lista.nfseCadastro || []).slice(0, 50).map(async (nfse: { nIdNfse: number }) => {
              try {
                const xml = await callOmieApi("servicos/nfse", "ObterXmlNFSe", {
                  nIdNfse: nfse.nIdNfse,
                }, credentials);
                return { id: nfse.nIdNfse, xml: xml.cXml, status: "success" };
              } catch {
                return { id: nfse.nIdNfse, status: "error" };
              }
            })
          );
        }

        result = {
          tipo,
          periodo: { inicio: requestData.data_inicio, fim: requestData.data_fim },
          documentos,
          total: documentos.length,
        };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Log success
    await supabase.from("integration_logs").insert({
      tenant_id,
      action: `contador_${action}`,
      entity_type: "contador",
      status: "success",
      request_payload: requestData,
      response_payload: { action, periodo: requestData?.data_inicio ? `${requestData.data_inicio} - ${requestData.data_fim}` : null },
    });

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in omie-contador:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
