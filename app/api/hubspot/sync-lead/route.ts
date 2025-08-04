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
    .select("access_token")
    .eq("user_id", user.id)
    .limit(1);
  if (tokenError || !tokenRows || tokenRows.length === 0) {
    return NextResponse.json({ error: "No HubSpot connection found for user" }, { status: 400 });
  }
  const access_token = tokenRows[0].access_token;

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

  // Send to HubSpot
  const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: "Failed to sync lead to HubSpot", details: err }, { status: 400 });
  }

  const hubspotContact = await res.json();
  // Optionally: return the HubSpot contact id
  return NextResponse.json({ success: true, hubspotContact });
}
