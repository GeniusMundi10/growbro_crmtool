import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const ai_id = formData.get('ai_id') as string;
    const file = formData.get('file') as File;

    if (!ai_id || !file) {
      return NextResponse.json({ success: false, error: "Missing ai_id or file" }, { status: 400 });
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
    
    // Forward the form data to backend
    const backendFormData = new FormData();
    backendFormData.append('ai_id', ai_id);
    backendFormData.append('file', file);

    const resp = await fetch(`${backendUrl}/api/whatsapp/profile/photo/upload`, {
      method: 'POST',
      body: backendFormData,
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Backend error' }, { status: 500 });
  }
}
