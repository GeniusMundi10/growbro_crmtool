import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ connected: false });
  }
  const url = new URL(req.url);
  const ai_id = url.searchParams.get("ai_id");
  // If ai_id is provided, only return true if that specific AI has a token row
  if (ai_id) {
    const { data: rowByAi } = await supabase
      .from("hubspot_tokens")
      .select("id")
      .eq("user_id", user.id)
      .eq("ai_id", ai_id)
      .maybeSingle();
    return NextResponse.json({ connected: !!rowByAi });
  }

  // No ai_id provided: return true if the user has any token row
  const { data: anyRow } = await supabase
    .from("hubspot_tokens")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  return NextResponse.json({ connected: !!anyRow });
}
