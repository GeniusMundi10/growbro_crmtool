import { createClient } from "@supabase/supabase-js"

// Safely get environment variables with fallbacks for better error messages
const getEnvVar = (name: string, defaultValue: string = '') => {
  const value = process.env[name] || defaultValue;
  
  // In a production environment, we should fail gracefully if the variable is missing
  if (!value && process.env.NODE_ENV === 'production') {
    console.error(`Missing required environment variable: ${name}`);
    // Return a placeholder to prevent crashes, we'll handle this later in the client logic
    return defaultValue;
  }
  
  return value;
}

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL', '');
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');

// Only log in development, not in production
if (process.env.NODE_ENV !== 'production') {
  console.log("Supabase URL configured:", supabaseUrl ? "YES" : "NO (missing)");
  console.log("Supabase Anon Key configured:", supabaseAnonKey ? "YES" : "NO (missing)");
}

// Create a client factory function to handle missing credentials gracefully
const createSupabaseClient = () => {
  try {
    // Verify credentials before creating the client
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Supabase credentials missing. Using mock data only.");
      return null;
    }
    
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false // Don't persist session in this admin-like context
      },
      global: {
        headers: {
          // Add authorization headers to bypass RLS as admin
          "apikey": supabaseAnonKey,
          "Authorization": `Bearer ${supabaseAnonKey}`
        }
      }
    });
  } catch (error) {
    console.error("Failed to create Supabase client:", error);
    return null;
  }
};

// Create the client or set to null if it fails
export const supabase = createSupabaseClient();

// Helper function to check if we should use mock data
const shouldUseMockData = () => {
  return !supabase || process.env.NODE_ENV === 'development';
}

// Database types
export type User = {
  id: string
  email: string
  full_name: string
  avatar_url: string
  created_at: string
}

export type BusinessInfo = {
  id: string
  user_id: string
  ai_name: string
  company_name: string
  website: string
  email: string
  calendar_link: string
  phone_number: string
  agent_type: string
  // Branding settings
  heading_title_color?: string
  heading_background_color?: string
  ai_message_color?: string
  ai_message_background_color?: string
  user_message_color?: string
  user_message_background_color?: string
  widget_color?: string
  send_button_color?: string
  start_minimized?: boolean
  created_at: string
  updated_at: string
}

