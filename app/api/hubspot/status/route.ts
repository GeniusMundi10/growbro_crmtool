import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ connected: false });
  }
  // Check if user has a valid HubSpot token
  const { data, error } = await supabase
    .from("hubspot_tokens")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ connected: false });
  }
  return NextResponse.json({ connected: !!data });
}
