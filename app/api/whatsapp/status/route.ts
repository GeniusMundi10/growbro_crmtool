import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ connected: false });
  }
  try {
    const { data, error } = await supabase
      .from("whatsapp_integrations")
      .select("id, phone_number, phone_number_id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      // Table may not exist yet or RLS prevents access; treat as disconnected
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({ connected: !!data, info: data || null });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
