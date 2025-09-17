import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// POST /api/hubspot/sync-lead { leadId: string, ai_id?: string }
export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json();
  const leadId: string | undefined = body?.leadId;
  let ai_id: string | null = body?.ai_id ?? null;

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Determine AI context if not explicitly given
  if (!ai_id && leadId) {
    // Try end_users.ai_id first
    try {
      const { data: eu } = await supabase
        .from("end_users")
        .select("ai_id")
        .eq("id", leadId)
        .maybeSingle();
      if (eu?.ai_id) ai_id = eu.ai_id as string;
    } catch {}
    // Fallback: try chat_history.ai_id
    if (!ai_id) {
      try {
        const { data: ch } = await supabase
          .from("chat_history")
          .select("ai_id")
          .eq("end_user_id", leadId)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (ch && ch.length > 0 && ch[0]?.ai_id) ai_id = ch[0].ai_id as string;
      } catch {}
    }
  }

  // Get HubSpot token for user (scoped by ai_id when available)
  let access_token: string | null = null;
  let refresh_token: string | null = null;
  if (ai_id) {
    // If schema supports ai_id, this will filter; otherwise it may error which we handle below
    try {
      const { data: rowsByAi, error: errByAi } = await supabase
        .from("hubspot_tokens")
        .select("access_token,refresh_token")
        .eq("user_id", user.id)
        .eq("ai_id", ai_id as string)
        .limit(1);
      if (!errByAi && rowsByAi && rowsByAi.length > 0) {
        access_token = rowsByAi[0].access_token as string;
        refresh_token = rowsByAi[0].refresh_token as string | null;
      }
    } catch {
      // ignore and fall back to legacy
    }
  }
  if (!access_token) {
    const { data: tokenRows, error: tokenError } = await supabase
      .from("hubspot_tokens")
      .select("access_token,refresh_token")
      .eq("user_id", user.id)
      .limit(1);
    if (tokenError || !tokenRows || tokenRows.length === 0) {
      return NextResponse.json({ error: "No HubSpot connection found for this AI or user" }, { status: 400 });
    }
    access_token = tokenRows[0].access_token as string;
    refresh_token = tokenRows[0].refresh_token as string | null;
  }

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
  // async function sendToHubSpot(token: string) {
  //   return await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: `Bearer ${token}`
  //     },
  //     body: JSON.stringify(payload)
  //   });
  // }

  // Try initial send
  let res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`
    },
    body: JSON.stringify(payload)
  });

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
        // Persist refreshed tokens to the correct row
        try {
          if (ai_id) {
            await supabase.from("hubspot_tokens").update({ access_token, refresh_token }).eq("user_id", user.id).eq("ai_id", ai_id as string);
          } else {
            await supabase.from("hubspot_tokens").update({ access_token, refresh_token }).eq("user_id", user.id);
          }
        } catch {
          await supabase.from("hubspot_tokens").update({ access_token, refresh_token }).eq("user_id", user.id);
        }
        // Retry sync with new token
        res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`
          },
          body: JSON.stringify(payload)
        });
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

  // Mark this lead as synced in the DB
  await supabase.from("end_users").update({ hubspot_synched: true, hubspot_contact_id: hubspotContact.id }).eq("id", leadId);

  // Optionally: return the HubSpot contact id
  return NextResponse.json({ success: true, hubspotContact });
}
