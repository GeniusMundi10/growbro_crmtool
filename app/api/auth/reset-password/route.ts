import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { accessToken, password } = await req.json();
    if (!accessToken || !password) {
      return NextResponse.json(
        { error: "Missing token or password." },
        { status: 400 }
      );
    }

    // Exchange the access token for a session using the existing client
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: accessToken,
      type: 'recovery',
    });

    if (error) {
      console.error('Error verifying reset token:', error);
      return NextResponse.json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400 }
      );
    }

    // Update the user's password using the authenticated session
    const { error: updateError } = await supabase.auth.updateUser({
      // @ts-ignore - The token is valid at this point
      access_token: accessToken,
      password: password,
    });

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unexpected error in reset-password:', err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
