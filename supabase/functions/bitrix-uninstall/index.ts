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

    // Parse form data
    const contentType = req.headers.get("content-type") || "";
    let memberId: string | null = null;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      const authStr = formData.get("auth");
      if (authStr) {
        const auth = JSON.parse(authStr.toString());
        memberId = auth.member_id;
      }
    } else {
      const body = await req.json();
      memberId = body.auth?.member_id;
    }

    if (!memberId) {
      throw new Error("Missing member_id");
    }

    console.log("Uninstalling app for member:", memberId);

    // Log uninstall event before deletion
    await supabase.from("integration_logs").insert({
      tenant_id: memberId,
      action: "app_uninstall",
      entity_type: "installation",
      status: "success",
      request_payload: { member_id: memberId },
    });

    // Update installation status to revoked (cascade will handle related data)
    const { error: updateError } = await supabase
      .from("bitrix_installations")
      .update({ status: "revoked" })
      .eq("member_id", memberId);

    if (updateError) {
      console.error("Error updating installation:", updateError);
      throw updateError;
    }

    // Optionally delete all related data
    // The ON DELETE CASCADE will handle this automatically
    const { error: deleteError } = await supabase
      .from("bitrix_installations")
      .delete()
      .eq("member_id", memberId);

    if (deleteError) {
      console.error("Error deleting installation:", deleteError);
      // Don't throw - the status update is enough
    }

    console.log("App uninstalled successfully for:", memberId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Application uninstalled successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Uninstall error:", error);
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
