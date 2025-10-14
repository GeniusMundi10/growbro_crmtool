-- Google Calendar Integrations Table
-- Stores OAuth tokens and sync settings for Google Calendar integration

CREATE TABLE IF NOT EXISTS google_calendar_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_id UUID NOT NULL REFERENCES business_info(id) ON DELETE CASCADE,
  
  -- OAuth tokens
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  
  -- Calendar configuration
  calendar_id TEXT NOT NULL DEFAULT 'primary',
  calendar_name TEXT,
  timezone TEXT DEFAULT 'UTC',
  
  -- Sync settings
  sync_enabled BOOLEAN DEFAULT true,
  auto_create_events BOOLEAN DEFAULT true,
  auto_update_events BOOLEAN DEFAULT true,
  auto_delete_events BOOLEAN DEFAULT true,
  
  -- Event defaults
  event_color_id TEXT DEFAULT '9', -- Blue color
  default_duration_minutes INTEGER DEFAULT 30,
  add_meet_link BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  
  -- Constraints
  UNIQUE(user_id, ai_id),
  UNIQUE(ai_id) -- One calendar integration per AI
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_gcal_user_id ON google_calendar_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_gcal_ai_id ON google_calendar_integrations(ai_id);

-- Row Level Security
ALTER TABLE google_calendar_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own calendar integrations"
  ON google_calendar_integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar integrations"
  ON google_calendar_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar integrations"
  ON google_calendar_integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar integrations"
  ON google_calendar_integrations FOR DELETE
  USING (auth.uid() = user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_google_calendar_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
CREATE TRIGGER update_google_calendar_integrations_timestamp
  BEFORE UPDATE ON google_calendar_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_google_calendar_integrations_updated_at();

-- Calendar Event Mappings Table
-- Tracks which bookings are synced to which calendar events

CREATE TABLE IF NOT EXISTS calendar_event_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  calendar_integration_id UUID NOT NULL REFERENCES google_calendar_integrations(id) ON DELETE CASCADE,
  
  -- Google Calendar event details
  event_id TEXT NOT NULL,
  event_link TEXT,
  meet_link TEXT,
  
  -- Sync status
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced', -- synced, pending, error
  sync_error TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(booking_id),
  UNIQUE(event_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_calendar_mappings_booking_id ON calendar_event_mappings(booking_id);
CREATE INDEX IF NOT EXISTS idx_calendar_mappings_event_id ON calendar_event_mappings(event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_mappings_integration_id ON calendar_event_mappings(calendar_integration_id);

-- RLS for calendar_event_mappings
ALTER TABLE calendar_event_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their calendar mappings"
  ON calendar_event_mappings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN business_info bi ON b.ai_id = bi.id
      WHERE b.id = calendar_event_mappings.booking_id
      AND bi.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their calendar mappings"
  ON calendar_event_mappings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN business_info bi ON b.ai_id = bi.id
      WHERE b.id = calendar_event_mappings.booking_id
      AND bi.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their calendar mappings"
  ON calendar_event_mappings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN business_info bi ON b.ai_id = bi.id
      WHERE b.id = calendar_event_mappings.booking_id
      AND bi.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their calendar mappings"
  ON calendar_event_mappings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN business_info bi ON b.ai_id = bi.id
      WHERE b.id = calendar_event_mappings.booking_id
      AND bi.user_id = auth.uid()
    )
  );

-- Comments for documentation
COMMENT ON TABLE google_calendar_integrations IS 'Stores Google Calendar OAuth tokens and sync settings per AI';
COMMENT ON TABLE calendar_event_mappings IS 'Maps bookings to Google Calendar events for sync tracking';
