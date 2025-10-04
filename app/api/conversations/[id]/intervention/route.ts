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

    // Create Supabase client with service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from session cookies (Next.js 13+ way)
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    
    // Try to find Supabase auth cookie
    const allCookies = cookieStore.getAll();
    const authCookie = allCookies.find(c => 
      c.name.includes('sb-') && c.name.includes('auth-token')
    );
    
    if (!authCookie) {
      console.error('[Intervention] No auth cookie found. Available cookies:', allCookies.map(c => c.name));
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authCookie.value);

    if (authError || !user) {
      console.error('[Intervention] Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized - Invalid session' }, { status: 401 });
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
