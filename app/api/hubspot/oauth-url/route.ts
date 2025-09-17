import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID;
  const HUBSPOT_REDIRECT_URI = process.env.HUBSPOT_REDIRECT_URI;
  const scopes = [
    "oauth",
    "crm.objects.contacts.read",
    "crm.objects.contacts.write"
  ];
  // Capture selected AI (if provided) so we can scope the connection per AI
  const url = new URL(req.url);
  const ai_id = url.searchParams.get("ai_id");
  // Generate a secure random state and encode ai_id into it (state := uuid[:ai_id])
  const base = crypto.randomUUID();
  const state = ai_id ? `${base}:${ai_id}` : base;

  // Use Supabase Auth Helpers to get the current user from cookies
  const supabase = createRouteHandlerClient({ cookies });
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
  const url2 = `https://app.hubspot.com/oauth/authorize?client_id=${HUBSPOT_CLIENT_ID}&scope=${scopes.join("%20")}&redirect_uri=${encodeURIComponent(HUBSPOT_REDIRECT_URI!)}&state=${state}&prompt=consent`;
  return NextResponse.redirect(url2);
}
