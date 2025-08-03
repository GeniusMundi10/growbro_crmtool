import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID;
  const HUBSPOT_REDIRECT_URI = process.env.HUBSPOT_REDIRECT_URI;
  const scopes = [
    "oauth",
    "crm.objects.contacts.read",
    "crm.objects.contacts.write"
  ];
  // Generate a secure random state
  const state = crypto.randomUUID();

  // Get the current user (must be authenticated)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Store the state and user_id in the hubspot_oauth_state table
  const { error: insertError } = await supabase.from("hubspot_oauth_state").insert({
    state,
    user_id: user.id
  });
  if (insertError) {
    return NextResponse.json({ error: "Failed to store state", details: insertError.message }, { status: 500 });
  }

  // Build the OAuth URL with the state
  const url = `https://app.hubspot.com/oauth/authorize?client_id=${HUBSPOT_CLIENT_ID}&scope=${scopes.join("%20")}&redirect_uri=${encodeURIComponent(HUBSPOT_REDIRECT_URI)}&state=${state}`;
  return NextResponse.redirect(url);
}
