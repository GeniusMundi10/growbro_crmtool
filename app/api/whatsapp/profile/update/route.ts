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
    ai_id?: string;
    about?: string;
    address?: string;
    description?: string;
    email?: string;
    vertical?: string;
    websites?: string[];
    profile_picture_handle?: string;
  } | null;
  if (!body?.ai_id) {
    return NextResponse.json({ success: false, error: "Missing ai_id" }, { status: 400 });
  }

  // Validate ai_id belongs to user
  const { data: validate } = await supabase
    .from("business_info")
    .select("id")
    .eq("user_id", user.id)
    .eq("id", body.ai_id)
    .maybeSingle();
  if (!validate?.id) {
    return NextResponse.json({ success: false, error: "Invalid ai_id for user" }, { status: 400 });
  }

  const backendUrl = process.env.NEXT_PUBLIC_WHATSAPP_BACKEND_URL || 'https://growbro-backend.fly.dev';
  try {
    const resp = await fetch(`${backendUrl}/api/whatsapp/profile/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Backend error' }, { status: 500 });
  }
}
