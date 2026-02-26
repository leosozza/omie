import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to call Omie API
async function callOmieApi(
  appKey: string,
  appSecret: string,
  endpoint: string,
  call: string,
  params: Record<string, unknown>
) {
  const response = await fetch(`https://app.omie.com.br/api/v1/${endpoint}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      call,
      app_key: appKey,
      app_secret: appSecret,
      param: [params],
    }),
  });
  return response.json();
}

// Helper to call Bitrix API
async function callBitrixApi(endpoint: string, accessToken: string, method: string, params: Record<string, unknown> = {}) {
  const response = await fetch(`${endpoint}${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ auth: accessToken, ...params }),
  });
  return response.json();
}

// Get Omie credentials
async function getOmieCredentials(supabase: any, tenantId: string) {
  const { data, error } = await supabase
    .from("omie_configurations")
    .select("app_key, app_secret")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    throw new Error("Omie credentials not configured");
  }
  return data;
}

// Get Bitrix installation
async function getInstallation(supabase: any, memberId: string) {
  const { data, error } = await supabase
    .from("bitrix_installations")
    .select("*")
    .eq("member_id", memberId)
    .single();

  if (error || !data) {
    throw new Error("Installation not found");
  }
  return data;
}

// ========== VENDAS HANDLERS ==========
async function handleVendas(
  action: string,
  dealData: Record<string, unknown>,
  credentials: { app_key: string; app_secret: string },
  installation?: { client_endpoint: string; access_token: string }
) {
  const { app_key, app_secret } = credentials;

  switch (action) {
    case "criar_pedido": {
      const result = await callOmieApi(app_key, app_secret, "produtos/pedido", "IncluirPedido", {
        cabecalho: {
          codigo_cliente: dealData.UF_CRM_OMIE_CUSTOMER_ID || 0,
          data_previsao: new Date().toISOString().split("T")[0],
          etapa: "10",
        },
        det: dealData.products || [],
      });
      return {
        status: result.codigo_pedido ? "success" : "error",
        id: result.codigo_pedido?.toString() || "",
        message: result.descricao_status || result.faultstring || "Pedido criado",
      };
    }

    case "criar_os": {
      const result = await callOmieApi(app_key, app_secret, "servicos/os", "IncluirOS", {
        Cabecalho: {
          nCodCli: dealData.UF_CRM_OMIE_CUSTOMER_ID || 0,
          cEtapa: "10",
        },
        ServicosPrestados: dealData.services || [],
      });
      return {
        status: result.nCodOS ? "success" : "error",
        id: result.nCodOS?.toString() || "",
        message: result.cDescStatus || result.faultstring || "OS criada",
      };
    }

    case "faturar_pedido": {
      const orderId = dealData.UF_CRM_OMIE_ORDER_ID;
      if (!orderId) {
        return { status: "error", id: "", message: "ID do pedido não encontrado" };
      }
      const result = await callOmieApi(app_key, app_secret, "produtos/pedido", "TrocarEtapaPedido", {
        codigo_pedido: Number(orderId),
        etapa: "50",
      });
      return {
        status: result.codigo_pedido ? "success" : "error",
        id: orderId.toString(),
        message: result.descricao_status || result.faultstring || "Pedido faturado",
      };
    }

    case "faturar_os": {
      const osId = dealData.UF_CRM_OMIE_OS_ID;
      if (!osId) {
        return { status: "error", id: "", message: "ID da OS não encontrado" };
      }
      const result = await callOmieApi(app_key, app_secret, "servicos/os", "TrocarEtapaOS", {
        nCodOS: Number(osId),
        cEtapa: "50",
      });
      return {
        status: result.nCodOS ? "success" : "error",
        id: osId.toString(),
        message: result.cDescStatus || result.faultstring || "OS faturada",
      };
    }

    case "obter_nfe": {
      const orderId = dealData.UF_CRM_OMIE_ORDER_ID;
      if (!orderId) {
        return { status: "error", id: "", message: "ID do pedido não encontrado" };
      }
      const result = await callOmieApi(app_key, app_secret, "produtos/nfconsultar", "ConsultarNF", {
        nCodPed: Number(orderId),
      });

      // Save PDF URL to deal and add timeline comment
      if (result.cLinkDanfe && installation) {
        try {
          await callBitrixApi(installation.client_endpoint, installation.access_token,
            "crm.deal.update", {
              id: dealData.ID,
              fields: {
                UF_CRM_OMIE_NF_URL: result.cLinkDanfe,
                UF_CRM_OMIE_NF_NUMBER: result.nNF?.toString(),
              }
            });

          await callBitrixApi(installation.client_endpoint, installation.access_token,
            "crm.timeline.comment.add", {
              fields: {
                ENTITY_ID: dealData.ID,
                ENTITY_TYPE: "deal",
                COMMENT: `📄 NF-e #${result.nNF} emitida com sucesso.\n\n📥 DANFE (PDF): ${result.cLinkDanfe}`,
              }
            });
        } catch (e) {
          console.error("Erro ao salvar NF-e no deal:", e);
        }
      }

      return {
        status: result.cLinkDanfe ? "success" : "error",
        id: result.nNF?.toString() || "",
        url: result.cLinkDanfe || "",
        message: result.cLinkDanfe ? "NF-e encontrada" : "NF-e não encontrada",
      };
    }

    case "obter_nfse": {
      const osId = dealData.UF_CRM_OMIE_OS_ID;
      if (!osId) {
        return { status: "error", id: "", message: "ID da OS não encontrado" };
      }
      const result = await callOmieApi(app_key, app_secret, "servicos/nfse", "ConsultarNFSe", {
        nCodOS: Number(osId),
      });

      // Save PDF URL to deal and add timeline comment
      if (result.cLinkNFSe && installation) {
        try {
          await callBitrixApi(installation.client_endpoint, installation.access_token,
            "crm.deal.update", {
              id: dealData.ID,
              fields: {
                UF_CRM_OMIE_NF_URL: result.cLinkNFSe,
                UF_CRM_OMIE_NF_NUMBER: result.nNFSe?.toString(),
              }
            });

          await callBitrixApi(installation.client_endpoint, installation.access_token,
            "crm.timeline.comment.add", {
              fields: {
                ENTITY_ID: dealData.ID,
                ENTITY_TYPE: "deal",
                COMMENT: `📄 NFS-e #${result.nNFSe} emitida com sucesso.\n\n📥 PDF da NFS-e: ${result.cLinkNFSe}`,
              }
            });
        } catch (e) {
          console.error("Erro ao salvar NFS-e no deal:", e);
        }
      }

      return {
        status: result.cLinkNFSe ? "success" : "error",
        id: result.nNFSe?.toString() || "",
        url: result.cLinkNFSe || "",
        message: result.cLinkNFSe ? "NFS-e encontrada" : "NFS-e não encontrada",
      };
    }

    default:
      return { status: "error", id: "", message: `Ação desconhecida: ${action}` };
  }
}

