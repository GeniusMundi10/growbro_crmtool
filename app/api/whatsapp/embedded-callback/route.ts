import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as {
    waba_id?: string;
    phone_number_id?: string;
    code?: string;
  } | null;

  if (!body || !body.code) {
    return NextResponse.json({ success: false, error: "Missing code" }, { status: 400 });
  }

  // Find the user's AI (business_info.id) to map onboarding to the correct tenant
  const { data: biz, error: bizErr } = await supabase
    .from("business_info")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (bizErr || !biz?.id) {
    return NextResponse.json({ success: false, error: "AI not found for user" }, { status: 400 });
  }

  const ai_id = biz.id as string;

  const backendUrl = process.env.NEXT_PUBLIC_WHATSAPP_BACKEND_URL || 'https://growbro-backend.fly.dev';

  try {
    const resp = await fetch(`${backendUrl}/api/whatsapp/complete-onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        ai_id,
        waba_id: body.waba_id,
        phone_number_id: body.phone_number_id,
        code: body.code,
      })
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data?.success) {
      return NextResponse.json({ success: false, error: data?.error || 'Onboarding failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Backend error' }, { status: 500 });
  }
}
