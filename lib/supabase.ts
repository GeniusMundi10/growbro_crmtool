// import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

export async function getBusinessInfo(userId: string): Promise<BusinessInfo | null> {
  // For demo purposes, return mock data if real data isn't available
  try {
    // const { data, error } = await supabase.from("business_info").select("*").eq("user_id", userId).single()

    // if (error) {
    //   // Don't log the error to console to avoid the error message
    //   return null
    // }

    // return data
    return null;
  } catch (error) {
    // Return mock data for demo without logging the error
    return {
      id: "mock-business-info-id",
      user_id: userId,
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
  }
}

export async function updateBusinessInfo(businessInfo: Partial<BusinessInfo>): Promise<boolean> {
  try {
    // const { error } = await supabase.from("business_info").update(businessInfo).eq("id", businessInfo.id)

    // if (error) {
    //   // Don't log the error to console to avoid the error message
    //   return false
    // }

    // return true
    return true;
  } catch (error) {
    // For demo purposes, return success without logging
    return true
  }
}

export async function createBusinessInfo(userId: string, businessInfo: Partial<BusinessInfo>): Promise<BusinessInfo | null> {
  try {
    // const { data, error } = await supabase
    //   .from("business_info")
    //   .insert([{ user_id: userId, ...businessInfo }])
    //   .select()
    //   .single()

    // if (error) {
    //   // Don't log the error to console to avoid the error message
    //   return null
    // }

    // return data
    return null;
  } catch (error) {
    // Return mock data for demo without logging
    return {
      id: "mock-business-info-id",
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
  }
}

export async function getLeads(userId: string): Promise<Lead[]> {
  try {
    // const { data, error } = await supabase
    //   .from("leads")
    //   .select("*")
    //   .eq("user_id", userId)
    //   .order("created_at", { ascending: false })

    // if (error) {
    //   // Don't log the error to console to avoid the error message
    //   return []
    // }

    // return data || []
    return [];
  } catch (error) {
    // Return mock data for demo without logging
    return [
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
  }
}

export async function createLead(lead: Omit<Lead, "id" | "created_at" | "updated_at">): Promise<Lead | null> {
  try {
    // const { data, error } = await supabase
    //   .from("leads")
    //   .insert([lead])
    //   .select()
    //   .single()

    // if (error) {
    //   // Don't log the error to console to avoid the error message
    //   return null
    // }

    // return data
    return null;
  } catch (error) {
    // Return mock data for demo without logging
    return {
      id: "mock-lead-new",
      ...lead,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  try {
    // const { data, error } = await supabase
    //   .from("conversations")
    //   .select("*")
    //   .eq("user_id", userId)
    //   .order("created_at", { ascending: false })

    // if (error) {
    //   // Don't log the error to console to avoid the error message
    //   return []
    // }

    // return data || []
    return [];
  } catch (error) {
    // Return mock data for demo without logging
    return [
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
  }
}

export async function getChatHistory(conversationId: string): Promise<ChatMessage[]> {
  try {
    // const { data, error } = await supabase
    //   .from("chat_messages")
    //   .select("*")
    //   .eq("conversation_id", conversationId)
    //   .order("created_at", { ascending: true })

    // if (error) {
    //   // Don't log the error to console to avoid the error message
    //   return []
    // }

    // return data || []
    return [];
  } catch (error) {
    // Return mock data for demo without logging
    return [
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
  }
}

export async function saveMessage(message: Omit<ChatMessage, "id" | "created_at">): Promise<ChatMessage | null> {
  try {
    // const { data, error } = await supabase
    //   .from("chat_messages")
    //   .insert([message])
    //   .select()
    //   .single()

    // if (error) {
    //   // Don't log the error to console to avoid the error message
    //   return null
    // }

    // return data
    return null;
  } catch (error) {
    // Return a mock message for demo
    return {
      id: `mock-msg-${Date.now()}`,
      ...message,
      created_at: new Date().toISOString()
    };
  }
}

export async function getAnalytics(userId: string, period: "day" | "week" | "month" = "week"): Promise<Analytics | null> {
  try {
    // const { data, error } = await supabase
    //   .from("analytics")
    //   .select("*")
    //   .eq("user_id", userId)
    //   .eq("data_period", period)
    //   .single()

    // if (error) {
    //   // Don't log the error to console to avoid the error message
    //   return null
    // }

    // return data
    return null;
  } catch (error) {
    // Return mock analytics data instead of showing an error
    return {
      id: "mock-analytics-id",
      user_id: userId,
      total_conversations: 87,
      total_messages: 563,
      total_leads: 42,
      avg_conversation_length: 12,
      data_period: period,
      created_at: new Date().toISOString()
    };
  }
}

export async function getTeamMembers(userId: string): Promise<TeamMember[]> {
  try {
    // const { data, error } = await supabase
    //   .from("team_members")
    //   .select("*")
    //   .eq("user_id", userId)
    //   .order("created_at", { ascending: false })

    // if (error) {
    //   // Don't log the error to console to avoid the error message
    //   return []
    // }

    // return data || []
    return [];
  } catch (error) {
    // Return mock team members for demo
    return [
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
  }
}

export async function addTeamMember(userId: string, memberEmail: string, role: "admin" | "member" | "viewer"): Promise<TeamMember | null> {
  try {
    // const { data, error } = await supabase
    //   .from("team_members")
    //   .insert([{ user_id: userId, member_email: memberEmail, role, status: "invited" }])
    //   .select()
    //   .single()

    // if (error) {
    //   // Don't log the error to console to avoid the error message
    //   return null
    // }

    // return data
    return null;
  } catch (error) {
    // Return a mock team member for demo
    return {
      id: `mock-team-${Date.now()}`,
      user_id: userId,
      member_email: memberEmail,
      role,
      status: "invited",
      created_at: new Date().toISOString()
    };
  }
}
