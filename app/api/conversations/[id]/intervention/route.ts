import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    const { action } = await request.json();

    // Get user from session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Supabase client with service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user ID from auth header (you may need to adjust this based on your auth setup)
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = user.id;

    if (action === 'enable') {
      // Enable intervention
      const { data, error } = await supabase
        .from('conversations')
        .update({
          intervention_enabled: true,
          intervention_started_at: new Date().toISOString(),
          last_intervention_activity: new Date().toISOString(),
          intervened_by: userId,
        })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) {
        console.error('Error enabling intervention:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        intervention_enabled: true,
        intervention_started_at: data.intervention_started_at,
        message: 'Intervention enabled. You will now receive customer messages.',
      });

    } else if (action === 'disable') {
      // Disable intervention and send handoff message
      const { data, error } = await supabase
        .from('conversations')
        .update({
          intervention_enabled: false,
          intervention_started_at: null,
          last_intervention_activity: null,
          intervened_by: null,
        })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) {
        console.error('Error disabling intervention:', error);
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('conversations')
      .select('intervention_enabled, intervention_started_at, intervened_by, last_intervention_activity')
      .eq('id', conversationId)
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
