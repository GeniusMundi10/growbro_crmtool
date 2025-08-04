import { NextRequest, NextResponse } from "next/server";

import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  // Look up the user by the state parameter (robust against missing session in popup)
  if (!state) {
    return NextResponse.json({ error: "Missing state" }, { status: 400 });
  }
  // Attempt to atomically fetch and delete the state row (single-use)
  const { data: stateRows, error: stateError } = await supabase
    .from("hubspot_oauth_state")
    .select("user_id")
    .eq("state", state)
    .limit(1);
  if (stateError || !stateRows || stateRows.length === 0) {
    // Log duplicate or replayed state usage
    console.warn(`[HubSpot OAuth] State not found or already used: ${state}`);
    return NextResponse.json({ error: "Invalid or expired state" }, { status: 401 });
  }
  const user_id = stateRows[0].user_id;
  // Delete the state row after use for single-use guarantee
  const { error: deleteError } = await supabase.from("hubspot_oauth_state").delete().eq("state", state);
  if (deleteError) {
    console.warn(`[HubSpot OAuth] Failed to delete used state: ${state}`, deleteError.message);
  }

  // Exchange code for tokens with HubSpot
  const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID;
  const HUBSPOT_CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET;
  const HUBSPOT_REDIRECT_URI = process.env.HUBSPOT_REDIRECT_URI;
  const tokenRes = await fetch("https://api.hubapi.com/oauth/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: HUBSPOT_CLIENT_ID!,
      client_secret: HUBSPOT_CLIENT_SECRET!,
      redirect_uri: HUBSPOT_REDIRECT_URI!,
      code
    })
  });
  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    return NextResponse.json({ error: "Failed to fetch token", details: err }, { status: 400 });
  }
  const tokenData = await tokenRes.json();

  // Fetch portal_id and validate authorization
  let portal_id = null;
  let me = null;
  try {
    const meRes = await fetch("https://api.hubapi.com/integrations/v1/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    if (meRes.ok) {
      me = await meRes.json();
      portal_id = me.portalId?.toString() || null;
    } else {
      // If /me fails, do not upsert tokens or treat as connected
      const err = await meRes.text();
      return NextResponse.json({ error: "HubSpot authorization not complete. Please finish connecting the app.", details: err }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: "HubSpot authorization not complete. Please finish connecting the app.", details: (e as Error).message }, { status: 400 });
  }

  // Only upsert tokens if /me succeeded (i.e. user has approved)
  const { error: upsertError } = await supabase.from("hubspot_tokens").upsert({
    user_id,
    portal_id,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: "user_id" });

  if (upsertError) {
    return NextResponse.json({ error: "Failed to store tokens", details: upsertError.message }, { status: 500 });
  }

  // If called from a popup, send postMessage and close
  const html = `<!DOCTYPE html>
  <html><head><title>Connected!</title></head><body>
  <script>
    if (window.opener) {
      window.opener.postMessage({ status: 'connected' }, window.location.origin);
      window.close();
    } else {
      window.location.href = '/integrations?status=connected';
    }
  </script>
  <p>Connected! You can close this window.</p>
  </body></html>`;
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}


