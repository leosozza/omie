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

// Helper to safely parse JSON
function safeJsonParse(str: string): unknown | null {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

serve(async (req) => {
  const method = req.method;
  const contentType = req.headers.get("content-type") || "";

  console.log(`bitrix-install: method=${method} content-type=${contentType}`);

  // Handle CORS preflight
  if (method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle GET/HEAD requests (health check / Vendors validation)
  if (method === "GET" || method === "HEAD") {
    console.log("bitrix-install: health-check request (GET/HEAD)");
    return new Response(
      JSON.stringify({
        success: true,
        message: "bitrix-install endpoint is accessible",
        status: "ready",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }

  try {
    // Read raw body (tolerant parsing)
    const rawBody = await req.text();
    const bodyLen = rawBody.length;
    console.log(`bitrix-install: bodyLen=${bodyLen}`);

    // If body is empty, treat as validation/health-check
    if (!rawBody || rawBody.trim() === "") {
      console.log("bitrix-install: empty body, treating as health-check");
      return new Response(
        JSON.stringify({
          success: true,
          message: "bitrix-install endpoint is accessible (awaiting payload)",
          status: "ready",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Try to parse the payload
    let installData: BitrixInstallEvent | null = null;
    let parseError: string | null = null;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      // Parse as form data
      try {
        const params = new URLSearchParams(rawBody);
        const event = params.get("event");
        const dataStr = params.get("data");
        const authStr = params.get("auth");

        console.log(`bitrix-install: form parsed - event=${event} hasData=${!!dataStr} hasAuth=${!!authStr}`);

        const dataParsed = dataStr ? safeJsonParse(dataStr) : {};
        const authParsed = authStr ? safeJsonParse(authStr) : null;

        if (authStr && !authParsed) {
          parseError = "Invalid JSON in 'auth' field";
        } else {
          installData = {
            event: event || "ONAPPINSTALL",
            data: (dataParsed as BitrixInstallEvent["data"]) || { LANGUAGE_ID: "", VERSION: "" },
            auth: (authParsed as BitrixInstallEvent["auth"]) || {} as BitrixInstallEvent["auth"],
          };
        }
      } catch (e) {
        parseError = `Form parsing failed: ${e instanceof Error ? e.message : "unknown"}`;
      }
    } else if (contentType.includes("application/json")) {
      // Parse as JSON
      const parsed = safeJsonParse(rawBody);
      if (!parsed) {
        parseError = "Invalid JSON body";
      } else {
        installData = parsed as BitrixInstallEvent;
      }
    } else {
      // Unknown content-type: try JSON first, then form
      const jsonParsed = safeJsonParse(rawBody);
      if (jsonParsed && typeof jsonParsed === "object") {
        installData = jsonParsed as BitrixInstallEvent;
        console.log("bitrix-install: parsed as JSON (unknown content-type)");
      } else {
        // Try form-urlencoded
        try {
          const params = new URLSearchParams(rawBody);
          const authStr = params.get("auth");
          if (authStr) {
            const authParsed = safeJsonParse(authStr);
            if (authParsed) {
              installData = {
                event: params.get("event") || "ONAPPINSTALL",
                data: safeJsonParse(params.get("data") || "{}") as BitrixInstallEvent["data"] || { LANGUAGE_ID: "", VERSION: "" },
                auth: authParsed as BitrixInstallEvent["auth"],
              };
              console.log("bitrix-install: parsed as form (unknown content-type)");
            }
          }
        } catch {
          // Ignore
        }

        if (!installData) {
          parseError = "Unable to parse body (tried JSON and form-urlencoded)";
        }
      }
    }

    // If parsing failed, return 200 with error (not 500, to pass Vendors check)
    if (parseError || !installData) {
      console.log(`bitrix-install: parse error - ${parseError}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: parseError || "Failed to parse request body",
          hint: "Expected form-urlencoded with 'event', 'data', 'auth' fields, or JSON body",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const { auth } = installData;
    const hasMemberId = !!auth?.member_id;
    const hasAccessToken = !!auth?.access_token;

    console.log(`bitrix-install: event=${installData.event} hasMemberId=${hasMemberId} hasAccessToken=${hasAccessToken} domain=${auth?.domain || "n/a"}`);

    // Validate required fields - return 200 with error (not 500)
    if (!hasMemberId || !hasAccessToken) {
      console.log("bitrix-install: missing required auth fields");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required auth data: member_id or access_token",
          hint: "This endpoint expects Bitrix24 install event with auth credentials",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Proceed with installation
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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
      // Return 200 with error details (not 500)
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database error while saving installation",
          details: installError.message,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
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

    // Return 200 with error (not 500) to avoid Vendors marking URL as inaccessible
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        hint: "Internal processing error - please try again",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});
