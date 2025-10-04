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

    // Query conversations table directly (has all intervention columns)
    // Then join with other data we need
    let query = supabase
      .from('conversations')
      .select(`
        id,
        client_id,
        ai_id,
        end_user_id,
        started_at,
        intervention_enabled,
        intervention_started_at,
        last_intervention_activity,
        intervened_by,
        unread_count,
        last_customer_message_at,
        end_users:end_user_id (
          name,
          email,
          phone
        ),
        business_info:ai_id (
          ai_name
        )
      `)
      .eq('client_id', userId);

    // If 'since' timestamp provided, only get conversations updated after that time
    if (since) {
      query = query.or(`last_customer_message_at.gte.${since},intervention_started_at.gte.${since}`);
    }

    const { data: rawConversations, error } = await query
      .order('started_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[Polling] Error fetching conversations:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get message counts for each conversation
    const conversationIds = rawConversations?.map(c => c.id) || [];
    const { data: messageCounts } = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', conversationIds);

    // Count messages per conversation
    const messageCountMap = (messageCounts || []).reduce((acc: any, msg: any) => {
      acc[msg.conversation_id] = (acc[msg.conversation_id] || 0) + 1;
      return acc;
    }, {});

    // Format conversations to match expected structure
    const conversations = rawConversations?.map((c: any) => ({
      chat_id: c.id,
      date: c.started_at,
      ai_name: c.business_info?.[0]?.ai_name || 'Unknown',
      name: c.end_users?.[0]?.name || 'Anonymous',
      email: c.end_users?.[0]?.email || 'Anonymous',
      phone: c.end_users?.[0]?.phone || 'Anonymous',
      messages_count: messageCountMap[c.id] || 0,
      duration: '0 min',
      client_id: c.client_id,
      ai_id: c.ai_id,
      end_user_id: c.end_user_id,
      intervention_enabled: c.intervention_enabled || false,
      intervention_started_at: c.intervention_started_at,
      last_intervention_activity: c.last_intervention_activity,
      intervened_by: c.intervened_by,
      unread_count: c.unread_count || 0,
      last_customer_message_at: c.last_customer_message_at,
    })) || [];

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
