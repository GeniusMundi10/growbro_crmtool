import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET - Fetch notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    let query = supabase
      .from('conversation_notifications')
      .select(`
        *,
        conversations:conversation_id (
          id,
          ai_id,
          end_user_id,
          end_users (
            name,
            email,
            phone
          )
        ),
        messages:message_id (
          content,
          timestamp
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('conversation_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    return NextResponse.json({
      notifications: notifications || [],
      unread_count: unreadCount || 0,
    });

  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create notification (called by backend when new message arrives)
export async function POST(request: NextRequest) {
  try {
    const { conversation_id, message_id, user_id, message_preview, customer_name } = await request.json();

    if (!conversation_id || !message_id || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if notification already exists
    const { data: existing } = await supabase
      .from('conversation_notifications')
      .select('id')
      .eq('conversation_id', conversation_id)
      .eq('message_id', message_id)
      .eq('user_id', user_id)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Notification already exists',
        notification_id: existing.id,
      });
    }

    // Create notification
    const { data, error } = await supabase
      .from('conversation_notifications')
      .insert({
        conversation_id,
        message_id,
        user_id,
        message_preview: message_preview || '',
        customer_name: customer_name || 'Customer',
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notification_id: data.id,
    });

  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
