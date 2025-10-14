import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ connected: false });
    }

    const searchParams = request.nextUrl.searchParams;
    const ai_id = searchParams.get('ai_id');

    let query = supabase
      .from('google_calendar_integrations')
      .select('*')
      .eq('user_id', user.id);

    if (ai_id) {
      query = query.eq('ai_id', ai_id);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      info: {
        ai_id: data.ai_id,
        calendar_name: data.calendar_name,
        calendar_id: data.calendar_id,
        timezone: data.timezone,
        sync_enabled: data.sync_enabled,
        last_sync_at: data.last_sync_at,
      }
    });
  } catch (error) {
    console.error('Google Calendar status check error:', error);
    return NextResponse.json({ connected: false });
  }
}
