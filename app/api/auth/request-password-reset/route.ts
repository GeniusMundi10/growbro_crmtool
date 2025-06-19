import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    // Create a Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the base URL for the reset password link
    // Use Vercel's environment variables if available, otherwise fall back to NEXT_PUBLIC_SITE_URL or localhost
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      
    const redirectTo = `${baseUrl}/reset-password`;
    console.log('Sending password reset email with redirect URL:', redirectTo);

    // Send the password reset email
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo
    });

    console.log('Password reset response:', { data, error });

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to send password reset email' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Password reset email sent. Please check your inbox.' 
    });
  } catch (err) {
    console.error('Error in password reset request:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' }, 
      { status: 500 }
    );
  }
}
