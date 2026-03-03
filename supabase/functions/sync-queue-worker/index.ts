import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map sync_queue actions to edge function names and payloads
const ACTION_ROUTES: Record<string, { functionName: string; buildPayload: (item: any) => any }> = {
  // Customer sync
  sync_customer_to_bitrix: {
    functionName: "omie-sync-customer",
    buildPayload: (item) => ({
      tenant_id: item.tenant_id,
      action: "sync_to_bitrix",
      customer_data: item.payload,
    }),
  },
  sync_customer_to_omie: {
    functionName: "omie-sync-customer",
    buildPayload: (item) => ({
      tenant_id: item.tenant_id,
      action: "create",
      customer_data: item.payload,
    }),
  },
  // Orders
  sync_order_to_bitrix: {
    functionName: "omie-create-order",
    buildPayload: (item) => ({
      tenant_id: item.tenant_id,
      action: "sync_to_bitrix",
      ...item.payload,
    }),
  },
  // Service Orders
  sync_os_to_bitrix: {
    functionName: "omie-create-service-order",
    buildPayload: (item) => ({
      tenant_id: item.tenant_id,
      action: "sync_to_bitrix",
      ...item.payload,
    }),
  },
  // NF-e
  sync_nfe_to_bitrix: {
    functionName: "omie-invoice-handler",
    buildPayload: (item) => ({
      tenant_id: item.tenant_id,
      action: "sync_nfe",
      ...item.payload,
    }),
  },
  // NFS-e
  sync_nfse_to_bitrix: {
    functionName: "omie-invoice-handler",
    buildPayload: (item) => ({
      tenant_id: item.tenant_id,
      action: "sync_nfse",
      ...item.payload,
    }),
  },
  // Financial
  sync_financial_to_bitrix: {
    functionName: "omie-financas",
    buildPayload: (item) => ({
      tenant_id: item.tenant_id,
      action: "sync_to_bitrix",
      ...item.payload,
    }),
  },
  // Stock
  sync_stock_to_bitrix: {
    functionName: "omie-estoque",
    buildPayload: (item) => ({
      tenant_id: item.tenant_id,
      action: "sync_to_bitrix",
      ...item.payload,
    }),
  },
  // Purchases
  sync_purchase_to_bitrix: {
    functionName: "omie-compras",
    buildPayload: (item) => ({
      tenant_id: item.tenant_id,
      action: "sync_to_bitrix",
      data: item.payload,
    }),
  },
  // Contracts
  sync_contract_to_bitrix: {
    functionName: "omie-contratos-crm",
    buildPayload: (item) => ({
      tenant_id: item.tenant_id,
      action: "sync_to_bitrix",
      ...item.payload,
    }),
  },
  // Products
  sync_product_to_bitrix: {
    functionName: "omie-produtos",
    buildPayload: (item) => ({
      tenant_id: item.tenant_id,
      action: "sync_to_bitrix",
      data: item.payload,
    }),
  },
};

