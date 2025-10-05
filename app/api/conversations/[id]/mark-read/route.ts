import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;

    // Create Supabase client with auth helpers
    const supabase = createRouteHandlerClient({ cookies });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[Mark Read] Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Reset unread count to 0 for this conversation
    const { data, error } = await supabase
      .from('conversations')
      .update({
        unread_count: 0,
      })
      .eq('id', conversationId)
      .eq('client_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[Mark Read] Error marking conversation as read:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      unread_count: 0,
    });

  } catch (error) {
    console.error('[Mark Read] API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
