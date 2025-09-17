import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  let ai_id: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    ai_id = body?.ai_id ?? null;
  } catch {}
  // Get current user from Supabase Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }
  // Delete user's HubSpot tokens, scoped by ai_id when provided and supported
  try {
    if (ai_id) {
      const { error } = await supabase
        .from("hubspot_tokens")
        .delete()
        .eq("user_id", user.id)
        .eq("ai_id", ai_id);
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    } else {
      const { error } = await supabase
        .from("hubspot_tokens")
        .delete()
        .eq("user_id", user.id);
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }
  } catch (e: any) {
    // In case schema lacks ai_id, fallback to user-only delete
    const { error } = await supabase
      .from("hubspot_tokens")
      .delete()
      .eq("user_id", user.id);
    if (error) {
      return NextResponse.json({ success: false, error: error.message || String(e) }, { status: 500 });
    }
  }
  return NextResponse.json({ success: true });
}