const BATCH_SIZE = 10;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check if this is a reprocess request
  let body: any = {};
  try {
    body = await req.json();
  } catch { /* empty body for cron calls */ }

  if (body?.action === "reprocess") {
    return await handleReprocess(supabase, body);
  }

  try {
    // Fetch pending items ready for processing
    const { data: items, error: fetchError } = await supabase
      .from("sync_queue")
      .select("*")
      .in("status", ["pending", "retrying"])
      .or("next_retry_at.is.null,next_retry_at.lte.now()")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      throw new Error(`Failed to fetch queue: ${fetchError.message}`);
    }

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        processed: 0, 
        message: "No pending items" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${items.length} queue items`);

    const results = { success: 0, error: 0, skipped: 0 };

    for (const item of items) {
      const itemStart = Date.now();

      // Mark as processing
      await supabase
        .from("sync_queue")
        .update({ status: "processing" })
        .eq("id", item.id);

      const route = ACTION_ROUTES[item.action];

      if (!route) {
        // Unknown action — mark as error
        await supabase
          .from("sync_queue")
          .update({
            status: "error",
            error_message: `Unknown action: ${item.action}`,
            processed_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        await supabase.from("integration_logs").insert({
          tenant_id: item.tenant_id,
          action: `queue_${item.action}`,
          entity_type: item.entity_type,
          entity_id: item.entity_id,
          status: "error",
          error_message: `Unknown action: ${item.action}`,
          execution_time_ms: Date.now() - itemStart,
        });

        results.skipped++;
        continue;
      }

      try {
        // Call the target edge function
        const payload = route.buildPayload(item);
        const functionUrl = `${supabaseUrl}/functions/v1/${route.functionName}`;

        const response = await fetch(functionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify(payload),
        });

        const responseData = await response.json().catch(() => ({}));

        if (response.ok && responseData.success !== false) {
          // Success
          await supabase
            .from("sync_queue")
            .update({
              status: "success",
              processed_at: new Date().toISOString(),
              error_message: null,
            })
            .eq("id", item.id);

          await supabase.from("integration_logs").insert({
            tenant_id: item.tenant_id,
            action: `queue_${item.action}`,
            entity_type: item.entity_type,
            entity_id: item.entity_id,
            status: "success",
            request_payload: payload,
            response_payload: responseData,
            execution_time_ms: Date.now() - itemStart,
          });

          results.success++;
        } else {
          // API returned error
          const errorMsg = responseData.error || responseData.message || `HTTP ${response.status}`;
          await handleRetry(supabase, item, errorMsg, itemStart, payload);
          results.error++;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown processing error";
        await handleRetry(supabase, item, errorMsg, itemStart, route.buildPayload(item));
        results.error++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: items.length,
      results,
      execution_time_ms: Date.now() - startTime,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Queue worker error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleRetry(
  supabase: any,
  item: any,
  errorMessage: string,
  itemStart: number,
  requestPayload: any
) {
  const newRetryCount = (item.retry_count || 0) + 1;
  const maxRetries = item.max_retries || 5;

  if (newRetryCount >= maxRetries) {
    // Max retries exceeded — permanent error
    await supabase
      .from("sync_queue")
      .update({
        status: "error",
        error_message: `Max retries (${maxRetries}) exceeded. Last error: ${errorMessage}`,
        retry_count: newRetryCount,
        processed_at: new Date().toISOString(),
      })
      .eq("id", item.id);
  } else {
    // Calculate next retry with exponential backoff (60s * 2^retryCount, max 30min)
    const backoffSeconds = Math.min(60 * Math.pow(2, newRetryCount), 1800);
    const nextRetryAt = new Date(Date.now() + backoffSeconds * 1000).toISOString();

    await supabase
      .from("sync_queue")
      .update({
        status: "retrying",
        error_message: errorMessage,
        retry_count: newRetryCount,
        next_retry_at: nextRetryAt,
      })
      .eq("id", item.id);
  }

  // Log the error
  await supabase.from("integration_logs").insert({
    tenant_id: item.tenant_id,
    action: `queue_${item.action}`,
    entity_type: item.entity_type,
    entity_id: item.entity_id,
    status: "error",
    error_message: errorMessage,
    request_payload: requestPayload,
    execution_time_ms: Date.now() - itemStart,
  });
}

async function handleReprocess(supabase: any, body: any) {
  try {
    const { tenant_id, queue_action, entity_type, entity_id, payload } = body;

    if (!tenant_id || !queue_action) {
      return new Response(JSON.stringify({ success: false, error: "tenant_id and queue_action required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try to find and reset an existing errored queue item
    const { data: existing } = await supabase
      .from("sync_queue")
      .select("id")
      .eq("tenant_id", tenant_id)
      .eq("action", queue_action)
      .in("status", ["error", "retrying"])
      .limit(1);

    if (existing && existing.length > 0) {
      await supabase
        .from("sync_queue")
        .update({
          status: "pending",
          retry_count: 0,
          next_retry_at: null,
          error_message: null,
          processed_at: null,
        })
        .eq("id", existing[0].id);
    } else {
      // Create a new queue item
      await supabase.from("sync_queue").insert({
        tenant_id,
        action: queue_action,
        entity_type: entity_type || "unknown",
        entity_id: entity_id || "reprocessed",
        payload: payload || {},
        status: "pending",
        retry_count: 0,
      });
    }

    return new Response(JSON.stringify({ success: true, message: "Item re-enqueued" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
