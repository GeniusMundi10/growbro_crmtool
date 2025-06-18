import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { accessToken, password } = await req.json();
    if (!accessToken || !password) {
      return NextResponse.json({ error: "Missing token or password." }, { status: 400 });
    }
    // Use the API method for admin-like password reset with token
    // @ts-ignore: auth.api is not in the types but exists in supabase-js
    const { error } = await (supabase as any).auth.api.updateUser(accessToken, { password });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
