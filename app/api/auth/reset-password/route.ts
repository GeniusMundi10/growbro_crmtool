import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { accessToken, password } = await req.json();
    if (!accessToken || !password) {
      return NextResponse.json({ error: "Missing token or password." }, { status: 400 });
    }
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password }, { accessToken });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
