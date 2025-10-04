import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions, or external service)
// Recommended: Run every 5-10 minutes

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the database function to auto-disable stale interventions
    const { data, error } = await supabase.rpc('auto_disable_stale_interventions');

    if (error) {
      console.error('[Auto-disable] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get count of disabled interventions for logging
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data: disabledConversations, error: countError } = await supabase
      .from('conversations')
      .select('id, ai_id, intervened_by')
      .eq('intervention_enabled', false)
      .gte('last_intervention_activity', thirtyMinutesAgo)
      .is('intervention_started_at', null);

    const count = disabledConversations?.length || 0;

    console.log(`[Auto-disable] Disabled ${count} stale interventions`);

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

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}
