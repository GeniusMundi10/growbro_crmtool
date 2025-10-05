import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    const { message, platform } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Create Supabase client with auth helpers (handles both auth and DB)
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[Send Message] Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get conversation details
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*, end_users(*)')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check if intervention is enabled
    if (!conversation.intervention_enabled) {
      return NextResponse.json(
        { error: 'Intervention is not enabled for this conversation' },
        { status: 403 }
      );
    }

    // Save message to database
    const { data: savedMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        ai_id: conversation.ai_id,
        client_id: conversation.client_id,
        sender: 'agent',
        content: message,
        message_type: platform === 'whatsapp' ? 'whatsapp' : 'text',
        sent_by_human: true,
        timestamp: new Date().toISOString(),
        metadata: {
          is_bot: false,
          sent_by_user_id: user.id,
          platform: platform || 'website'
        }
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error saving message:', messageError);
      return NextResponse.json({ error: messageError.message }, { status: 500 });
    }

    // Update last intervention activity
    await supabase
      .from('conversations')
      .update({
        last_intervention_activity: new Date().toISOString(),
      })
      .eq('id', conversationId);

    // Send message to customer based on platform
    if (platform === 'whatsapp') {
      // Send via WhatsApp API
      const whatsappResponse = await sendWhatsAppMessage(
        conversation.ai_id,
        conversation.end_users?.phone,
        message
      );

      if (!whatsappResponse.success) {
        return NextResponse.json(
          { error: 'Failed to send WhatsApp message' },
          { status: 500 }
        );
      }
    } else {
      // For website chat, message is already in DB and will be picked up by the widget
      // No additional action needed
    }

    return NextResponse.json({
      success: true,
      message_id: savedMessage.id,
      message: 'Message sent successfully',
    });

  } catch (error) {
    console.error('Send message API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to send WhatsApp message
async function sendWhatsAppMessage(aiId: string, phoneNumber: string, message: string) {
  try {
    // Call your WhatsApp backend at https://growbro-backend.fly.dev
    const backendUrl = process.env.WHATSAPP_BACKEND_URL || 'https://growbro-backend.fly.dev';
    const response = await fetch(`${backendUrl}/send-whatsapp-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ai_id: aiId,
        phone_number: phoneNumber,
        message: message,
      }),
    });

    if (!response.ok) {
      throw new Error('WhatsApp API error');
    }

    return { success: true };
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return { success: false, error };
  }
}
