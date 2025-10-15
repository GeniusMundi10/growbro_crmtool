-- Add booking configuration columns to business_info table
-- These columns store the industry-agnostic booking system configuration

ALTER TABLE business_info 
ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS booking_config JSONB DEFAULT '{}';

-- Add index for faster queries when checking if booking is enabled
CREATE INDEX IF NOT EXISTS idx_business_info_booking_enabled 
ON business_info ((booking_config->>'enabled'));

-- Add comments for documentation
COMMENT ON COLUMN business_info.business_hours IS 'Operating hours by day of week (monday-sunday) with open/close times and enabled flag';
COMMENT ON COLUMN business_info.booking_config IS 'Industry-agnostic booking system configuration including services, forms, labels, and slot settings';

-- Example business_hours structure:
-- {
--   "monday": {"open": "09:00", "close": "18:00", "enabled": true},
--   "tuesday": {"open": "09:00", "close": "18:00", "enabled": true},
--   ...
-- }

-- Example booking_config structure:
-- {
--   "version": 1,
--   "enabled": true,
--   "industry_type": "technology",
--   "services": [
--     {
--       "key": "product_demo",
--       "name": "Product Demo",
--       "workflow_type": "scheduled",
--       "duration_minutes": 30,
--       "active": true,
--       "channels": ["web", "whatsapp"]
--     }
--   ],
--   "forms": [
--     {
--       "id": "field_1",
--       "label": "Company Name",
--       "type": "text",
--       "required": true,
--       "service_keys": ["product_demo"]
--     }
--   ],
--   "labels": {
--     "dashboard_title": "Client Meetings",
--     "scheduled_tab": "Scheduled Demos",
--     "request_tab": "Consultation Requests"
--   },
--   "slot_settings": {
--     "duration_minutes": 30
--   }
-- }