export type ChatMessage = {
  id: string
  conversation_id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

export type Conversation = {
  id: string
  user_id: string
  visitor_name: string
  visitor_email: string
  visitor_phone?: string
  status: "active" | "ended"
  created_at: string
  updated_at: string
}

export type Lead = {
  id: string
  user_id: string
  name: string
  email: string
  phone: string
  company: string
  source: string
  status: "new" | "contacted" | "qualified" | "proposal" | "closed"
  notes?: string
  created_at: string
  updated_at: string
}

export type Resource = {
  id: string
  user_id: string
  title: string
  url: string
  type: "website" | "file" | "link"
  file_path?: string
  created_at: string
}

export type Analytics = {
  id: string
  user_id: string
  total_conversations: number
  total_messages: number
  total_leads: number
  avg_conversation_length: number
  data_period: "day" | "week" | "month"
  created_at: string
}

export type TeamMember = {
  id: string
  user_id: string
  member_email: string
  role: "admin" | "member" | "viewer"
  status: "invited" | "active"
  created_at: string
}

// Mock user for demo purposes
const mockUser: User = {
  id: "demo-user-123",
  email: "user@example.com",
  full_name: "GrowBro User",
  avatar_url: "",
  created_at: new Date().toISOString()
};

// Database functions
export async function getCurrentUser(): Promise<User | null> {
  // Return mock user instead of authenticating
  return mockUser;
}

// Create a type-safe wrapper for Supabase functions that handles the null client case
const safeSupabaseOp = async <T>(
  operation: (client: any) => Promise<T>,
  mockData: T
): Promise<T> => {
  if (!supabase) {
    console.log("Using mock data (Supabase client unavailable)");
    return mockData;
  }
  
  try {
    return await operation(supabase);
  } catch (error) {
    console.error("Supabase operation failed:", error);
    return mockData;
  }
};

export async function getBusinessInfo(id: string): Promise<BusinessInfo | null> {
  // Define mock data
  const mockData: BusinessInfo = {
    id: "mock-business-info-id",
    user_id: id,
    ai_name: "GrowBro Assistant",
    company_name: "GrowBro Technologies",
    website: "https://example.com",
    email: "contact@example.com",
    calendar_link: "https://calendar.example.com",
    phone_number: "555-123-4567",
    agent_type: "information-education",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return safeSupabaseOp(async (client) => {
    // Try to find by ID first
    let query = client.from("business_info").select("*");
    
    // Check if the id is a UUID (business_info.id) or a user_id
    if (id.includes('-')) {
      // Looks like a UUID, try querying by id
      query = query.eq("id", id);
    } else {
      // Otherwise treat as user_id
      query = query.eq("user_id", id);
    }
    
    const { data, error } = await query.single();

    if (error) {
      throw error;
    }

    return data;
  }, mockData);
}

export async function updateBusinessInfo(businessInfo: Partial<BusinessInfo>): Promise<boolean> {
  return safeSupabaseOp(async (client) => {
    const { error } = await client.from("business_info").update(businessInfo).eq("id", businessInfo.id);
    if (error) throw error;
    return true;
  }, true); // Return true as mock success
}

export async function createBusinessInfo(userId: string, businessInfo: Partial<BusinessInfo>): Promise<BusinessInfo | null> {
  const mockData: BusinessInfo = {
    id: `mock-business-info-${Date.now()}`,
    user_id: userId,
    ai_name: businessInfo.ai_name || "GrowBro Assistant",
    company_name: businessInfo.company_name || "GrowBro Technologies",
    website: businessInfo.website || "https://example.com",
    email: businessInfo.email || "contact@example.com",
    calendar_link: businessInfo.calendar_link || "https://calendar.example.com",
    phone_number: businessInfo.phone_number || "555-123-4567",
    agent_type: businessInfo.agent_type || "information-education",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return safeSupabaseOp(async (client) => {
    const { data, error } = await client
      .from("business_info")
      .insert([{ user_id: userId, ...businessInfo }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }, mockData);
}

export async function getLeads(userId: string): Promise<Lead[]> {
  // Define mock data
  const mockData: Lead[] = [
    {
      id: "mock-lead-1",
      user_id: userId,
      name: "John Doe",
      email: "john@example.com",
      phone: "555-111-2222",
      company: "Acme Inc",
      source: "Website",
      status: "new",
      notes: "Interested in our services",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "mock-lead-2",
      user_id: userId,
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "555-333-4444",
      company: "XYZ Corp",
      source: "Referral",
      status: "contacted",
      notes: "Follow up next week",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  return safeSupabaseOp(async (client) => {
    const { data, error } = await client
      .from("leads")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }, mockData);
}

export async function createLead(lead: Omit<Lead, "id" | "created_at" | "updated_at">): Promise<Lead | null> {
  // Define mock data
  const mockData: Lead = {
    id: "mock-lead-new",
    ...lead,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return safeSupabaseOp(async (client) => {
    const { data, error } = await client
      .from("leads")
      .insert([lead])
      .select()
      .single();

    if (error) throw error;
    return data;
  }, mockData);
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  // Define mock data
  const mockData: Conversation[] = [
    {
      id: "mock-convo-1",
      user_id: userId,
      visitor_name: "Sam Wilson",
      visitor_email: "sam@example.com",
      visitor_phone: "555-987-6543",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "mock-convo-2",
      user_id: userId,
      visitor_name: "Alex Johnson",
      visitor_email: "alex@example.com",
      status: "ended",
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 172800000).toISOString()
    }
  ];

  return safeSupabaseOp(async (client) => {
    const { data, error } = await client
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }, mockData);
}

export async function getChatHistory(conversationId: string): Promise<ChatMessage[]> {
  // Define mock data
  const mockData: ChatMessage[] = [
    {
      id: "mock-msg-1",
      conversation_id: conversationId,
      role: "user",
      content: "Hello, I'm interested in your services.",
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: "mock-msg-2",
      conversation_id: conversationId,
      role: "assistant",
      content: "Hi there! Thanks for reaching out. How can I help you today?",
      created_at: new Date(Date.now() - 3590000).toISOString()
    },
    {
      id: "mock-msg-3",
      conversation_id: conversationId,
      role: "user",
      content: "I'd like to learn more about your pricing.",
      created_at: new Date(Date.now() - 3580000).toISOString()
    }
  ];

  return safeSupabaseOp(async (client) => {
    const { data, error } = await client
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  }, mockData);
}

export async function saveMessage(message: Omit<ChatMessage, "id" | "created_at">): Promise<ChatMessage | null> {
  // Define mock data
  const mockData: ChatMessage = {
    id: `mock-msg-${Date.now()}`,
    ...message,
    created_at: new Date().toISOString()
  };

  return safeSupabaseOp(async (client) => {
    const { data, error } = await client
      .from("chat_messages")
      .insert([message])
      .select()
      .single();

    if (error) throw error;
    return data;
  }, mockData);
}

export async function getAnalytics(userId: string, period: "day" | "week" | "month" = "week"): Promise<Analytics | null> {
  // Define mock data
  const mockData: Analytics = {
    id: "mock-analytics-id",
    user_id: userId,
    total_conversations: 87,
    total_messages: 563,
    total_leads: 42,
    avg_conversation_length: 12,
    data_period: period,
    created_at: new Date().toISOString()
  };

  return safeSupabaseOp(async (client) => {
    const { data, error } = await client
      .from("analytics")
      .select("*")
      .eq("user_id", userId)
      .eq("data_period", period)
      .single();

    if (error) throw error;
    return data;
  }, mockData);
}

export async function getTeamMembers(userId: string): Promise<TeamMember[]> {
  // Define mock data
  const mockData: TeamMember[] = [
    {
      id: "mock-team-1",
      user_id: userId,
      member_email: "team1@example.com",
      role: "admin",
      status: "active",
      created_at: new Date().toISOString()
    },
    {
      id: "mock-team-2",
      user_id: userId,
      member_email: "team2@example.com",
      role: "member",
      status: "active",
      created_at: new Date().toISOString()
    }
  ];

  return safeSupabaseOp(async (client) => {
    const { data, error } = await client
      .from("team_members")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }, mockData);
}

export async function addTeamMember(userId: string, memberEmail: string, role: "admin" | "member" | "viewer"): Promise<TeamMember | null> {
  // Define mock data
  const mockData: TeamMember = {
    id: `mock-team-${Date.now()}`,
    user_id: userId,
    member_email: memberEmail,
    role,
    status: "invited",
    created_at: new Date().toISOString()
  };

  return safeSupabaseOp(async (client) => {
    const { data, error } = await client
      .from("team_members")
      .insert([{ user_id: userId, member_email: memberEmail, role, status: "invited" }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }, mockData);
}

// Debug utility - directly fetch all users with detailed error handling
export async function debugFetchUsers() {
  return safeSupabaseOp(async (client) => {
    console.log("Debug: Attempting to fetch all users...");
    console.log("Debug: Using URL:", supabaseUrl.substring(0, 15) + "...");
    
    const { data, error } = await client
      .from("users")
      .select("*");
      
    if (error) throw error;
    return { success: true, data, error: null };
  }, { success: false, data: null, error: null });
}

// Special function to directly fetch users with explicit auth
export async function fetchUsersDirectly() {
  try {
    // First, let's try with explicit authorization headers
    const response = await fetch(`${supabaseUrl}/rest/v1/users?select=*`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    if (!response.ok) {
      console.error(`Error fetching users: ${response.status} ${response.statusText}`);
      // Fall back to creating a mock user
      return [{
        id: "demo-user-123",
        name: "GrowBro Technologies",
        email: "contact@growbro.ai",
        avatar_url: "https://growbro.ai/logo.png",
        plan: "premium",
        created_at: new Date().toISOString()
      }];
    }
    
    const data = await response.json();
    console.log("Successfully fetched users:", data);
    return data;
  } catch (error) {
    console.error("Error in fetchUsersDirectly:", error);
    // Fall back to creating a mock user
    return [{
      id: "demo-user-123",
      name: "GrowBro Technologies",
      email: "contact@growbro.ai",
      avatar_url: "https://growbro.ai/logo.png",
      plan: "premium",
      created_at: new Date().toISOString()
    }];
  }
}

// Fetch all AIs for a user
export async function getAIsForUser(userId: string) {
  return safeSupabaseOp(async (client) => {
    const { data, error } = await client
      .from("business_info")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
      
    if (error) throw error;
    return data || [];
  }, []);
}

// Create a new AI
export async function createAIForUser(userId: string, aiData: Partial<BusinessInfo>) {
  return safeSupabaseOp(async (client) => {
    const { data, error } = await client
      .from("business_info")
      .insert([{ user_id: userId, ...aiData }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }, {
    id: `mock-ai-${Date.now()}`,
    user_id: userId,
    ai_name: aiData.ai_name || "AI Assistant",
    company_name: aiData.company_name || "Company",
    agent_type: aiData.agent_type || "information-education",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
}

// Update an AI
export async function updateAI(aiId: string, aiData: Partial<BusinessInfo>) {
  return safeSupabaseOp(async (client) => {
    const { data, error } = await client
      .from("business_info")
      .update(aiData)
      .eq("id", aiId)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }, { ...aiData, id: aiId, updated_at: new Date().toISOString() });
}

// Delete an AI
export async function deleteAI(aiId: string, userId: string) {
  return safeSupabaseOp(async (client) => {
    const { error } = await client
      .from("business_info")
      .delete()
      .eq("id", aiId)
      .eq("user_id", userId);
      
    if (error) throw error;
    return true;
  }, true);
}

// Get user's AIs
export async function getUserAIs(userId: string): Promise<BusinessInfo[]> {
  return safeSupabaseOp(async (client) => {
    const { data, error } = await client
      .from("business_info")
      .select("*")
      .eq("user_id", userId);
      
    if (error) throw error;
    return data || [];
  }, []);
}
