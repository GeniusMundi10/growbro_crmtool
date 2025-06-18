import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    // Get the base URL for the reset password link
    // Use Vercel's environment variables if available, otherwise fall back to NEXT_PUBLIC_SITE_URL or localhost
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      
    const redirectTo = `${baseUrl}/reset-password`;
    console.log('Sending password reset email with redirect URL:', redirectTo);

    // Send the password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
