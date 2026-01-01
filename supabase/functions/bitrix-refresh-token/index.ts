import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BITRIX_OAUTH_URL = "https://oauth.bitrix.info/oauth/token/";

interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  domain: string;
  server_endpoint: string;
  status: string;
  client_endpoint: string;
  member_id: string;
}

async function refreshBitrixToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<RefreshTokenResponse> {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const response = await fetch(`${BITRIX_OAUTH_URL}?${params.toString()}`, {
    method: "GET",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed: ${errorText}`);
  }

  return response.json();
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

    const clientId = Deno.env.get("BITRIX_CLIENT_ID");
    const clientSecret = Deno.env.get("BITRIX_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      throw new Error("Missing Bitrix OAuth credentials in environment");
    }

    const body = await req.json();
    const { member_id, force = false } = body;

    if (!member_id) {
      throw new Error("Missing member_id parameter");
    }

    // Get current installation
    const { data: installation, error: fetchError } = await supabase
      .from("bitrix_installations")
      .select("*")
      .eq("member_id", member_id)
      .single();

    if (fetchError || !installation) {
      throw new Error(`Installation not found for member: ${member_id}`);
    }

    // Check if refresh is needed (5 minutes before expiration)
    const expiresAt = new Date(installation.expires_at);
    const now = new Date();
    const fiveMinutes = 5 * 60 * 1000;
    const needsRefresh = force || (expiresAt.getTime() - now.getTime()) < fiveMinutes;

    if (!needsRefresh) {
      return new Response(
        JSON.stringify({
          success: true,
          refreshed: false,
          message: "Token still valid",
          expires_at: installation.expires_at,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Refreshing token for member:", member_id);

    // Refresh the token
    const tokenResponse = await refreshBitrixToken(
      installation.refresh_token,
      clientId,
      clientSecret
    );

    // Calculate new expiration
    const newExpiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

    // Update installation with new tokens
    const { error: updateError } = await supabase
      .from("bitrix_installations")
      .update({
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_at: newExpiresAt.toISOString(),
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("member_id", member_id);

    if (updateError) {
      throw updateError;
    }

    // Log the refresh event
    await supabase.from("integration_logs").insert({
      tenant_id: member_id,
      action: "token_refresh",
      entity_type: "installation",
      status: "success",
      response_payload: { new_expires_at: newExpiresAt.toISOString() },
    });

    console.log("Token refreshed successfully for:", member_id);

    return new Response(
      JSON.stringify({
        success: true,
        refreshed: true,
        message: "Token refreshed successfully",
        expires_at: newExpiresAt.toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Token refresh error:", error);
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
