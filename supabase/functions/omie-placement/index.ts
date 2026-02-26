// omie-placement v1 - Renders Omie ERP data inside Bitrix24 placement iframe
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OmieCredentials {
  app_key: string;
  app_secret: string;
}

async function callOmieApi(
  endpoint: string,
  call: string,
  params: Record<string, unknown>,
  credentials: OmieCredentials
) {
  const response = await fetch(`https://app.omie.com.br/api/v1/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      call,
      app_key: credentials.app_key,
      app_secret: credentials.app_secret,
      param: [params],
    }),
  });
  return await response.json();
}

async function callBitrixApi(endpoint: string, accessToken: string, clientEndpoint: string) {
  const response = await fetch(`${clientEndpoint}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ auth: accessToken }),
  });
  return await response.json();
}

async function callBitrixApiWithParams(endpoint: string, accessToken: string, clientEndpoint: string, params: Record<string, unknown>) {
  const response = await fetch(`${clientEndpoint}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ auth: accessToken, ...params }),
  });
  return await response.json();
}

function renderHTML(sections: { financeiro: any; pedidos: any; cliente: any; estoque: any; entityInfo: any; error?: string }) {
  const { financeiro, pedidos, cliente, estoque, entityInfo, error } = sections;

  if (error) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${getCSS()}</style></head>
    <body><div class="container"><div class="error-card"><h3>⚠️ Erro</h3><p>${error}</p></div></div></body></html>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Omie ERP</title>
  <style>${getCSS()}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#1E88E5"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">O</text></svg>
        <span>Omie ERP</span>
      </div>
      <span class="entity-badge">${entityInfo.type} #${entityInfo.id}</span>
    </div>

    <div class="tabs">
      <button class="tab active" onclick="showTab('financeiro')">💰 Financeiro</button>
      <button class="tab" onclick="showTab('pedidos')">📦 Pedidos/NFs</button>
      <button class="tab" onclick="showTab('cliente')">👤 Cliente</button>
      <button class="tab" onclick="showTab('estoque')">📊 Estoque</button>
    </div>

    <div id="financeiro" class="tab-content active">
      ${renderFinanceiro(financeiro)}
    </div>
    <div id="pedidos" class="tab-content">
      ${renderPedidos(pedidos)}
    </div>
    <div id="cliente" class="tab-content">
      ${renderCliente(cliente)}
    </div>
    <div id="estoque" class="tab-content">
      ${renderEstoque(estoque)}
    </div>
  </div>

  <script>
    function showTab(name) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
      document.getElementById(name).classList.add('active');
      event.target.classList.add('active');
    }
  </script>
</body>
</html>`;
}

function getCSS() {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8f9fa; color: #333; font-size: 13px; }
    .container { max-width: 900px; margin: 0 auto; padding: 16px; }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding: 12px 16px; background: linear-gradient(135deg, #1565C0, #1E88E5); border-radius: 8px; color: white; }
    .logo { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 16px; }
    .entity-badge { background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; }
    .tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 2px solid #e0e0e0; padding-bottom: 0; }
    .tab { padding: 8px 16px; border: none; background: none; cursor: pointer; font-size: 13px; font-weight: 500; color: #666; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.2s; }
    .tab.active { color: #1E88E5; border-bottom-color: #1E88E5; }
    .tab:hover { color: #1E88E5; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .card { background: white; border-radius: 8px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border: 1px solid #e8e8e8; }
    .card-title { font-weight: 600; font-size: 14px; margin-bottom: 12px; color: #1565C0; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
    .stat-card { background: #f0f7ff; border-radius: 8px; padding: 12px; text-align: center; }
    .stat-value { font-size: 20px; font-weight: 700; color: #1565C0; }
    .stat-label { font-size: 11px; color: #666; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; padding: 8px 12px; background: #f5f5f5; font-weight: 600; color: #555; border-bottom: 2px solid #e0e0e0; }
    td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; }
    tr:hover { background: #f8f9ff; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; }
    .badge-success { background: #e8f5e9; color: #2e7d32; }
    .badge-warning { background: #fff3e0; color: #e65100; }
    .badge-error { background: #ffebee; color: #c62828; }
    .badge-info { background: #e3f2fd; color: #1565c0; }
    .empty-state { text-align: center; padding: 32px; color: #999; }
    .error-card { background: #ffebee; border: 1px solid #ef9a9a; border-radius: 8px; padding: 16px; }
    .error-card h3 { color: #c62828; margin-bottom: 8px; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f5f5f5; }
    .info-label { color: #888; font-size: 12px; }
    .info-value { font-weight: 500; }
    .currency { font-family: 'Roboto Mono', monospace; }
  `;
}

function formatCurrency(value: number | undefined | null): string {
  if (value == null) return "R$ 0,00";
  return `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function renderFinanceiro(data: any) {
  if (!data || data.error) {
    return `<div class="card"><div class="empty-state">Nenhum dado financeiro encontrado</div></div>`;
  }

  const receivables = data.receivables || [];
  const totalPending = receivables.reduce((sum: number, r: any) => sum + (r.valor_documento || 0), 0);
  const overdue = receivables.filter((r: any) => new Date(r.data_vencimento) < new Date());

  return `
    <div class="stats-grid" style="margin-bottom:12px">
      <div class="stat-card">
        <div class="stat-value">${receivables.length}</div>
        <div class="stat-label">Títulos Pendentes</div>
      </div>
      <div class="stat-card">
        <div class="stat-value currency">${formatCurrency(totalPending)}</div>
        <div class="stat-label">Total a Receber</div>
      </div>
      <div class="stat-card" style="background:${overdue.length > 0 ? '#fff3e0' : '#e8f5e9'}">
        <div class="stat-value" style="color:${overdue.length > 0 ? '#e65100' : '#2e7d32'}">${overdue.length}</div>
        <div class="stat-label">Vencidos</div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Contas a Receber</div>
      ${receivables.length > 0 ? `
        <table>
          <thead><tr><th>Nº</th><th>Vencimento</th><th>Valor</th><th>Status</th></tr></thead>
          <tbody>
            ${receivables.slice(0, 10).map((r: any) => {
              const isOverdue = new Date(r.data_vencimento) < new Date();
              return `<tr>
                <td>${r.numero_documento || '-'}</td>
                <td>${r.data_vencimento || '-'}</td>
                <td class="currency">${formatCurrency(r.valor_documento)}</td>
                <td><span class="badge ${isOverdue ? 'badge-error' : 'badge-info'}">${isOverdue ? 'Vencido' : 'Pendente'}</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      ` : '<div class="empty-state">Nenhuma conta a receber</div>'}
    </div>
  `;
}

function renderPedidos(data: any) {
  if (!data || data.error) {
    return `<div class="card"><div class="empty-state">Nenhum pedido encontrado</div></div>`;
  }

  const orders = data.orders || [];
  return `
    <div class="card">
      <div class="card-title">Pedidos de Venda (${orders.length})</div>
      ${orders.length > 0 ? `
        <table>
          <thead><tr><th>Nº Pedido</th><th>Data</th><th>Valor</th><th>Etapa</th></tr></thead>
          <tbody>
            ${orders.slice(0, 15).map((o: any) => {
              const cab = o.cabecalho || {};
              const info = o.infoCadastro || {};
              return `<tr>
                <td>${cab.numero_pedido || '-'}</td>
                <td>${info.dInc || '-'}</td>
                <td class="currency">${formatCurrency(cab.valor_total || o.total_pedido)}</td>
                <td><span class="badge badge-info">${cab.etapa || '-'}</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      ` : '<div class="empty-state">Nenhum pedido encontrado</div>'}
    </div>
  `;
}

function renderCliente(data: any) {
  if (!data || data.error) {
    return `<div class="card"><div class="empty-state">Cliente não encontrado no Omie</div></div>`;
  }

  const c = data.client || {};
  return `
    <div class="card">
      <div class="card-title">Dados do Cliente no Omie</div>
      <div class="info-row"><span class="info-label">Razão Social</span><span class="info-value">${c.razao_social || '-'}</span></div>
      <div class="info-row"><span class="info-label">Nome Fantasia</span><span class="info-value">${c.nome_fantasia || '-'}</span></div>
      <div class="info-row"><span class="info-label">CNPJ/CPF</span><span class="info-value">${c.cnpj_cpf || '-'}</span></div>
      <div class="info-row"><span class="info-label">Email</span><span class="info-value">${c.email || '-'}</span></div>
      <div class="info-row"><span class="info-label">Telefone</span><span class="info-value">${c.telefone1_numero || '-'}</span></div>
      <div class="info-row"><span class="info-label">Cidade/UF</span><span class="info-value">${c.cidade || '-'}/${c.estado || '-'}</span></div>
      <div class="info-row"><span class="info-label">Cód. Omie</span><span class="info-value">${c.codigo_cliente_omie || '-'}</span></div>
      <div class="info-row"><span class="info-label">Tags</span><span class="info-value">${(c.tags || []).map((t: any) => t.tag).join(', ') || '-'}</span></div>
    </div>
  `;
}

function renderEstoque(data: any) {
  if (!data || data.error) {
    return `<div class="card"><div class="empty-state">Nenhum dado de estoque disponível</div></div>`;
  }

  const products = data.products || [];
  return `
    <div class="card">
      <div class="card-title">Posição de Estoque (${products.length} produtos)</div>
      ${products.length > 0 ? `
        <table>
          <thead><tr><th>Produto</th><th>Código</th><th>Disponível</th><th>Reservado</th><th>Preço</th></tr></thead>
          <tbody>
            ${products.slice(0, 20).map((p: any) => `<tr>
              <td>${p.descricao || p.cDescricao || '-'}</td>
              <td>${p.codigo || p.cCodigo || '-'}</td>
              <td>${p.saldo || p.nSaldo || 0}</td>
              <td>${p.reservado || 0}</td>
              <td class="currency">${formatCurrency(p.valor_unitario || p.nPrecoUnitario)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      ` : '<div class="empty-state">Nenhum produto encontrado</div>'}
    </div>
  `;
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

    // Parse placement data from Bitrix24
    let placementData: Record<string, any> = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      for (const [key, value] of formData.entries()) {
        placementData[key] = value?.toString();
      }
    } else if (contentType.includes("application/json")) {
      placementData = await req.json();
    } else {
      // Try URL params
      const url = new URL(req.url);
      for (const [key, value] of url.searchParams.entries()) {
        placementData[key] = value;
      }
    }

    console.log("omie-placement: received data keys:", Object.keys(placementData));

    const memberId = placementData.member_id || placementData.AUTH_ID && null;
    const placement = placementData.PLACEMENT || "";
    let placementOptions: Record<string, any> = {};
    
    try {
      placementOptions = typeof placementData.PLACEMENT_OPTIONS === "string"
        ? JSON.parse(placementData.PLACEMENT_OPTIONS)
        : placementData.PLACEMENT_OPTIONS || {};
    } catch { placementOptions = {}; }

    // Determine entity type and ID
    let entityType = "deal";
    let entityId = placementOptions.ID || placementOptions.id || "";

    if (placement.includes("DEAL")) entityType = "deal";
    else if (placement.includes("LEAD")) entityType = "lead";
    else if (placement.includes("CONTACT")) entityType = "contact";
    else if (placement.includes("COMPANY")) entityType = "company";

    // If no member_id, render BX24 auth redirect
    if (!memberId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<script src="https://api.bitrix24.com/api/v1/"></script>
</head><body><p>Carregando Omie ERP...</p>
<script>
BX24.init(function() {
  var auth = BX24.getAuth();
  var placement = BX24.placement.info();
  if (auth && auth.member_id) {
    var form = document.createElement('form');
    form.method = 'POST';
    form.action = '${supabaseUrl}/functions/v1/omie-placement';
    var fields = {
      member_id: auth.member_id,
      PLACEMENT: placement.placement || '',
      PLACEMENT_OPTIONS: JSON.stringify(placement.options || {}),
      access_token: auth.access_token,
      domain: auth.domain || ''
    };
    for (var key in fields) {
      var input = document.createElement('input');
      input.type = 'hidden'; input.name = key; input.value = fields[key];
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
  } else {
    document.body.innerHTML = '<p>Erro: Não foi possível autenticar</p>';
  }
});
</script></body></html>`;
      return new Response(html, { headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } });
    }

    // Get installation data
    const { data: installation } = await supabase
      .from("bitrix_installations")
      .select("*")
      .eq("member_id", memberId)
      .single();

    if (!installation) {
      return new Response(renderHTML({ financeiro: null, pedidos: null, cliente: null, estoque: null, entityInfo: { type: entityType, id: entityId }, error: "Instalação não encontrada" }), {
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Get Omie credentials
    const { data: omieConfig } = await supabase
      .from("omie_configurations")
      .select("app_key, app_secret")
      .eq("tenant_id", memberId)
      .eq("is_active", true)
      .single();

    if (!omieConfig) {
      return new Response(renderHTML({ financeiro: null, pedidos: null, cliente: null, estoque: null, entityInfo: { type: entityType, id: entityId }, error: "Omie não configurado. Acesse o painel do conector para configurar." }), {
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const credentials: OmieCredentials = { app_key: omieConfig.app_key, app_secret: omieConfig.app_secret };
    const accessToken = placementData.access_token || installation.access_token;
    const clientEndpoint = installation.client_endpoint || `https://${installation.domain}/rest/`;

    // Get entity data from Bitrix to find client info
    let companyName = "";
    let contactEmail = "";
    let cnpjCpf = "";

    try {
      if (entityType === "deal" && entityId) {
        const dealData = await callBitrixApiWithParams("crm.deal.get", accessToken, clientEndpoint, { id: entityId });
        if (dealData.result) {
          const companyId = dealData.result.COMPANY_ID;
          const contactId = dealData.result.CONTACT_ID;
          if (companyId) {
            const compData = await callBitrixApiWithParams("crm.company.get", accessToken, clientEndpoint, { id: companyId });
            companyName = compData.result?.TITLE || "";
          }
          if (contactId && !companyName) {
            const contData = await callBitrixApiWithParams("crm.contact.get", accessToken, clientEndpoint, { id: contactId });
            companyName = `${contData.result?.NAME || ''} ${contData.result?.LAST_NAME || ''}`.trim();
            contactEmail = contData.result?.EMAIL?.[0]?.VALUE || "";
          }
        }
      } else if (entityType === "lead" && entityId) {
        const leadData = await callBitrixApiWithParams("crm.lead.get", accessToken, clientEndpoint, { id: entityId });
        companyName = leadData.result?.COMPANY_TITLE || leadData.result?.TITLE || "";
        contactEmail = leadData.result?.EMAIL?.[0]?.VALUE || "";
      } else if (entityType === "contact" && entityId) {
        const contData = await callBitrixApiWithParams("crm.contact.get", accessToken, clientEndpoint, { id: entityId });
        companyName = `${contData.result?.NAME || ''} ${contData.result?.LAST_NAME || ''}`.trim();
        contactEmail = contData.result?.EMAIL?.[0]?.VALUE || "";
      } else if (entityType === "company" && entityId) {
        const compData = await callBitrixApiWithParams("crm.company.get", accessToken, clientEndpoint, { id: entityId });
        companyName = compData.result?.TITLE || "";
      }
    } catch (e) {
      console.error("omie-placement: error fetching bitrix entity:", e);
    }

    // Fetch Omie data in parallel
    const [financeiro, pedidos, cliente, estoque] = await Promise.allSettled([
      // Financeiro - contas a receber
      callOmieApi("financas/contareceber/", "ListarContasReceber", {
        pagina: 1,
        registros_por_pagina: 10,
        apenas_importado_api: "N",
      }, credentials).then(r => ({ receivables: r.conta_receber_cadastro || [] })).catch(() => ({ error: true })),

      // Pedidos
      callOmieApi("produtos/pedido/", "ListarPedidos", {
        pagina: 1,
        registros_por_pagina: 15,
        apenas_importado_api: "N",
      }, credentials).then(r => ({ orders: r.pedido_venda_produto || [] })).catch(() => ({ error: true })),

      // Cliente - search by name or CNPJ
      (companyName
        ? callOmieApi("geral/clientes/", "ListarClientes", {
            pagina: 1,
            registros_por_pagina: 1,
            clientesFiltro: { razao_social: companyName },
          }, credentials).then(r => ({
            client: r.clientes_cadastro?.[0] || null,
          }))
        : Promise.resolve({ client: null })
      ).catch(() => ({ error: true })),

      // Estoque
      callOmieApi("estoque/consulta/", "ListarPosEstoque", {
        nPagina: 1,
        nRegPorPagina: 20,
      }, credentials).then(r => ({ products: r.produtos || [] })).catch(() => ({ error: true })),
    ]);

    const html = renderHTML({
      financeiro: financeiro.status === "fulfilled" ? financeiro.value : { error: true },
      pedidos: pedidos.status === "fulfilled" ? pedidos.value : { error: true },
      cliente: cliente.status === "fulfilled" ? cliente.value : { error: true },
      estoque: estoque.status === "fulfilled" ? estoque.value : { error: true },
      entityInfo: { type: entityType, id: entityId },
    });

    return new Response(html, {
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error: unknown) {
    console.error("omie-placement error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const html = renderHTML({
      financeiro: null, pedidos: null, cliente: null, estoque: null,
      entityInfo: { type: "unknown", id: "" },
      error: errorMessage,
    });
    return new Response(html, {
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      status: 500,
    });
  }
});