// ========== FINANCEIRO HANDLERS ==========
async function handleFinanceiro(
  action: string,
  dealData: Record<string, unknown>,
  credentials: { app_key: string; app_secret: string }
) {
  const { app_key, app_secret } = credentials;

  switch (action) {
    case "gerar_boleto": {
      const orderId = dealData.UF_CRM_OMIE_ORDER_ID;
      if (!orderId) {
        return { status: "error", id: "", message: "ID do pedido não encontrado" };
      }
      const result = await callOmieApi(app_key, app_secret, "financas/contareceber", "GerarBoleto", {
        nCodPedido: Number(orderId),
      });
      return {
        status: result.cLinkBoleto ? "success" : "error",
        id: result.nCodTitulo?.toString() || "",
        url: result.cLinkBoleto || "",
        message: result.cLinkBoleto ? "Boleto gerado" : result.faultstring || "Erro ao gerar boleto",
      };
    }

    case "gerar_pix": {
      const orderId = dealData.UF_CRM_OMIE_ORDER_ID;
      if (!orderId) {
        return { status: "error", id: "", message: "ID do pedido não encontrado" };
      }
      const result = await callOmieApi(app_key, app_secret, "financas/contareceber", "GerarPix", {
        nCodPedido: Number(orderId),
      });
      return {
        status: result.cQrCode ? "success" : "error",
        id: result.nCodTitulo?.toString() || "",
        url: result.cQrCode || "",
        message: result.cQrCode ? "PIX gerado" : result.faultstring || "Erro ao gerar PIX",
      };
    }

    case "consultar_pagamento": {
      const orderId = dealData.UF_CRM_OMIE_ORDER_ID;
      if (!orderId) {
        return { status: "error", id: "", message: "ID do pedido não encontrado" };
      }
      const result = await callOmieApi(app_key, app_secret, "financas/contareceber", "ConsultarContaReceber", {
        nCodPedido: Number(orderId),
      });
      const statusMap: Record<string, string> = {
        ABERTO: "Pendente",
        LIQUIDADO: "Pago",
        ATRASADO: "Atrasado",
        CANCELADO: "Cancelado",
      };
      return {
        status: "success",
        id: result.nCodTitulo?.toString() || "",
        message: statusMap[result.cStatus] || result.cStatus || "Desconhecido",
      };
    }

    case "baixar_titulo": {
      const tituloId = dealData.UF_CRM_OMIE_TITULO_ID;
      if (!tituloId) {
        return { status: "error", id: "", message: "ID do título não encontrado" };
      }
      const result = await callOmieApi(app_key, app_secret, "financas/contareceber", "LancarRecebimento", {
        nCodTitulo: Number(tituloId),
        dDtCredito: new Date().toISOString().split("T")[0],
      });
      return {
        status: result.nCodTitulo ? "success" : "error",
        id: tituloId.toString(),
        message: result.nCodTitulo ? "Título baixado" : result.faultstring || "Erro ao baixar",
      };
    }

    case "prorrogar_boleto": {
      const tituloId = dealData.UF_CRM_OMIE_TITULO_ID;
      const novaData = dealData.UF_CRM_NOVA_DATA_VENCIMENTO;
      if (!tituloId || !novaData) {
        return { status: "error", id: "", message: "ID do título ou nova data não encontrados" };
      }
      const result = await callOmieApi(app_key, app_secret, "financas/contareceber", "AlterarContaReceber", {
        nCodTitulo: Number(tituloId),
        dDtVenc: novaData,
      });
      return {
        status: result.nCodTitulo ? "success" : "error",
        id: tituloId.toString(),
        message: result.nCodTitulo ? "Vencimento prorrogado" : result.faultstring || "Erro ao prorrogar",
      };
    }

    case "verificar_inadimplencia": {
      const customerId = dealData.UF_CRM_OMIE_CUSTOMER_ID;
      if (!customerId) {
        return { status: "error", id: "", message: "ID do cliente não encontrado" };
      }
      const result = await callOmieApi(app_key, app_secret, "financas/contareceber", "ListarContasReceber", {
        nCodCliente: Number(customerId),
        cStatus: "ATRASADO",
      });
      const totalAtrasado = result.conta_receber_cadastro?.length || 0;
      return {
        status: "success",
        id: customerId.toString(),
        message: totalAtrasado > 0 ? `${totalAtrasado} título(s) em atraso` : "Sem inadimplência",
      };
    }

    default:
      return { status: "error", id: "", message: `Ação desconhecida: ${action}` };
  }
}

