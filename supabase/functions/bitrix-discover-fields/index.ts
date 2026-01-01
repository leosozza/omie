import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BitrixField {
  field_code: string;
  field_name: string;
  field_type: string;
  is_required: boolean;
  is_custom: boolean;
  options?: Record<string, string>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { memberId, entityType, spaTypeId } = await req.json();

    if (!memberId || !entityType) {
      return new Response(
        JSON.stringify({ error: "memberId and entityType are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[bitrix-discover-fields] Discovering fields for ${entityType} in tenant ${memberId}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get installation data
    const { data: installation, error: installError } = await supabase
      .from("bitrix_installations")
      .select("*")
      .eq("member_id", memberId)
      .single();

    if (installError || !installation) {
      console.error("[bitrix-discover-fields] Installation not found:", installError);
      return new Response(
        JSON.stringify({ error: "Installation not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine the Bitrix24 API method based on entity type
    let apiMethod = "";
    switch (entityType) {
      case "lead":
        apiMethod = "crm.lead.fields";
        break;
      case "deal":
        apiMethod = "crm.deal.fields";
        break;
      case "contact":
        apiMethod = "crm.contact.fields";
        break;
      case "company":
        apiMethod = "crm.company.fields";
        break;
      case "spa":
        if (!spaTypeId) {
          return new Response(
            JSON.stringify({ error: "spaTypeId is required for SPA entities" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        apiMethod = `crm.item.fields?entityTypeId=${spaTypeId}`;
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unknown entity type: ${entityType}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Call Bitrix24 API
    const bitrixUrl = `${installation.client_endpoint}${apiMethod}`;
    console.log(`[bitrix-discover-fields] Calling Bitrix API: ${bitrixUrl}`);

    const response = await fetch(bitrixUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth: installation.access_token,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[bitrix-discover-fields] Bitrix API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Bitrix API error", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bitrixResult = await response.json();
    
    if (bitrixResult.error) {
      console.error("[bitrix-discover-fields] Bitrix error:", bitrixResult.error_description);
      return new Response(
        JSON.stringify({ error: bitrixResult.error_description || bitrixResult.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse fields from response
    const rawFields = entityType === "spa" ? bitrixResult.result?.fields : bitrixResult.result;
    const fields: BitrixField[] = [];

    for (const [fieldCode, fieldData] of Object.entries(rawFields || {})) {
      const field = fieldData as any;
      fields.push({
        field_code: fieldCode,
        field_name: field.formLabel || field.title || field.listLabel || fieldCode,
        field_type: field.type || "string",
        is_required: field.isRequired === true || field.isRequired === "Y",
        is_custom: fieldCode.startsWith("UF_"),
        options: field.items || field.values || undefined,
      });
    }

    console.log(`[bitrix-discover-fields] Discovered ${fields.length} fields`);

    // Cache fields in database
    const cacheRecords = fields.map((f) => ({
      tenant_id: memberId,
      entity_type: entityType,
      field_code: f.field_code,
      field_name: f.field_name,
      field_type: f.field_type,
      is_required: f.is_required,
      is_custom: f.is_custom,
      options: f.options ? JSON.stringify(f.options) : null,
      spa_type_id: spaTypeId || null,
      cached_at: new Date().toISOString(),
    }));

    // Delete old cached fields for this entity
    await supabase
      .from("bitrix_cached_fields")
      .delete()
      .eq("tenant_id", memberId)
      .eq("entity_type", entityType);

    // Insert new cached fields
    if (cacheRecords.length > 0) {
      const { error: cacheError } = await supabase
        .from("bitrix_cached_fields")
        .insert(cacheRecords);

      if (cacheError) {
        console.error("[bitrix-discover-fields] Cache error:", cacheError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        fields,
        count: fields.length,
        cached_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[bitrix-discover-fields] Error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
