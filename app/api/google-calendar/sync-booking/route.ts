import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { syncBookingToCalendar } from '@/lib/google-calendar';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { booking_id, ai_id, service_name } = body;

    if (!booking_id || !ai_id) {
      return NextResponse.json(
        { error: 'Missing booking_id or ai_id' },
        { status: 400 }
      );
    }

    // Get booking details from database
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      console.error('[Google Calendar Sync] Booking not found:', booking_id);
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Sync to Google Calendar
    const result = await syncBookingToCalendar(
      booking,
      ai_id,
      service_name || booking.service_key
    );

    if (result) {
      return NextResponse.json({
        success: true,
        message: 'Booking synced to Google Calendar',
        event_id: result.id
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No Google Calendar integration found or sync skipped'
      });
    }
  } catch (error) {
    console.error('[Google Calendar Sync] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync booking',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
