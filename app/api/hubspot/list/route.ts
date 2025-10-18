import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ items: [] });
  }

  // Get all HubSpot connections for this user
  const { data: connections, error } = await supabase
    .from("hubspot_tokens")
    .select("id, ai_id, portal_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !connections) {
    return NextResponse.json({ items: [] });
  }

  // Get AI names for all connections
  const aiIds = connections.map(c => c.ai_id).filter(Boolean);
  const { data: aiData } = await supabase
    .from("business_info")
    .select("id, ai_name")
    .in("id", aiIds);

  const aiMap = new Map(aiData?.map(ai => [ai.id, ai.ai_name]) || []);

  // Format response
  const items = connections.map(conn => ({
    ai_id: conn.ai_id,
    ai_name: aiMap.get(conn.ai_id) || 'AI',
    portal_id: conn.portal_id || null,
    connected_at: conn.created_at,
    connected: true
  }));

  return NextResponse.json({ items });
}
