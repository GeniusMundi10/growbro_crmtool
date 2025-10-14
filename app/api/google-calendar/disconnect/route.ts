import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ai_id } = body;

    if (!ai_id) {
      return NextResponse.json({ error: 'Missing ai_id' }, { status: 400 });
    }

    // Delete integration (cascade will delete event mappings)
    const { error } = await supabase
      .from('google_calendar_integrations')
      .delete()
      .eq('user_id', user.id)
      .eq('ai_id', ai_id);

    if (error) {
      console.error('Error disconnecting Google Calendar:', error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Google Calendar disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Google Calendar' },
      { status: 500 }
    );
  }
}
