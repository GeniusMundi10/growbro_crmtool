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
    redirect_uri?: string;
    ai_id?: string;
  } | null;

  if (!body || !body.code) {
    return NextResponse.json({ success: false, error: "Missing code" }, { status: 400 });
  }

  // Debug: log code details and redirect comparison
  try {
    console.debug('[WA_ES][API] Received code from FE', {
      code_len: body.code?.length,
      code_preview: body.code?.slice(0, 8),
      redirect_uri: body.redirect_uri,
    });
  } catch {}

  // Determine ai_id: prefer value passed from client selector, else fallback to user's first AI
  let ai_id = body.ai_id as string | undefined;
  if (ai_id) {
    // Validate the provided ai_id belongs to this user
    const { data: validate } = await supabase
      .from("business_info")
      .select("id")
      .eq("user_id", user.id)
      .eq("id", ai_id)
      .maybeSingle();
    if (!validate?.id) {
      return NextResponse.json({ success: false, error: "Invalid ai_id for user" }, { status: 400 });
    }
  } else {
    const { data: biz, error: bizErr } = await supabase
      .from("business_info")
      .select("id")
      .eq("user_id", user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (bizErr || !biz?.id) {
      return NextResponse.json({ success: false, error: "AI not found for user" }, { status: 400 });
    }
    ai_id = biz.id as string;
  }

  // Diagnostics: compare FE-provided redirect vs server env before we exchange the code
  try {
    console.debug('[WA_ES][API] Redirect diagnostics', {
      body_redirect_uri: body.redirect_uri,
      server_env_redirect: process.env.NEXT_PUBLIC_FB_REDIRECT_URI || process.env.FB_REDIRECT_URI,
      backend_env_url: process.env.NEXT_PUBLIC_WHATSAPP_BACKEND_URL,
      code_len: (body.code || '').length,
    });
  } catch {}

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
        redirect_uri: body.redirect_uri,
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
