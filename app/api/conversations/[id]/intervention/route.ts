import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    const { action } = await request.json();

    // Create Supabase client with auth helpers (uses RLS policies)
    const supabase = createRouteHandlerClient({ cookies });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[Intervention] Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    if (action === 'enable') {
      // Enable intervention (RLS will ensure user can only update their own conversations)
      const { data, error } = await supabase
        .from('conversations')
        .update({
          intervention_enabled: true,
          intervention_started_at: new Date().toISOString(),
          last_intervention_activity: new Date().toISOString(),
          intervened_by: userId,
        })
        .eq('id', conversationId)
        .eq('client_id', userId)
        .select()
        .single();

      if (error) {
        console.error('[Intervention] Error enabling intervention:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        intervention_enabled: true,
        intervention_started_at: data.intervention_started_at,
        message: 'Intervention enabled. You will now receive customer messages.',
      });

    } else if (action === 'disable') {
      // Disable intervention (RLS will ensure user can only update their own conversations)
      const { data, error } = await supabase
        .from('conversations')
        .update({
          intervention_enabled: false,
          intervention_started_at: null,
          last_intervention_activity: null,
          intervened_by: null,
        })
        .eq('id', conversationId)
        .eq('client_id', userId)
        .select()
        .single();

      if (error) {
        console.error('[Intervention] Error disabling intervention:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // TODO: Send handoff message to customer
      // This will be implemented in Phase 3

      return NextResponse.json({
        success: true,
        intervention_enabled: false,
        message: 'Intervention disabled. AI will now respond to customer.',
      });

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Intervention API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check intervention status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;

    // Create Supabase client with auth helpers (uses RLS policies)
    const supabase = createRouteHandlerClient({ cookies });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('intervention_enabled, intervention_started_at, intervened_by, last_intervention_activity')
      .eq('id', conversationId)
      .eq('client_id', user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      intervention_enabled: data.intervention_enabled || false,
      intervention_started_at: data.intervention_started_at,
      intervened_by: data.intervened_by,
      last_intervention_activity: data.last_intervention_activity,
    });

  } catch (error) {
    console.error('Get intervention status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