// ========== ESTOQUE HANDLERS ==========
async function handleEstoque(
  action: string,
  dealData: Record<string, unknown>,
  credentials: { app_key: string; app_secret: string }
) {
  const { app_key, app_secret } = credentials;

  switch (action) {
    case "consultar_estoque": {
      const productId = dealData.UF_CRM_OMIE_PRODUCT_ID;
      if (!productId) {
        return { status: "error", id: "", message: "ID do produto não encontrado" };
      }
      const result = await callOmieApi(app_key, app_secret, "estoque/consulta", "ConsultarPosicaoEstoque", {
        nCodProd: Number(productId),
      });
      return {
        status: "success",
        id: productId.toString(),
        message: `Estoque: ${result.nQtdePosicao || 0} unidades`,
      };
    }

    case "reservar_produtos": {
      const productId = dealData.UF_CRM_OMIE_PRODUCT_ID;
      const quantity = dealData.UF_CRM_QUANTITY || 1;
      if (!productId) {
        return { status: "error", id: "", message: "ID do produto não encontrado" };
      }
      const result = await callOmieApi(app_key, app_secret, "estoque/ajuste", "IncluirAjusteEstoque", {
        nCodProd: Number(productId),
        nQtde: -Number(quantity),
        cObs: `Reserva via Bitrix24 - Deal ${dealData.ID}`,
      });
      return {
        status: result.nCodAjuste ? "success" : "error",
        id: result.nCodAjuste?.toString() || "",
        message: result.nCodAjuste ? `${quantity} unidades reservadas` : result.faultstring || "Erro ao reservar",
      };
    }

    case "atualizar_precos": {
      const result = await callOmieApi(app_key, app_secret, "geral/produtos", "ListarProdutos", {
        pagina: 1,
        registros_por_pagina: 50,
        apenas_importado_api: "N",
      });
      return {
        status: "success",
        id: "",
        message: `${result.total_de_registros || 0} produtos com preços atualizados`,
      };
    }

    case "alertar_minimo": {
      const result = await callOmieApi(app_key, app_secret, "estoque/consulta", "ListarPosicaoEstoque", {
        dDataPosicao: new Date().toISOString().split("T")[0],
      });
      const abaixoMinimo = result.posicao_estoque?.filter(
        (p: { nQtdePosicao: number; nQtdeMin: number }) => p.nQtdePosicao < p.nQtdeMin
      )?.length || 0;
      return {
        status: "success",
        id: "",
        message: abaixoMinimo > 0 ? `${abaixoMinimo} produtos abaixo do mínimo` : "Estoque OK",
      };
    }

    default:
      return { status: "error", id: "", message: `Ação desconhecida: ${action}` };
  }
}

