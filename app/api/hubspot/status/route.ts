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
  
  // If ai_id is provided, return connection details for that specific AI
  if (ai_id) {
    const { data: rowByAi } = await supabase
      .from("hubspot_tokens")
      .select("id, ai_id, portal_id, created_at")
      .eq("user_id", user.id)
      .eq("ai_id", ai_id)
      .maybeSingle();
    
    if (!rowByAi) {
      return NextResponse.json({ connected: false });
    }
    
    // Get AI name
    const { data: aiData } = await supabase
      .from("business_info")
      .select("ai_name")
      .eq("id", ai_id)
      .maybeSingle();
    
    return NextResponse.json({ 
      connected: true,
      info: {
        ai_id: rowByAi.ai_id,
        ai_name: aiData?.ai_name || 'AI',
        portal_id: rowByAi.portal_id || null,
        connected_at: rowByAi.created_at
      }
    });
  }

  // No ai_id provided: return first connection found with details
  const { data: anyRow } = await supabase
    .from("hubspot_tokens")
    .select("id, ai_id, portal_id, created_at")
    .eq("user_id", user.id)
    .maybeSingle();
  
  if (!anyRow) {
    return NextResponse.json({ connected: false });
  }
  
  // Get AI name
  const { data: aiData } = await supabase
    .from("business_info")
    .select("ai_name")
    .eq("id", anyRow.ai_id)
    .maybeSingle();
  
  return NextResponse.json({ 
    connected: true,
    info: {
      ai_id: anyRow.ai_id,
      ai_name: aiData?.ai_name || 'AI',
      portal_id: anyRow.portal_id || null,
      connected_at: anyRow.created_at
    }
  });
}
