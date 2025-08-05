import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// POST /api/hubspot/sync-lead { leadId: string }
export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { leadId } = await req.json();

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Get HubSpot token for user
  const { data: tokenRows, error: tokenError } = await supabase
    .from("hubspot_tokens")
    .select("access_token,refresh_token")
    .eq("user_id", user.id)
    .limit(1);
  if (tokenError || !tokenRows || tokenRows.length === 0) {
    return NextResponse.json({ error: "No HubSpot connection found for user" }, { status: 400 });
  }
  let access_token = tokenRows[0].access_token;
  let refresh_token = tokenRows[0].refresh_token;

  // Get lead info from end_users
  const { data: leadRows, error: leadError } = await supabase
    .from("end_users")
    .select("name,email,phone")
    .eq("id", leadId)
    .limit(1);
  if (leadError || !leadRows || leadRows.length === 0) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  const { name, email, phone } = leadRows[0];

  // Prepare HubSpot contact payload
  const payload = {
    properties: {
      email,
      firstname: name || "",
      phone: phone || ""
    }
  };

  // Helper to send contact to HubSpot
  async function sendToHubSpot(token: string) {
    return await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  }

  // Try initial send
  let res = await sendToHubSpot(access_token);

  // If token expired, refresh and retry once
  if (!res.ok) {
    const errText = await res.text();
    let errJson;
    try { errJson = JSON.parse(errText); } catch { errJson = {}; }
    const expired = errJson?.category === "EXPIRED_AUTHENTICATION" || (errJson?.message && String(errJson.message).toLowerCase().includes("token"));
    if (expired && refresh_token) {
      // Refresh token
      const refreshRes = await fetch("https://api.hubapi.com/oauth/v1/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: process.env.HUBSPOT_CLIENT_ID!,
          client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
          refresh_token
        })
      });
      const refreshData = await refreshRes.json();
      if (refreshRes.ok && refreshData.access_token) {
        access_token = refreshData.access_token;
        // Optionally update refresh_token if provided
        if (refreshData.refresh_token) refresh_token = refreshData.refresh_token;
        await supabase.from("hubspot_tokens").update({ access_token, refresh_token }).eq("user_id", user.id);
        // Retry sync with new token
        res = await sendToHubSpot(access_token);
        if (!res.ok) {
          const retryErr = await res.text();
          return NextResponse.json({ error: "Failed to sync lead to HubSpot after refresh", details: retryErr }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: "Failed to refresh HubSpot token", details: refreshData }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Failed to sync lead to HubSpot", details: errText }, { status: 400 });
    }
  }

  const hubspotContact = await res.json();
  // Optionally: return the HubSpot contact id
  return NextResponse.json({ success: true, hubspotContact });
}