// ========== CLIENTES HANDLERS ==========
async function handleClientes(
  action: string,
  dealData: Record<string, unknown>,
  credentials: { app_key: string; app_secret: string }
) {
  const { app_key, app_secret } = credentials;

  switch (action) {
    case "sincronizar_cliente": {
      const contactName = dealData.CONTACT_NAME || dealData.COMPANY_TITLE;
      const email = dealData.CONTACT_EMAIL;
      const phone = dealData.CONTACT_PHONE;
      const cnpjCpf = dealData.UF_CRM_CNPJ_CPF;

      const result = await callOmieApi(app_key, app_secret, "geral/clientes", "IncluirCliente", {
        razao_social: contactName,
        email,
        telefone1_numero: phone,
        cnpj_cpf: cnpjCpf,
        tags: [{ tag: "Bitrix24" }],
      });
      return {
        status: result.codigo_cliente_omie ? "success" : "error",
        id: result.codigo_cliente_omie?.toString() || "",
        message: result.codigo_cliente_omie ? "Cliente sincronizado" : result.faultstring || "Erro ao sincronizar",
      };
    }

    case "consultar_historico": {
      const customerId = dealData.UF_CRM_OMIE_CUSTOMER_ID;
      if (!customerId) {
        return { status: "error", id: "", message: "ID do cliente não encontrado" };
      }
      const result = await callOmieApi(app_key, app_secret, "produtos/pedido", "ListarPedidos", {
        filtrar_por_cliente: Number(customerId),
        pagina: 1,
        registros_por_pagina: 10,
      });
      return {
        status: "success",
        id: customerId.toString(),
        message: `${result.total_de_registros || 0} pedidos encontrados`,
      };
    }

    case "verificar_credito": {
      const customerId = dealData.UF_CRM_OMIE_CUSTOMER_ID;
      if (!customerId) {
        return { status: "error", id: "", message: "ID do cliente não encontrado" };
      }
      const result = await callOmieApi(app_key, app_secret, "geral/clientes", "ConsultarCliente", {
        codigo_cliente_omie: Number(customerId),
      });
      return {
        status: "success",
        id: customerId.toString(),
        message: `Limite: R$ ${result.valor_limite_credito || 0}`,
      };
    }

    case "obter_contatos": {
      const customerId = dealData.UF_CRM_OMIE_CUSTOMER_ID;
      if (!customerId) {
        return { status: "error", id: "", message: "ID do cliente não encontrado" };
      }
      const result = await callOmieApi(app_key, app_secret, "geral/clientes", "ConsultarCliente", {
        codigo_cliente_omie: Number(customerId),
      });
      const contatos = result.contatos?.length || 0;
      return {
        status: "success",
        id: customerId.toString(),
        message: `${contatos} contato(s) encontrado(s)`,
      };
    }

    default:
      return { status: "error", id: "", message: `Ação desconhecida: ${action}` };
  }
}

