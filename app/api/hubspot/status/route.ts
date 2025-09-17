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
  // Prefer per-AI lookup if ai_id provided; fallback to legacy per-user row
  try {
    if (ai_id) {
      const { data: rowByAi } = await supabase
        .from("hubspot_tokens")
        .select("id")
        .eq("user_id", user.id)
        .eq("ai_id", ai_id)
        .maybeSingle();
      if (rowByAi) {
        return NextResponse.json({ connected: true });
      }
    }
  } catch (_) {
    // ignore schema errors (e.g., no ai_id column)
  }

  const { data: legacyRow } = await supabase
    .from("hubspot_tokens")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  return NextResponse.json({ connected: !!legacyRow });
}
