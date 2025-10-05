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
      // First, check what client_id the conversation has
      const { data: checkData } = await supabase
        .from('conversations')
        .select('id, client_id')
        .eq('id', conversationId)
        .single();
      
      console.log('[Intervention] Conversation check:', {
        conversationId,
        conversationClientId: checkData?.client_id,
        loggedInUserId: userId,
        match: checkData?.client_id === userId
      });

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

      // Send handoff message to customer (only once when intervention is enabled)
      try {
        const handoffMessage = "An agent will assist you shortly. Please wait.";
        
        // Get end user details to determine platform
        const { data: endUserData } = await supabase
          .from('end_users')
          .select('phone')
          .eq('id', data.end_user_id)
          .single();
        
        const isWhatsApp = endUserData?.phone && endUserData.phone !== 'Anonymous';
        
        if (isWhatsApp) {
          // Send WhatsApp message
          const backendUrl = process.env.WHATSAPP_BACKEND_URL || 'https://growbro-backend.fly.dev';
          await fetch(`${backendUrl}/send-whatsapp-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ai_id: data.ai_id,
              phone_number: endUserData.phone,
              message: handoffMessage,
            }),
          });
        } else {
          // For website, save message to DB (widget will pick it up)
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            ai_id: data.ai_id,
            client_id: userId,
            sender: 'bot',
            content: handoffMessage,
            message_type: 'text',
            timestamp: new Date().toISOString(),
            metadata: { is_bot: true, is_handoff: true },
          });
        }
        
        console.log('[Intervention] Handoff message sent');
      } catch (handoffError) {
        console.error('[Intervention] Error sending handoff message:', handoffError);
        // Don't fail the intervention if handoff message fails
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
