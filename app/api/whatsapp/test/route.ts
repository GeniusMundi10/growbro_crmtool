import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as { to_number: string; message: string } | null;
  if (!body?.to_number || !body?.message) {
    return NextResponse.json({ success: false, error: "Missing to_number or message" }, { status: 400 });
  }

  const { data: biz } = await supabase
    .from("business_info")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const ai_id = biz?.id as string | undefined;

  const backendUrl = process.env.NEXT_PUBLIC_WHATSAPP_BACKEND_URL || 'https://growbro-backend.fly.dev';

  try {
    const resp = await fetch(`${backendUrl}/api/whatsapp/test-send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ai_id, to_number: body.to_number, message: body.message })
    });
    const data = await resp.json().catch(() => ({} as any));
    if (!resp.ok || !data?.success) {
      // Surface underlying backend/Graph error info to the client for easier debugging
      return NextResponse.json(
        {
          success: false,
          error: data?.error || data?.body || 'Test send failed',
          status: data?.status ?? resp.status,
          backendBody: data?.body ?? null,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Backend error' }, { status: 500 });
  }
}
