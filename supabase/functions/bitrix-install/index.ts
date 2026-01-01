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

// Helper to parse PHP array notation (auth[access_token]=xxx → { auth: { access_token: "xxx" } })
function parsePhpArrayNotation(params: URLSearchParams): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of params.entries()) {
    // Match patterns like "auth[access_token]" or "data[VERSION]"
    const match = key.match(/^(\w+)\[(\w+)\]$/);
    if (match) {
      const [, parent, child] = match;
      if (!result[parent] || typeof result[parent] !== "object") {
        result[parent] = {};
      }
      (result[parent] as Record<string, string>)[child] = value;
    } else {
      // Simple key like "event"
      result[key] = value;
    }
  }

  return result;
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
        
        // Log all received keys for debugging
        const allKeys = Array.from(params.keys());
        console.log(`bitrix-install: form keys received (${allKeys.length}): ${allKeys.join(", ")}`);
        
        // Strategy 1: PHP array notation (auth[access_token]=xxx)
        const parsed = parsePhpArrayNotation(params);
        const hasPhpAuth = parsed.auth && typeof parsed.auth === "object" && 
          ((parsed.auth as Record<string, string>).access_token || (parsed.auth as Record<string, string>).member_id);

        if (hasPhpAuth) {
          installData = {
            event: (parsed.event as string) || "ONAPPINSTALL",
            data: (parsed.data as BitrixInstallEvent["data"]) || { LANGUAGE_ID: "", VERSION: "" },
            auth: parsed.auth as BitrixInstallEvent["auth"],
          };
          console.log("bitrix-install: parsed using PHP array notation");
        }
        
        // Strategy 2: FLAT parameters (AUTH_ID, REFRESH_ID, member_id, DOMAIN, etc.)
        if (!installData) {
          const authId = params.get("AUTH_ID") || params.get("access_token");
          const refreshId = params.get("REFRESH_ID") || params.get("refresh_token");
          const memberId = params.get("member_id") || params.get("MEMBER_ID");
          const domain = params.get("DOMAIN") || params.get("domain") || "";
          const serverEndpoint = params.get("SERVER_ENDPOINT") || params.get("server_endpoint") || "";
          
          console.log(`bitrix-install: checking FLAT params - AUTH_ID=${!!authId} member_id=${!!memberId} domain=${domain}`);
          
          if (authId && memberId) {
            installData = {
              event: params.get("event") || "ONAPPINSTALL",
              data: { LANGUAGE_ID: params.get("LANG") || "br", VERSION: "1" },
              auth: {
                access_token: authId,
                refresh_token: refreshId || "",
                expires: params.get("AUTH_EXPIRES") || "3600",
                expires_in: params.get("AUTH_EXPIRES") || "3600",
                scope: params.get("scope") || "",
                domain: domain,
                server_endpoint: serverEndpoint || `https://${domain}/rest/`,
                status: params.get("status") || "L",
                client_endpoint: serverEndpoint || `https://${domain}/rest/`,
                member_id: memberId,
                user_id: params.get("user_id") || "",
                application_token: params.get("APP_SID") || params.get("application_token") || "",
              },
            };
            console.log("bitrix-install: parsed using FLAT parameters (AUTH_ID, member_id)");
          }
        }
        
        // Strategy 3: JSON stringified fields (auth as JSON string)
        if (!installData) {
          const event = params.get("event");
          const dataStr = params.get("data");
          const authStr = params.get("auth");

          console.log(`bitrix-install: trying JSON fields - event=${event} hasData=${!!dataStr} hasAuth=${!!authStr}`);

          const dataParsed = dataStr ? safeJsonParse(dataStr) : {};
          const authParsed = authStr ? safeJsonParse(authStr) : null;

          if (authStr && !authParsed) {
            parseError = "Invalid JSON in 'auth' field";
          } else if (authParsed) {
            installData = {
              event: event || "ONAPPINSTALL",
              data: (dataParsed as BitrixInstallEvent["data"]) || { LANGUAGE_ID: "", VERSION: "" },
              auth: authParsed as BitrixInstallEvent["auth"],
            };
            console.log("bitrix-install: parsed using JSON stringified fields");
          } else {
            parseError = "No auth data found (tried: PHP array, FLAT params, JSON string)";
          }
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
        console.log("bitrix-install: parsed as JSON");
      }
    } else {
      // Unknown content-type: try JSON first, then form with PHP notation
      const jsonParsed = safeJsonParse(rawBody);
      if (jsonParsed && typeof jsonParsed === "object" && (jsonParsed as Record<string, unknown>).auth) {
        installData = jsonParsed as BitrixInstallEvent;
        console.log("bitrix-install: parsed as JSON (unknown content-type)");
      } else {
        // Try form-urlencoded with PHP array notation
        try {
          const params = new URLSearchParams(rawBody);
          const parsed = parsePhpArrayNotation(params);
          
          if (parsed.auth && typeof parsed.auth === "object") {
            installData = {
              event: (parsed.event as string) || "ONAPPINSTALL",
              data: (parsed.data as BitrixInstallEvent["data"]) || { LANGUAGE_ID: "", VERSION: "" },
              auth: parsed.auth as BitrixInstallEvent["auth"],
            };
            console.log("bitrix-install: parsed as form with PHP notation (unknown content-type)");
          } else {
            // Try JSON stringified auth
            const authStr = params.get("auth");
            if (authStr) {
              const authParsed = safeJsonParse(authStr);
              if (authParsed) {
                installData = {
                  event: params.get("event") || "ONAPPINSTALL",
                  data: safeJsonParse(params.get("data") || "{}") as BitrixInstallEvent["data"] || { LANGUAGE_ID: "", VERSION: "" },
                  auth: authParsed as BitrixInstallEvent["auth"],
                };
                console.log("bitrix-install: parsed as form with JSON auth (unknown content-type)");
              }
            }
          }
        } catch {
          // Ignore
        }

        if (!installData) {
          parseError = "Unable to parse body (tried JSON, form with PHP notation, and form with JSON auth)";
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

    // Check if this is a reinstall (member_id already exists)
    const { data: existingInstall } = await supabase
      .from("bitrix_installations")
      .select("id")
      .eq("member_id", auth.member_id)
      .maybeSingle();

    const isReinstall = !!existingInstall;
    console.log(`bitrix-install: isReinstall=${isReinstall} member_id=${auth.member_id}`);

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
      action: isReinstall ? "app_reopen" : "app_install",
      entity_type: "installation",
      entity_id: installation.id,
      status: "success",
      request_payload: { event: installData.event, domain: auth.domain, isReinstall },
      response_payload: { installation_id: installation.id },
    });

    // Build redirect URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const iframeUrl = `${supabaseUrl}/functions/v1/bitrix-iframe?member_id=${encodeURIComponent(auth.member_id)}&v=2`;

    // If reinstall: redirect immediately (no success screen)
    if (isReinstall) {
      console.log("bitrix-install: reinstall detected, redirecting immediately to:", iframeUrl);
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: iframeUrl,
        },
      });
    }

    // First install: show success screen with short delay (500ms)
    const successHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Conector Omie - Instalado</title>
    <script src="https://api.bitrix24.com/api/v1/"></script>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
      .container {
        text-align: center;
        padding: 40px;
        background: rgba(255,255,255,0.1);
        border-radius: 16px;
        backdrop-filter: blur(10px);
      }
      .success-icon {
        font-size: 64px;
        margin-bottom: 16px;
      }
      h1 { margin: 0 0 8px 0; font-size: 24px; }
      p { margin: 0; opacity: 0.9; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="success-icon">✓</div>
      <h1>Aplicativo instalado com sucesso!</h1>
      <p>Redirecionando para o painel...</p>
    </div>
    <script>
      // Redirect to the main app after 500ms (quick feedback)
      setTimeout(function() {
        window.location.href = '${iframeUrl}';
      }, 500);
    </script>
  </body>
</html>`;

    console.log("bitrix-install: first install, showing success HTML, will redirect to:", iframeUrl);

    const headers = new Headers({
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache",
    });

    return new Response(new TextEncoder().encode(successHtml), {
      headers,
      status: 200,
    });
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
