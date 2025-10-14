import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/google-calendar/callback';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // ai_id
  const error = searchParams.get('error');

  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/google-calendar-callback?error=gcal_${error}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/google-calendar-callback?error=gcal_missing_params`
    );
  }

  const ai_id = state;

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?redirect=/integrations`
      );
    }

    // Exchange authorization code for tokens
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to get tokens from Google');
    }

    oauth2Client.setCredentials(tokens);

    // Get primary calendar info
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const calendarList = await calendar.calendarList.list();
    const primaryCalendar = calendarList.data.items?.find((cal: any) => cal.primary);

    // Calculate token expiry
    const expiryDate = tokens.expiry_date 
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000); // 1 hour default

    // Store in database
    const { error: dbError } = await supabase
      .from('google_calendar_integrations')
      .upsert({
        user_id: user.id,
        ai_id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: expiryDate.toISOString(),
        calendar_id: primaryCalendar?.id || 'primary',
        calendar_name: primaryCalendar?.summary || 'Primary Calendar',
        timezone: primaryCalendar?.timeZone || 'UTC',
        sync_enabled: true,
        auto_create_events: true,
        auto_update_events: true,
        auto_delete_events: true,
      }, {
        onConflict: 'user_id,ai_id'
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    // Redirect to popup callback page that will close itself and notify the opener
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/google-calendar-callback?status=gcal_connected`
    );
  } catch (error) {
    console.error('Google Calendar OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/google-calendar-callback?error=gcal_oauth_failed`
    );
  }
}
