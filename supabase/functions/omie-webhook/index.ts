import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OmieWebhookPayload {
  messageId: string;
  topic: string;
  event: {
    appKey: string;
    appHash: string;
    origin: string;
    created: string;
  };
  author: {
    userId: string;
    userName: string;
    userEmail: string;
  };
  [key: string]: any;
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

    const payload: OmieWebhookPayload = await req.json();

    console.log("Omie Webhook received:", payload.topic);
    console.log("App Key:", payload.event?.appKey);

    // Find tenant by app_key
    const { data: omieConfig, error: configError } = await supabase
      .from("omie_configurations")
      .select("tenant_id")
      .eq("app_key", payload.event?.appKey)
      .single();

    if (configError || !omieConfig) {
      console.error("Tenant not found for app_key:", payload.event?.appKey);
      // Still return 200 to acknowledge receipt
      return new Response(
        JSON.stringify({ success: true, message: "Webhook received but tenant not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tenantId = omieConfig.tenant_id;

    // Log the webhook event
    await supabase.from("integration_logs").insert({
      tenant_id: tenantId,
      action: `webhook_${payload.topic}`,
      entity_type: "webhook",
      entity_id: payload.messageId,
      status: "received",
      request_payload: payload,
    });

    // Process based on topic
    let processingResult = { processed: false, action: null as string | null };

    switch (payload.topic) {
      case "Pedido.Incluido":
      case "Pedido.Alterado":
      case "Pedido.Faturado":
      case "Pedido.Cancelado":
        // Queue sync back to Bitrix
        await supabase.from("sync_queue").insert({
          tenant_id: tenantId,
          action: "sync_order_to_bitrix",
          entity_type: "order",
          entity_id: payload.pedido?.nCodPed || payload.messageId,
          payload: payload,
          status: "pending",
        });
        processingResult = { processed: true, action: "queued_order_sync" };
        break;

      case "OS.Incluida":
      case "OS.Alterada":
      case "OS.Faturada":
      case "OS.Cancelada":
        // Queue sync back to Bitrix
        await supabase.from("sync_queue").insert({
          tenant_id: tenantId,
          action: "sync_os_to_bitrix",
          entity_type: "service_order",
          entity_id: payload.os?.nCodOS || payload.messageId,
          payload: payload,
          status: "pending",
        });
        processingResult = { processed: true, action: "queued_os_sync" };
        break;

      case "NF-e.Autorizada":
      case "NF-e.Cancelada":
        // Queue invoice update to Bitrix
        await supabase.from("sync_queue").insert({
          tenant_id: tenantId,
          action: "sync_nfe_to_bitrix",
          entity_type: "invoice",
          entity_id: payload.nfe?.nCodNFe || payload.messageId,
          payload: payload,
          status: "pending",
        });
        processingResult = { processed: true, action: "queued_nfe_sync" };
        break;

      case "NFS-e.Autorizada":
      case "NFS-e.Cancelada":
        // Queue invoice update to Bitrix
        await supabase.from("sync_queue").insert({
          tenant_id: tenantId,
          action: "sync_nfse_to_bitrix",
          entity_type: "invoice",
          entity_id: payload.nfse?.nCodNFSe || payload.messageId,
          payload: payload,
          status: "pending",
        });
        processingResult = { processed: true, action: "queued_nfse_sync" };
        break;

      case "Financas.ContaReceber.Incluido":
      case "Financas.ContaReceber.Alterado":
      case "Financas.ContaReceber.Baixado":
        // Queue financial status update
        await supabase.from("sync_queue").insert({
          tenant_id: tenantId,
          action: "sync_financial_to_bitrix",
          entity_type: "receivable",
          entity_id: payload.contaReceber?.nCodLanc || payload.messageId,
          payload: payload,
          status: "pending",
        });
        processingResult = { processed: true, action: "queued_financial_sync" };
        break;

      case "Cliente.Incluido":
      case "Cliente.Alterado":
        await supabase.from("sync_queue").insert({
          tenant_id: tenantId,
          action: "sync_customer_to_bitrix",
          entity_type: "customer",
          entity_id: payload.cliente?.nCodCli || payload.messageId,
          payload: payload,
          status: "pending",
        });
        processingResult = { processed: true, action: "queued_customer_sync" };
        break;

      case "Produto.Incluido":
      case "Produto.Alterado":
        await supabase.from("sync_queue").insert({
          tenant_id: tenantId,
          action: "sync_product_to_bitrix",
          entity_type: "product",
          entity_id: payload.produto?.nCodProd || payload.messageId,
          payload: payload,
          status: "pending",
        });
        processingResult = { processed: true, action: "queued_product_sync" };
        break;

      default:
        console.log("Unhandled webhook topic:", payload.topic);
        processingResult = { processed: false, action: "unhandled_topic" };
    }

    const executionTime = Date.now() - startTime;

    // Update log with processing result
    await supabase.from("integration_logs")
      .update({
        status: processingResult.processed ? "success" : "skipped",
        response_payload: processingResult,
        execution_time_ms: executionTime,
      })
      .eq("entity_id", payload.messageId)
      .eq("tenant_id", tenantId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook processed",
        topic: payload.topic,
        ...processingResult,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Webhook processing error:", error);
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
