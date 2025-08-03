import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  // Get the current user from Supabase Auth (cookie/session)
  // This assumes you have a way to get the user from the request/session
  // For demo, we'll use a placeholder; replace with your real auth logic
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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
    user_id: user.id,
    portal_id,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: "user_id" });

  if (upsertError) {
    return NextResponse.json({ error: "Failed to store tokens", details: upsertError.message }, { status: 500 });
  }

  // Redirect to integrations page with success
  return NextResponse.redirect("/integrations?status=connected");
}

