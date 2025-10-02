import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const ai_id = searchParams.get('ai_id') || undefined;
  if (!ai_id) {
    return NextResponse.json({ success: false, error: "Missing ai_id" }, { status: 400 });
  }

  // Validate ai_id belongs to user
  const { data: validate } = await supabase
    .from("business_info")
    .select("id")
    .eq("user_id", user.id)
    .eq("id", ai_id)
    .maybeSingle();
  if (!validate?.id) {
    return NextResponse.json({ success: false, error: "Invalid ai_id for user" }, { status: 400 });
  }

  const backendUrl = process.env.NEXT_PUBLIC_WHATSAPP_BACKEND_URL || 'https://growbro-backend.fly.dev';
  try {
    const resp = await fetch(`${backendUrl}/api/whatsapp/display-name/status?ai_id=${encodeURIComponent(ai_id)}`);
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Backend error' }, { status: 500 });
  }
}
