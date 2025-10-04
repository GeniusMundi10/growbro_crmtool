import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');

    // Create Supabase client with auth helpers (handles cookies automatically)
    const supabase = createRouteHandlerClient({ cookies });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[Poll] Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Query for conversations that have been updated since the last poll
    // This includes:
    // 1. New messages (last_customer_message_at updated)
    // 2. Intervention status changes
    // 3. Unread count changes
    
    let query = supabase
      .from('chat_history')
      .select('*')
      .eq('client_id', userId);

    // If 'since' timestamp provided, only get conversations updated after that time
    if (since) {
      // Check for conversations where:
      // - last_customer_message_at is after 'since' OR
      // - intervention_started_at is after 'since' (intervention was toggled)
      query = query.or(`last_customer_message_at.gte.${since},intervention_started_at.gte.${since}`);
    }

    const { data: conversations, error } = await query
      .order('date', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[Polling] Error fetching conversations:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return updated conversations
    return NextResponse.json({
      updated_conversations: conversations || [],
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Polling] API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
