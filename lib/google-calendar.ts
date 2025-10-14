import { google } from 'googleapis';
import { supabase } from '@/lib/supabase';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

interface GoogleCalendarIntegration {
  id: string;
  user_id: string;
  ai_id: string;
  access_token: string;
  refresh_token: string;
  token_expiry: string;
  calendar_id: string;
  calendar_name: string;
  timezone: string;
  sync_enabled: boolean;
  auto_create_events: boolean;
  auto_update_events: boolean;
  auto_delete_events: boolean;
  event_color_id: string;
  default_duration_minutes: number;
  add_meet_link: boolean;
}

interface Booking {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  service_key: string;
  workflow_type: string;
  date?: string;
  time?: string;
  status: string;
  metadata?: any;
  notes?: string;
  duration_minutes?: number;
}

/**
 * Refresh access token if it's expired or about to expire
 */
export async function refreshTokenIfNeeded(integration: GoogleCalendarIntegration) {
  const now = new Date();
  const expiry = new Date(integration.token_expiry);

  // Refresh if token expires in less than 5 minutes
  if (expiry.getTime() - now.getTime() < 5 * 60 * 1000) {
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      refresh_token: integration.refresh_token,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    
    // Update database
    await supabase
      .from('google_calendar_integrations')
      .update({
        access_token: credentials.access_token!,
        token_expiry: new Date(credentials.expiry_date!).toISOString(),
      })
      .eq('id', integration.id);

    return {
      access_token: credentials.access_token!,
      refresh_token: integration.refresh_token,
    };
  }

  return {
    access_token: integration.access_token,
    refresh_token: integration.refresh_token,
  };
}

/**
 * Get Google Calendar integration for an AI
 */
