import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client-side auto-disable endpoint (no cron needed)
export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const cookieStore = await cookies();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user is authenticated
    const sessionCookie = cookieStore.get('sb-access-token');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(sessionCookie.value);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call the database function to auto-disable stale interventions
    // Only for this user's conversations
    const { error: rpcError } = await supabase.rpc('auto_disable_stale_interventions');

    if (rpcError) {
      console.error('[Auto-disable] Error:', rpcError);
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    // Count how many were disabled (for logging)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data: recentlyDisabled, error: countError } = await supabase
      .from('conversations')
      .select('id')
      .eq('client_id', user.id)
      .eq('intervention_enabled', false)
      .gte('last_intervention_activity', thirtyMinutesAgo)
      .is('intervention_started_at', null);

    const count = recentlyDisabled?.length || 0;

    return NextResponse.json({
      success: true,
      disabled_count: count,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Auto-disable] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
