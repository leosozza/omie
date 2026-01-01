import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BitrixInstallEvent {
  event: string;
  data: {
    LANGUAGE_ID: string;
    VERSION: string;
  };
  auth: {
    access_token: string;
    refresh_token: string;
    expires: string;
    expires_in: string;
    scope: string;
    domain: string;
    server_endpoint: string;
    status: string;
    client_endpoint: string;
    member_id: string;
    user_id: string;
    application_token: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse form data (Bitrix sends as application/x-www-form-urlencoded)
    const contentType = req.headers.get("content-type") || "";
    let installData: BitrixInstallEvent;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      const dataStr = formData.get("data");
      const authStr = formData.get("auth");
      const event = formData.get("event");

      installData = {
        event: event?.toString() || "ONAPPINSTALL",
        data: dataStr ? JSON.parse(dataStr.toString()) : {},
        auth: authStr ? JSON.parse(authStr.toString()) : {},
      };
    } else {
      installData = await req.json();
    }

    console.log("Bitrix Install Event:", installData.event);
    console.log("Member ID:", installData.auth.member_id);
    console.log("Domain:", installData.auth.domain);

    const { auth } = installData;

    if (!auth.member_id || !auth.access_token) {
      throw new Error("Missing required auth data: member_id or access_token");
    }

    // Calculate token expiration
    const expiresIn = parseInt(auth.expires_in || "3600");
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Upsert installation data
    const { data: installation, error: installError } = await supabase
      .from("bitrix_installations")
      .upsert(
        {
          domain: auth.domain,
          member_id: auth.member_id,
          access_token: auth.access_token,
          refresh_token: auth.refresh_token,
          expires_at: expiresAt.toISOString(),
          client_endpoint: auth.client_endpoint,
          application_token: auth.application_token,
          status: "active",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "member_id",
        }
      )
      .select()
      .single();

    if (installError) {
      console.error("Error saving installation:", installError);
      throw installError;
    }

    console.log("Installation saved successfully:", installation.id);

    // Log the installation event
    await supabase.from("integration_logs").insert({
      tenant_id: auth.member_id,
      action: "app_install",
      entity_type: "installation",
      entity_id: installation.id,
      status: "success",
      request_payload: { event: installData.event, domain: auth.domain },
      response_payload: { installation_id: installation.id },
    });

    // Return success response for Bitrix
    // Bitrix expects a specific response format
    return new Response(
      JSON.stringify({
        success: true,
        message: "Application installed successfully",
        installation_id: installation.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Install error:", error);
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
