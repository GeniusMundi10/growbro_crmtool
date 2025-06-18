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

    // Verify the OTP token using the existing client
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

    // At this point, the client is authenticated with Supabase
    // Now update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    });

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Sign out after password reset
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unexpected error in reset-password:', err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
