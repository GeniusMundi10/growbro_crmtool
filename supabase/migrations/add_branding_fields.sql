-- Add branding fields to business_info table
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS heading_title_color TEXT DEFAULT '#FFFFFF';
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS heading_background_color TEXT DEFAULT '#4285F4';
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS ai_message_color TEXT DEFAULT '#000000';
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS ai_message_background_color TEXT DEFAULT '#F1F1F1';
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS user_message_color TEXT DEFAULT '#FFFFFF';
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS user_message_background_color TEXT DEFAULT '#4285F4';
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS widget_color TEXT DEFAULT '#4285F4';
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS send_button_color TEXT DEFAULT '#4285F4';
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS start_minimized BOOLEAN DEFAULT FALSE; 