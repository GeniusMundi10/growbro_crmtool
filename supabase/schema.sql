-- Users are handled by Supabase Auth
-- This is an extension on top of the auth.users table

-- Business Info Table
CREATE TABLE business_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  ai_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  website TEXT,
  email TEXT,
  calendar_link TEXT,
  phone_number TEXT,
  agent_type TEXT NOT NULL,
  -- Branding settings
  heading_title_color TEXT DEFAULT '#FFFFFF',
  heading_background_color TEXT DEFAULT '#4285F4',
  ai_message_color TEXT DEFAULT '#000000',
  ai_message_background_color TEXT DEFAULT '#F1F1F1',
  user_message_color TEXT DEFAULT '#FFFFFF',
  user_message_background_color TEXT DEFAULT '#4285F4',
  widget_color TEXT DEFAULT '#4285F4',
  send_button_color TEXT DEFAULT '#4285F4',
  start_minimized BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a unique index on user_id to ensure each user has only one business_info record
CREATE UNIQUE INDEX business_info_user_id_idx ON business_info(user_id);

-- Conversations Table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  visitor_name TEXT,
  visitor_email TEXT,
  visitor_phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages Table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) NOT NULL,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads Table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resources Table (for files, websites and links)
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL, -- 'website', 'file', or 'link'
  file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics Table
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  total_conversations INTEGER NOT NULL DEFAULT 0,
  total_messages INTEGER NOT NULL DEFAULT 0,
  total_leads INTEGER NOT NULL DEFAULT 0,
  avg_conversation_length NUMERIC(5,2) NOT NULL DEFAULT 0,
  data_period TEXT NOT NULL, -- 'day', 'week', or 'month'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a unique index on user_id and data_period for analytics
CREATE UNIQUE INDEX analytics_user_id_data_period_idx ON analytics(user_id, data_period);

-- Team Members Table
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  member_email TEXT NOT NULL,
  role TEXT NOT NULL, -- 'admin', 'member', or 'viewer'
  status TEXT NOT NULL DEFAULT 'invited', -- 'invited' or 'active'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a unique index on user_id and member_email for team_members
CREATE UNIQUE INDEX team_members_user_id_member_email_idx ON team_members(user_id, member_email);

-- Greeting Templates Table
CREATE TABLE greeting_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an RLS policy to restrict access to only the record owner
ALTER TABLE business_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE greeting_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for each table
CREATE POLICY "Users can only access their own business_info"
  ON business_info FOR ALL
  USING (auth.uid() = user_id);

-- Add a more permissive policy for anon role to test API
CREATE POLICY "Allow anon access to business_info"
  ON business_info FOR ALL
  TO anon
  USING (true);

CREATE POLICY "Users can only access their own conversations"
  ON conversations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can access chat messages in their conversations"
  ON chat_messages FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can only access their own leads"
  ON leads FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own resources"
  ON resources FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own analytics"
  ON analytics FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own team members"
  ON team_members FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own greeting templates"
  ON greeting_templates FOR ALL
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update updated_at columns automatically
CREATE TRIGGER update_business_info_updated_at
  BEFORE UPDATE ON business_info
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_greeting_templates_updated_at
  BEFORE UPDATE ON greeting_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 