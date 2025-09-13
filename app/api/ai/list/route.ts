import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ items: [] });
  }

  try {
    const { data: ais } = await supabase
      .from("business_info")
      .select("id, ai_name, company_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    const aiIds = (ais || []).map((r) => r.id);

    let map = new Map<string, any>();
    if (aiIds.length > 0) {
      const { data: wa } = await supabase
        .from("whatsapp_integrations")
        .select("ai_id, status, phone_number, phone_number_id, updated_at")
        .in("ai_id", aiIds);
      (wa || []).forEach((w: any) => map.set(w.ai_id, w));
    }

    const items = (ais || []).map((r: any) => {
      const wa = map.get(r.id) || null;
      return {
        ai_id: r.id as string,
        ai_name: r.ai_name || r.company_name || null,
        connected: !!wa,
        status: wa?.status || null,
        phone_number: wa?.phone_number || null,
        phone_number_id: wa?.phone_number_id || null,
        updated_at: wa?.updated_at || null,
      };
    });

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ items: [], error: e?.message || 'Failed to list AIs' }, { status: 500 });
  }
}