// ========== CONTRATOS HANDLERS ==========
async function handleContratos(
  action: string,
  dealData: Record<string, unknown>,
  credentials: { app_key: string; app_secret: string }
) {
  const { app_key, app_secret } = credentials;

  switch (action) {
    case "criar_contrato": {
      const customerId = dealData.UF_CRM_OMIE_CUSTOMER_ID;
      if (!customerId) {
        return { status: "error", id: "", message: "ID do cliente não encontrado" };
      }
      const result = await callOmieApi(app_key, app_secret, "servicos/contrato", "IncluirContrato", {
        cabecalho: {
          nCodCli: Number(customerId),
          cEtapa: "10",
        },
        servicos: dealData.services || [],
      });
      return {
        status: result.nCodCtr ? "success" : "error",
        id: result.nCodCtr?.toString() || "",
        message: result.nCodCtr ? "Contrato criado" : result.faultstring || "Erro ao criar contrato",
      };
    }

    case "faturar_contrato": {
      const contratoId = dealData.UF_CRM_OMIE_CONTRACT_ID;
      if (!contratoId) {
        return { status: "error", id: "", message: "ID do contrato não encontrado" };
      }
      const result = await callOmieApi(app_key, app_secret, "servicos/contrato", "FaturarContrato", {
        nCodCtr: Number(contratoId),
        dDtFat: new Date().toISOString().split("T")[0],
      });
      return {
        status: result.nCodOS ? "success" : "error",
        id: result.nCodOS?.toString() || "",
        message: result.nCodOS ? "Contrato faturado" : result.faultstring || "Erro ao faturar",
      };
    }

    case "consultar_renovacao": {
      const result = await callOmieApi(app_key, app_secret, "servicos/contrato", "ListarContratos", {
        filtrar_por_etapa: "50",
        pagina: 1,
        registros_por_pagina: 50,
      });
      return {
        status: "success",
        id: "",
        message: `${result.total_de_registros || 0} contratos pendentes de renovação`,
      };
    }

    case "cancelar_contrato": {
      const contratoId = dealData.UF_CRM_OMIE_CONTRACT_ID;
      if (!contratoId) {
        return { status: "error", id: "", message: "ID do contrato não encontrado" };
      }
      const result = await callOmieApi(app_key, app_secret, "servicos/contrato", "TrocarEtapaContrato", {
        nCodCtr: Number(contratoId),
        cEtapa: "99",
      });
      return {
        status: result.nCodCtr ? "success" : "error",
        id: contratoId.toString(),
        message: result.nCodCtr ? "Contrato cancelado" : result.faultstring || "Erro ao cancelar",
      };
    }

    default:
      return { status: "error", id: "", message: `Ação desconhecida: ${action}` };
  }
}

// ========== MAIN HANDLER ==========
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

    // Parse robot data from Bitrix24
    const contentType = req.headers.get("content-type") || "";
    // deno-lint-ignore no-explicit-any
    let robotData: any = {};

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      for (const [key, value] of formData.entries()) {
        robotData[key] = value;
      }
    } else {
      robotData = await req.json();
    }

    console.log("Robot request received:", JSON.stringify(robotData, null, 2));

    // Extract essential data
    const authMemberId = robotData.auth?.member_id || robotData.member_id;
    const robotCode = robotData.code as string;
    const action = robotData.properties?.action || robotData.action;
    const documentId = robotData.document_id;

    if (!authMemberId || !robotCode || !action) {
      throw new Error("Missing required fields: member_id, code, or action");
    }

    // Get credentials
    const installation = await getInstallation(supabase, authMemberId as string);
    const omieCredentials = await getOmieCredentials(supabase, authMemberId as string);

    // Get deal data from Bitrix
    let dealData: Record<string, unknown> = {};
    if (documentId) {
      const dealId = Array.isArray(documentId) ? documentId[2] : documentId;
      const dealResult = await callBitrixApi(
        installation.client_endpoint,
        installation.access_token,
        "crm.deal.get",
        { id: dealId }
      );
      dealData = dealResult.result || {};
    }

    // Add properties from robot call
    dealData = { ...dealData, ...(robotData.properties || {}) };

    // Route to appropriate handler
    let result: { status: string; id: string; url?: string; message: string };

    switch (robotCode) {
      case "OMIE_VENDAS":
        result = await handleVendas(action as string, dealData, omieCredentials, installation);
        break;
      case "OMIE_FINANCEIRO":
        result = await handleFinanceiro(action as string, dealData, omieCredentials);
        break;
      case "OMIE_ESTOQUE":
        result = await handleEstoque(action as string, dealData, omieCredentials);
        break;
      case "OMIE_CLIENTES":
        result = await handleClientes(action as string, dealData, omieCredentials);
        break;
      case "OMIE_CONTRATOS":
        result = await handleContratos(action as string, dealData, omieCredentials);
        break;
      default:
        result = { status: "error", id: "", message: `Robot desconhecido: ${robotCode}` };
    }

    // Log execution
    await supabase.from("integration_logs").insert({
      tenant_id: authMemberId,
      action: `${robotCode}:${action}`,
      entity_type: "deal",
      entity_id: dealData.ID?.toString() || "",
      status: result.status,
      error_message: result.status === "error" ? result.message : null,
      request_payload: robotData,
      response_payload: result,
      execution_time_ms: Date.now() - startTime,
    });

    // Return in Bitrix24 expected format
    return new Response(
      JSON.stringify({
        result: {
          return_values: {
            result_status: result.status,
            result_id: result.id,
            result_url: result.url || "",
            result_message: result.message,
          },
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Multi-robot handler error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({
        result: {
          return_values: {
            result_status: "error",
            result_id: "",
            result_url: "",
            result_message: errorMessage,
          },
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