export async function getGoogleCalendarIntegration(ai_id: string): Promise<GoogleCalendarIntegration | null> {
  try {
    const { data, error } = await supabase
      .from('google_calendar_integrations')
      .select('*')
      .eq('ai_id', ai_id)
      .eq('sync_enabled', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data as GoogleCalendarIntegration;
  } catch (error) {
    console.error('Error getting Google Calendar integration:', error);
    return null;
  }
}

/**
 * Create a calendar event from a booking
 */
export async function createCalendarEvent(
  integration: GoogleCalendarIntegration,
  booking: Booking,
  serviceName: string
) {
  try {
    // Refresh token if needed
    const tokens = await refreshTokenIfNeeded(integration);

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Build event description
    const description = [
      `Booking from GrowBro CRM`,
      ``,
      `Customer: ${booking.customer_name}`,
      `Phone: ${booking.customer_phone}`,
      booking.customer_email ? `Email: ${booking.customer_email}` : null,
      ``,
      booking.notes ? `Notes: ${booking.notes}` : null,
    ].filter(Boolean).join('\n');

    // Calculate start and end times
    const startDateTime = new Date(`${booking.date}T${booking.time}`);
    const durationMinutes = booking.duration_minutes || integration.default_duration_minutes || 30;
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

    const event = {
      summary: `${serviceName} - ${booking.customer_name}`,
      description,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: integration.timezone,
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: integration.timezone,
      },
      colorId: integration.event_color_id,
      conferenceData: integration.add_meet_link ? {
        createRequest: {
          requestId: `growbro-${booking.id}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      } : undefined,
    };

    const response = await calendar.events.insert({
      calendarId: integration.calendar_id,
      requestBody: event,
      conferenceDataVersion: integration.add_meet_link ? 1 : 0,
    });

    // Store event mapping
    await supabase
      .from('calendar_event_mappings')
      .insert({
        booking_id: booking.id,
        calendar_integration_id: integration.id,
        event_id: response.data.id!,
        event_link: response.data.htmlLink,
        meet_link: response.data.hangoutLink,
        sync_status: 'synced',
      });

    console.log(`[Google Calendar] Created event ${response.data.id} for booking ${booking.id}`);
    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    
    // Log error in mapping table
    await supabase
      .from('calendar_event_mappings')
      .insert({
        booking_id: booking.id,
        calendar_integration_id: integration.id,
        event_id: `error-${Date.now()}`,
        sync_status: 'error',
        sync_error: error instanceof Error ? error.message : 'Unknown error',
      });
    
    throw error;
  }
}

/**
 * Update an existing calendar event
 */
export async function updateCalendarEvent(
  integration: GoogleCalendarIntegration,
  eventId: string,
  booking: Booking,
  serviceName: string
) {
  try {
    const tokens = await refreshTokenIfNeeded(integration);

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const description = [
      `Booking from GrowBro CRM`,
      ``,
      `Customer: ${booking.customer_name}`,
      `Phone: ${booking.customer_phone}`,
      booking.customer_email ? `Email: ${booking.customer_email}` : null,
      ``,
      booking.notes ? `Notes: ${booking.notes}` : null,
    ].filter(Boolean).join('\n');

    const startDateTime = new Date(`${booking.date}T${booking.time}`);
    const durationMinutes = booking.duration_minutes || integration.default_duration_minutes || 30;
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

    const event = {
      summary: `${serviceName} - ${booking.customer_name}`,
      description,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: integration.timezone,
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: integration.timezone,
      },
    };

    const response = await calendar.events.update({
      calendarId: integration.calendar_id,
      eventId,
      requestBody: event,
    });

    // Update mapping
    await supabase
      .from('calendar_event_mappings')
      .update({
        last_updated_at: new Date().toISOString(),
        sync_status: 'synced',
        sync_error: null,
      })
      .eq('event_id', eventId);

    console.log(`[Google Calendar] Updated event ${eventId} for booking ${booking.id}`);
    return response.data;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    
    // Log error
    await supabase
      .from('calendar_event_mappings')
      .update({
        sync_status: 'error',
        sync_error: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('event_id', eventId);
    
    throw error;
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(
  integration: GoogleCalendarIntegration,
  eventId: string
) {
  try {
    const tokens = await refreshTokenIfNeeded(integration);

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: integration.calendar_id,
      eventId,
    });

    // Delete mapping
    await supabase
      .from('calendar_event_mappings')
      .delete()
      .eq('event_id', eventId);

    console.log(`[Google Calendar] Deleted event ${eventId}`);
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
}

/**
 * Sync a booking to Google Calendar
 * This is the main function to call when a booking is created/updated
 */
export async function syncBookingToCalendar(
  booking: Booking,
  ai_id: string,
  serviceName: string
) {
  try {
    // Get integration
    const integration = await getGoogleCalendarIntegration(ai_id);
    
    if (!integration) {
      console.log(`[Google Calendar] No integration found for AI ${ai_id}`);
      return null;
    }

    // Check if booking should be synced
    if (booking.status !== 'confirmed') {
      console.log(`[Google Calendar] Booking ${booking.id} status is ${booking.status}, skipping sync`);
      return null;
    }

    if (!booking.date || !booking.time) {
      console.log(`[Google Calendar] Booking ${booking.id} has no date/time, skipping sync`);
      return null;
    }

    // Check if event already exists
    const { data: existingMapping } = await supabase
      .from('calendar_event_mappings')
      .select('*')
      .eq('booking_id', booking.id)
      .single();

    if (existingMapping && integration.auto_update_events) {
      // Update existing event
      return await updateCalendarEvent(
        integration,
        existingMapping.event_id,
        booking,
        serviceName
      );
    } else if (!existingMapping && integration.auto_create_events) {
      // Create new event
      return await createCalendarEvent(integration, booking, serviceName);
    }

    return null;
  } catch (error) {
    console.error('Error syncing booking to calendar:', error);
    return null;
  }
}

/**
 * Remove a booking from Google Calendar
 */
export async function removeBookingFromCalendar(
  bookingId: string,
  ai_id: string
) {
  try {
    const integration = await getGoogleCalendarIntegration(ai_id);
    
    if (!integration || !integration.auto_delete_events) {
      return;
    }

    // Get event mapping
    const { data: mapping } = await supabase
      .from('calendar_event_mappings')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (mapping) {
      await deleteCalendarEvent(integration, mapping.event_id);
    }
  } catch (error) {
    console.error('Error removing booking from calendar:', error);
  }
}
