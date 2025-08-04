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
  const { data: stateRows, error: stateError } = await supabase
    .from("hubspot_oauth_state")
    .select("user_id")
    .eq("state", state)
    .limit(1);
  if (stateError || !stateRows || stateRows.length === 0) {
    return NextResponse.json({ error: "Invalid or expired state" }, { status: 401 });
  }
  const user_id = stateRows[0].user_id;
  // Optionally: Delete the state row after use for security
  await supabase.from("hubspot_oauth_state").delete().eq("state", state);

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

  // Optionally fetch portal_id
  let portal_id = null;
  try {
    const meRes = await fetch("https://api.hubapi.com/integrations/v1/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    if (meRes.ok) {
      const me = await meRes.json();
      portal_id = me.portalId?.toString() || null;
    }
  } catch {}

  // Upsert tokens in hubspot_tokens table
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


