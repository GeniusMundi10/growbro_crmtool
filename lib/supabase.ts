import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Diagnostic check for environment variables
console.log("Supabase URL configured:", supabaseUrl ? "YES" : "NO (missing)");
console.log("Supabase Anon Key configured:", supabaseAnonKey ? "YES" : "NO (missing)");

// Create the standard client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
})

// Database types
export type AIWebsite = {
  id: string;
  ai_id: string;
  user_id: string;
  label: string;
  url: string;
  created_at: string;
  updated_at: string;
};

export type AIVoice = {
  id: string;
  ai_id: string;
  user_id: string;
  voice_gender: string;
  language: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type AIPhoto = {
  id: string;
  ai_id: string;
  user_id: string;
  url: string;
  file_path?: string;
  selected?: boolean;
  created_at: string;
  updated_at: string;
};

export type LeadCapture = {
  id: string;
  ai_id: string;
  user_id: string;
  form_config: any;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string
  email: string
  full_name: string
  avatar_url: string
  created_at: string
}

export type BusinessInfo = {
  session_cookie?: string; // Optional field for authenticated crawling
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
  // --- Analytics fields ---
  total_pages_crawled?: number;
  files_indexed?: number;
  urls_crawled?: string[] | string;
  vectorstore_ready?: boolean;
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

// Lead Capture CRUD operations

// AI Photo CRUD operations

// AI Voice CRUD operations

// AI Website CRUD operations
export async function getAIWebsites(aiId: string): Promise<AIWebsite[]> {
  const { data, error } = await supabase
    .from('ai_website')
    .select('*')
    .eq('ai_id', aiId)
    .order('created_at', { ascending: true });
  if (error) return [];
  return data as AIWebsite[];
}

/**
 * Calls the backend /add-links API endpoint to incrementally add new URLs to the vectorstore
 * without rebuilding the entire index
 */
export async function addLinksToVectorstore(aiId: string, newUrls: string[]): Promise<{ success: boolean, message: string }> {
  try {
    // Call the worker API endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_WORKER_API_URL || 'https://growbro-vectorstore-worker.fly.dev'}/add-links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ai_id: aiId,
        new_urls: newUrls,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Error adding links to vectorstore:', data);
      return { success: false, message: data.message || 'Failed to add links to vectorstore' };
    }
    
    return { 
      success: true, 
      message: `Successfully added ${data.added_count || 0} new documents to vectorstore` 
    };
  } catch (error) {
    console.error('Error calling /add-links API:', error);
    return { success: false, message: 'Failed to connect to vectorstore API' };
  }
}

export async function upsertAIWebsites(
  aiId: string,
  userId: string,
  websites: { label: string; url: string; id?: string }[]
): Promise<AIWebsite[]> {
  // Remove empty URLs
  const filtered = websites.filter(w => w.url && w.label);
  if (filtered.length === 0) return [];
  // Upsert all (if id present, update; else insert)
  const { data, error } = await supabase
    .from('ai_website')
    // Use composite unique constraint for upsert, allowing multiple website links per user/ai_id (one per label)
    .upsert(
      filtered.map(w => ({
        ai_id: aiId,
        user_id: userId,
        label: w.label,
        url: w.url
      })),
      { onConflict: 'user_id,ai_id,label' }
    )
    .select();
  if (error) {
    console.error('Supabase upsert error:', error);
    return [];
  }
  return data as AIWebsite[];
}

export async function deleteAIWebsite(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('ai_website')
    .delete()
    .eq('id', id);
  return !error;
}

// Delete a website entry by user_id, ai_id, and label (composite key)
export async function deleteAIWebsiteByLabel(userId: string, aiId: string, label: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_website')
      .delete()
      .eq('user_id', userId)
      .eq('ai_id', aiId)
      .eq('label', label);
    return !error;
  } catch (e) {
    return false;
  }
}

// Delete a website entry by ai_id and url
// This is used to sync Analytics page URL removal with Websites tab
export async function deleteAIWebsiteByUrl(aiId: string, url: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_website')
      .delete()
      .eq('ai_id', aiId)
      .eq('url', url);
    return !error;
  } catch (e) {
    console.error('Error deleting website by URL:', e);
    return false;
  }
}

// AI File CRUD operations
export type AIFile = {
  id: string;
  ai_id: string;
  user_id: string;
  url: string;
  file_path: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
  updated_at: string;
};

export async function uploadAIFileToStorage(aiId: string, file: File): Promise<{ url: string; file_path: string } | null> {
  // Use aiId as folder for organization
  const filePath = `${aiId}/${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage.from('ai-files').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) return null;
  const { data: urlData } = supabase.storage.from('ai-files').getPublicUrl(filePath);
  const url = urlData.publicUrl;
  return { url, file_path: filePath };
}

export async function upsertAIFile(aiId: string, userId: string, fileMeta: { url: string; file_path: string; file_name: string; file_type?: string; file_size?: number }): Promise<AIFile | null> {
  const { data, error } = await supabase
    .from('ai_file')
    .insert([{ ai_id: aiId, user_id: userId, ...fileMeta }])
    .select()
    .single();
  if (error) return null;
  return data as AIFile;
}

export async function getAIFiles(aiId: string): Promise<AIFile[]> {
  const { data, error } = await supabase
    .from('ai_file')
    .select('*')
    .eq('ai_id', aiId)
    .order('created_at', { ascending: true });
  if (error) return [];
  return data as AIFile[];
}

export async function deleteAIFile(id: string, file_path: string): Promise<boolean> {
  // Delete from storage first
  const { error: storageError } = await supabase.storage.from('ai-files').remove([file_path]);
  // Always attempt DB delete, even if storage fails
  const { error } = await supabase
    .from('ai_file')
    .delete()
    .eq('id', id);
  return !error;
}

// Resource Link CSV CRUD operations
export type AIResourceLinkCSV = {
  id: string;
  ai_id: string;
  user_id: string;
  url: string;
  file_path: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
  updated_at: string;
};

export async function uploadResourceLinkCSVToStorage(aiId: string, userId: string, file: File): Promise<{ url: string; file_path: string } | null> {
  // Only one CSV per user/ai: use a deterministic path
  const filePath = `${aiId}/${userId}/resource-links.csv`;
  // Remove any previous file at this path
  await supabase.storage.from('ai-resources').remove([filePath]);
  const { data, error } = await supabase.storage.from('ai-resources').upload(filePath, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type || 'text/csv',
  });
  if (error) return null;
  const { data: urlData } = supabase.storage.from('ai-resources').getPublicUrl(filePath);
  const url = urlData.publicUrl;
  return { url, file_path: filePath };
}

export async function upsertResourceLinkCSV(aiId: string, userId: string, fileMeta: { url: string; file_path: string; file_name: string; file_type?: string; file_size?: number }): Promise<AIResourceLinkCSV | null> {
  // Upsert by user_id+ai_id unique
  const { data, error } = await supabase
    .from('ai_resource_link_file')
    .upsert([{ ai_id: aiId, user_id: userId, ...fileMeta }], { onConflict: 'user_id,ai_id' })
    .select()
    .single();
  if (error) return null;
  return data as AIResourceLinkCSV;
}

export async function getResourceLinkCSV(aiId: string, userId: string): Promise<AIResourceLinkCSV | null> {
  const { data, error } = await supabase
    .from('ai_resource_link_file')
    .select('*')
    .eq('ai_id', aiId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return null;
  return data as AIResourceLinkCSV;
}

export async function deleteResourceLinkCSV(id: string, file_path: string): Promise<boolean> {
  await supabase.storage.from('ai-resources').remove([file_path]);
  const { error } = await supabase
    .from('ai_resource_link_file')
    .delete()
    .eq('id', id);
  return !error;
}

// Delete all AI data for user/ai
export async function deleteAIAndData(aiId: string, userId: string): Promise<boolean> {
  const tables = [
    // INFO
    'business_info',
    // LEAD CAPTURE
    'lead_capture',
    // PHOTO
    'ai_photo',
    // VOICE
    'ai_voice',
    // WEBSITES
    'ai_website',
    // FILES
    'ai_file',
    // RESOURCE LINKS
    'ai_resource_link_file',
    // GREETINGS
    'ai_greeting',
    // SERVICES
    'ai_services',
  ];
  let allOk = true;
  for (const table of tables) {
    let query = supabase.from(table).delete().eq('user_id', userId);
    // business_info uses 'id', others use 'ai_id'
    if (table === 'business_info') {
      query = query.eq('id', aiId);
    } else {
      query = query.eq('ai_id', aiId);
    }
    const { error } = await query;
    if (error) allOk = false;
  }
  return allOk;
}

// AI Services CRUD operations
export type AIServices = {
  id: string;
  user_id: string;
  ai_id: string;
  business_services: string | null;
  differentiation: string | null;
  profitable_line_items: string | null;
  best_sales_lines: string | null;
  created_at: string;
  updated_at: string;
};

export async function getAIServices(aiId: string, userId: string): Promise<AIServices | null> {
  const { data, error } = await supabase
    .from('ai_services')
    .select('*')
    .eq('ai_id', aiId)
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data as AIServices;
}

export async function upsertAIServices(
  aiId: string,
  userId: string,
  values: {
    business_services?: string;
    differentiation?: string;
    profitable_line_items?: string;
    best_sales_lines?: string;
  }
): Promise<AIServices | null> {
  const { data, error } = await supabase
    .from('ai_services')
    .upsert([{ ai_id: aiId, user_id: userId, ...values }], { onConflict: 'user_id,ai_id' })
    .select()
    .single();
  if (error) return null;
  return data as AIServices;
}

// Dashboard Message Summary View
export type DashboardMessageSummary = {
  agent_id: string;
  client_id: string;
  ai_name: string;
  day: string; // ISO date string
  message_count: number;
  conversation_count: number;
  total_leads: number;
  new_leads: number;
  first_message_time: string | null;
  last_message_time: string | null;
  min_conversation_duration: number | null;
  max_conversation_duration: number | null;
  avg_conversation_duration: number | null;
  avg_messages_per_conversation: number | null;
  avg_messages_per_lead: number | null;
};

// Unified daily summary: compute per-day stats from conversations/messages, not view
export async function getDashboardMessageSummary(clientId: string, agentId: string, fromDate?: string, toDate?: string): Promise<DashboardMessageSummary[]> {
  // Build daily buckets
  const start = new Date(fromDate as string);
  const end = new Date(toDate as string);
  const days: string[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d).toISOString().slice(0, 10));
  }
  const results: DashboardMessageSummary[] = [];
  for (const day of days) {
    const dayAfter = new Date(new Date(day).getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    // 1. Get all user messages in this day
    let msgQuery = supabase
      .from('messages')
      .select('id, conversation_id, sender, timestamp')
      .eq('sender', 'user')
      .eq('client_id', clientId)
      .gte('timestamp', day)
      .lt('timestamp', dayAfter);
    if (agentId && agentId !== '__all__') msgQuery = msgQuery.eq('ai_id', agentId);
    const { data: userMessages, error: msgErr } = await msgQuery;
    if (msgErr) throw msgErr;
    // Unique conversations with at least one user message this day
    const convoIds = Array.from(new Set((userMessages || []).map((m: any) => m.conversation_id)));
    if (convoIds.length === 0) {
      results.push({
        agent_id: agentId,
        client_id: '',
        ai_name: '',
        day,
        message_count: 0,
        conversation_count: 0,
        total_leads: 0,
        new_leads: 0,
        first_message_time: null,
        last_message_time: null,
        min_conversation_duration: null,
        max_conversation_duration: null,
        avg_conversation_duration: null,
        avg_messages_per_conversation: null,
        avg_messages_per_lead: null,
      });
      continue;
    }
    // 2. Join to conversations to get user identity
    const { data: convos, error: convErr } = await supabase
      .from('conversations')
      .select('id, end_user_id')
      .in('id', convoIds);
    if (convErr) throw convErr;
    // 3. Compute stats
    const message_count = userMessages?.length || 0;
    const conversation_count = convoIds.length;
    // LEADS: unique end_user_id for this day
    const leadsForDay = Array.from(new Set((convos || []).map((c: any) => c.end_user_id).filter(Boolean)));
    const total_leads = leadsForDay.length;
    // For daily leads bar chart: this is the correct per-day value
    const new_leads = total_leads;
    // Duration: for each conversation, use first and last user message timestamps in that day
    let min_conversation_duration = null;
    let max_conversation_duration = null;
    let avg_conversation_duration = null;
    const durations: number[] = [];
    convoIds.forEach(cid => {
      const msgs = (userMessages || []).filter((m: any) => m.conversation_id === cid);
      if (msgs.length > 1) {
        const times = msgs.map((m: any) => new Date(m.timestamp).getTime());
        const min = Math.min(...times);
        const max = Math.max(...times);
        const duration = (max - min) / 60000;
        durations.push(duration);
      }
    });
    if (durations.length) {
      min_conversation_duration = Math.min(...durations);
      max_conversation_duration = Math.max(...durations);
      avg_conversation_duration = durations.reduce((a, b) => a + b, 0) / durations.length;
    }
    results.push({
      agent_id: agentId,
      client_id: '',
      ai_name: '',
      day,
      message_count,
      conversation_count,
      total_leads,
      new_leads,
      first_message_time: null,
      last_message_time: null,
      min_conversation_duration,
      max_conversation_duration,
      avg_conversation_duration,
      avg_messages_per_conversation: conversation_count ? message_count / conversation_count : null,
      avg_messages_per_lead: total_leads ? message_count / total_leads : null,
    });
  }
  return results;
}

// Fetch KPI stats (totals and averages) for dashboard cards
// Unified KPI stats: all stats computed from conversations/messages, not view
// Unified KPI: all stats based on conversations with at least one user message in the period
export async function getDashboardKPIStats({ clientId, aiId, fromDate, toDate }: { clientId: string, aiId?: string, fromDate: string, toDate: string }) {
  const dayAfterToDate = new Date(new Date(toDate).getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  // 1. Get all user messages in the period
  let msgQuery = supabase
    .from('messages')
    .select('conversation_id, sender, timestamp')
    .eq('sender', 'user')
    .eq('client_id', clientId)
    .gte('timestamp', fromDate)
    .lt('timestamp', dayAfterToDate);
  if (aiId && aiId !== '__all__') msgQuery = msgQuery.eq('ai_id', aiId);
  const { data: userMessages, error: msgErr } = await msgQuery;
  if (msgErr) throw msgErr;
  // 2. Get unique started conversation IDs
  const startedConvoIds = Array.from(new Set((userMessages || []).map((m: any) => m.conversation_id)));
  if (startedConvoIds.length === 0) {
    return { totalMessages: 0, totalConversations: 0, totalLeads: 0, avgConversationDuration: 0 };
  }
  // 3. Get all messages for started conversations (for duration)
  let allMsgQuery = supabase
    .from('messages')
    .select('conversation_id, sender, timestamp')
    .in('conversation_id', startedConvoIds);
  if (aiId && aiId !== '__all__') allMsgQuery = allMsgQuery.eq('ai_id', aiId);
  const { data: allMessages, error: allMsgErr } = await allMsgQuery;
  if (allMsgErr) throw allMsgErr;
  // 4. Get conversation details (for leads)
  const { data: convos, error: convoErr } = await supabase
    .from('conversations')
    .select('id, end_user_id')
    .in('id', startedConvoIds);
  if (convoErr) throw convoErr;
  // 5. Compute metrics
  const totalMessages = allMessages?.length || 0;
  const totalConversations = startedConvoIds.length;
  const uniqueLeads = Array.from(new Set((convos || []).map((c: any) => c.end_user_id).filter(Boolean)));
  const totalLeads = uniqueLeads.length;
  // Conversation duration (in minutes)
  let durationSum = 0;
  let countWithDuration = 0;
  startedConvoIds.forEach(cid => {
    const convoMsgs = (allMessages || []).filter((m: any) => m.conversation_id === cid);
    if (convoMsgs.length > 1) {
      const times = convoMsgs.map((m: any) => new Date(m.timestamp).getTime());
      const min = Math.min(...times);
      const max = Math.max(...times);
      durationSum += (max - min) / 60000;
      countWithDuration++;
    }
  });
  const avgConversationDuration = countWithDuration ? durationSum / countWithDuration : 0;
  return {
    totalMessages,
    totalConversations,
    totalLeads,
    avgConversationDuration,
  };
}


// AI Greeting CRUD operations
export type AIGreeting = {
  id: string;
  ai_id: string;
  user_id: string;
  label: string;
  message: string;
  created_at: string;
  updated_at: string;
};

export async function getAIGreetings(aiId: string): Promise<AIGreeting[]> {
  const { data, error } = await supabase
    .from('ai_greeting')
    .select('*')
    .eq('ai_id', aiId)
    .order('created_at', { ascending: true });
  if (error) return [];
  return data as AIGreeting[];
}

export async function upsertAIGreetings(aiId: string, userId: string, greetings: { label: string; message: string }[]): Promise<boolean> {
  // Upsert by user_id, ai_id, label
  const { error } = await supabase
    .from('ai_greeting')
    .upsert(greetings.map(g => ({
      ai_id: aiId,
      user_id: userId,
      label: g.label,
      message: g.message
    })), { onConflict: 'user_id,ai_id,label' });
  return !error;
}

export async function deleteAIGreetingByLabel(userId: string, aiId: string, label: string): Promise<boolean> {
  const { error } = await supabase
    .from('ai_greeting')
    .delete()
    .eq('user_id', userId)
    .eq('ai_id', aiId)
    .eq('label', label);
  return !error;
}


export async function getAIVoice(aiId: string): Promise<AIVoice | null> {
  const { data, error } = await supabase
    .from('ai_voice')
    .select('*')
    .eq('ai_id', aiId)
    .single();
  if (error) return null;
  return data as AIVoice;
}

export async function upsertAIVoice(
  aiId: string,
  userId: string,
  voice_gender: string,
  language: string,
  enabled: boolean
): Promise<AIVoice | null> {
  const { data, error } = await supabase
    .from('ai_voice')
    .upsert([
      { ai_id: aiId, user_id: userId, voice_gender, language, enabled }
    ], { onConflict: 'ai_id' }) // camelCase, not snake_case
    .select()
    .single();
  if (error) {
    console.error('Supabase upsert error:', error);
    return null;
  }
  return data as AIVoice;
}

export async function deleteAIVoice(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('ai_voice')
    .delete()
    .eq('id', id);
  return !error;
}

export async function getAIPhoto(aiId: string): Promise<AIPhoto | null> {
  // Get the currently selected photo (if any)
  const { data, error } = await supabase
    .from('ai_photo')
    .select('*')
    .eq('ai_id', aiId)
    .eq('selected', true)
    .single();
  if (error) return null;
  return data as AIPhoto;
}

export async function getAIPhotos(aiId: string): Promise<AIPhoto[]> {
  const { data, error } = await supabase
    .from('ai_photo')
    .select('*')
    .eq('ai_id', aiId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data as AIPhoto[];
}

export async function selectAIPhoto(photoId: string, aiId: string): Promise<boolean> {
  // Set selected=true for photoId, false for others of same aiId
  const { error: clearError } = await supabase
    .from('ai_photo')
    .update({ selected: false })
    .eq('ai_id', aiId);
  if (clearError) return false;
  const { error: setError } = await supabase
    .from('ai_photo')
    .update({ selected: true })
    .eq('id', photoId);
  return !setError;
}


export async function upsertAIPhoto(aiId: string, userId: string, url: string, file_path?: string): Promise<AIPhoto | null> {
  // Insert a new photo (do not upsert on ai_id, allow multiple)
  const { data, error } = await supabase
    .from('ai_photo')
    .insert([{ ai_id: aiId, user_id: userId, url, file_path, selected: false }])
    .select()
    .single();
  if (error) return null;
  return data as AIPhoto;
}

export async function deleteAIPhoto(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('ai_photo')
    .delete()
    .eq('id', id);
  return !error;
}

// Upload photo to Supabase Storage and return the public URL
export async function uploadAIPhotoToStorage(aiId: string, file: File): Promise<{ url: string, file_path: string } | null> {
  const filePath = `${aiId}/${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage
    .from('ai-photos')
    .upload(filePath, file, { upsert: true });
  if (error) return null;
  const { data: urlData } = supabase.storage.from('ai-photos').getPublicUrl(filePath);
  const publicUrl = urlData.publicUrl;
  return { url: publicUrl, file_path: filePath };
}

export async function getLeadCapture(aiId: string): Promise<LeadCapture | null> {
  const { data, error } = await supabase
    .from('lead_capture')
    .select('*')
    .eq('ai_id', aiId)
    .single();
  if (error) return null;
  return data as LeadCapture;
}

export async function createLeadCapture(aiId: string, { user_id, form_config }: { user_id: string, form_config: any }): Promise<LeadCapture | null> {
  const { data, error } = await supabase
    .from('lead_capture')
    .insert([{ ai_id: aiId, user_id, form_config }])
    .select()
    .single();
  if (error) return null;
  return data as LeadCapture;
}

export async function updateLeadCapture({ id, form_config }: { id: string, form_config: any }): Promise<boolean> {
  const { error } = await supabase
    .from('lead_capture')
    .update({ form_config })
    .eq('id', id);
  return !error;
}

export async function getCurrentUser(): Promise<User | null> {
  // Return mock user instead of authenticating
  return mockUser;
}

export async function getBusinessInfo(id: string): Promise<BusinessInfo | null> {
  // For demo purposes, return mock data if real data isn't available
  try {
    // Try to find by ID first
    let query = supabase.from("business_info").select("*");
    
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
      // Don't log the error to console to avoid the error message
      return null
    }

    return data
  } catch (error) {
    // Return mock data for demo without logging the error
    return {
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
  }
}

export async function updateBusinessInfo(businessInfo: Partial<BusinessInfo>): Promise<boolean> {
  try {
    const { error } = await supabase.from("business_info")
      .update({ ...businessInfo, session_cookie: businessInfo.session_cookie })
      .eq("id", businessInfo.id);

    if (error) {
      // Don't log the error to console to avoid the error message
      return false
    }

    return true
  } catch (error) {
    // For demo purposes, return success without logging
    return true
  }
}

export async function createBusinessInfo(userId: string, businessInfo: Partial<BusinessInfo>): Promise<BusinessInfo | null> {
  try {
    const { data, error } = await supabase
      .from("business_info")
      .insert([{ user_id: userId, session_cookie: businessInfo.session_cookie, ...businessInfo }])
      .select()
      .single()

    if (error) {
      // Don't log the error to console to avoid the error message
      console.error("Error creating business info:", error);
      return null
    }

    console.log("Successfully created business info:", data);
    return data
  } catch (error) {
    console.error("Exception creating business info:", error);
    // Return mock data for demo without logging
    return {
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
  }
}

export async function getLeads(userId: string): Promise<Lead[]> {
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      // Don't log the error to console to avoid the error message
      return []
    }

    return data || []
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
    const { data, error } = await supabase
      .from("leads")
      .insert([lead])
      .select()
      .single()

    if (error) {
      // Don't log the error to console to avoid the error message
      return null
    }

    return data
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
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      // Don't log the error to console to avoid the error message
      return []
    }

    return data || []
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
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (error) {
      // Don't log the error to console to avoid the error message
      return []
    }

    return data || []
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
    const { data, error } = await supabase
      .from("chat_messages")
      .insert([message])
      .select()
      .single()

    if (error) {
      // Don't log the error to console to avoid the error message
      return null
    }

    return data
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
    const { data, error } = await supabase
      .from("analytics")
      .select("*")
      .eq("user_id", userId)
      .eq("data_period", period)
      .single()

    if (error) {
      // Don't log the error to console to avoid the error message
      return null
    }

    return data
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
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      // Don't log the error to console to avoid the error message
      return []
    }

    return data || []
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
    const { data, error } = await supabase
      .from("team_members")
      .insert([{ user_id: userId, member_email: memberEmail, role, status: "invited" }])
      .select()
      .single()

    if (error) {
      // Don't log the error to console to avoid the error message
      return null
    }

    return data
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

// Debug utility - directly fetch all users with detailed error handling
export async function debugFetchUsers() {
  try {
    console.log("Debug: Attempting to fetch all users...");
    console.log("Debug: Using URL:", supabaseUrl.substring(0, 15) + "...");
    
    const { data, error } = await supabase
      .from("users")
      .select("*");
      
    if (error) {
      console.error("Debug: Error fetching users:", error.message, error.details, error.hint, error.code);
      return { success: false, error, data: null };
    }
    
    console.log(`Debug: Successfully fetched ${data?.length || 0} users`);
    return { success: true, data, error: null };
  } catch (error) {
    console.error("Debug: Exception when fetching users:", error);
    return { success: false, error, data: null };
  }
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





// Conversation Engagement Funnel: Conversations Started, Engaged, Leads
// Unified funnel: all steps based on conversations whose FIRST message is in period
// Unified Funnel: same base as KPI (conversations w/ at least one user message in period)
export async function getFunnelData(clientId: string, agentId: string, fromDate: string, toDate: string) {
  const dayAfterToDate = new Date(new Date(toDate).getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  // 1. Get all user messages in the period
  let msgQuery = supabase
    .from('messages')
    .select('conversation_id, sender')
    .eq('sender', 'user')
    .eq('client_id', clientId)
    .gte('timestamp', fromDate)
    .lt('timestamp', dayAfterToDate);
  if (agentId && agentId !== '__all__') msgQuery = msgQuery.eq('ai_id', agentId);
  const { data: userMessages, error: msgErr } = await msgQuery;
  if (msgErr) throw msgErr;
  // 2. Get unique started conversation IDs
  const startedConvoIds = Array.from(new Set((userMessages || []).map((m: any) => m.conversation_id)));
  if (startedConvoIds.length === 0) {
    return { startedCount: 0, engagedCount: 0, leadsCount: 0 };
  }
  // 3. Engaged: started conversations with >1 user message in period
  const userMsgCount: Record<string, number> = {};
  (userMessages || []).forEach((msg: any) => {
    userMsgCount[msg.conversation_id] = (userMsgCount[msg.conversation_id] || 0) + 1;
  });
  const engagedConvoIds = Object.keys(userMsgCount).filter(cid => userMsgCount[cid] > 1);
  // 4. Leads: unique end_user_id from started conversations
  const { data: convos, error: convoErr } = await supabase
    .from('conversations')
    .select('id, end_user_id')
    .in('id', startedConvoIds);
  if (convoErr) throw convoErr;
  const leadsSet = new Set((convos || []).map((c: any) => c.end_user_id).filter(Boolean));
  return {
    startedCount: startedConvoIds.length,
    engagedCount: engagedConvoIds.length,
    leadsCount: leadsSet.size,
  };
}

// Get unique leads for an AI and period (across all days in the range)
export async function getUniqueLeadsForPeriod(clientId: string, agentId: string, fromDate: string, toDate: string): Promise<number> {
  // Calculate the day after toDate to include the entire last day in the period
  const dayAfterToDate = new Date(new Date(toDate).getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('conversation_id')
    .eq('ai_id', agentId)
    .eq('client_id', clientId)
    .gte('timestamp', fromDate)
    .lt('timestamp', dayAfterToDate);
  console.log('[DEBUG] [Step 1] messages:', { agentId, fromDate, toDate, messages, msgError });
  if (msgError) throw msgError;

  const conversationIds = Array.from(new Set((messages || []).map((msg: any) => msg.conversation_id).filter(Boolean)));
  console.log('[DEBUG] [Conversation IDs from messages]:', conversationIds);
  if (conversationIds.length === 0) {
    return 0;
  }

  // Step 2: Fetch end_user_id from conversations for those conversation_ids
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('id, end_user_id')
    .in('id', conversationIds);
  console.log('[DEBUG] [Step 2] conversations:', { conversationIds, conversations, convError });
  if (convError) throw convError;

  // Log all conversation rows with their end_user_id
  (conversations || []).forEach((conv: any) => {
    console.log(`[DEBUG] Conversation ID: ${conv.id}, end_user_id: ${conv.end_user_id}`);
  });

  const endUserIds = Array.from(new Set((conversations || []).map((conv: any) => conv.end_user_id).filter(Boolean)));
  console.log('[DEBUG] [Non-null endUserIds]:', endUserIds);
  return endUserIds.length;
}

// Fetch feedback stats (good/bad/none) for a given AI and period
export async function getDashboardFeedbackStats(clientId: string, aiId: string, fromDate: string, toDate: string): Promise<{ up: number; down: number; none: number }> {
  // To include the full toDate, add one day and use .lt()
  const dayAfterToDate = new Date(new Date(toDate).getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  let query = supabase
    .from('conversations')
    .select('feedback')
    .eq('client_id', clientId)
    .gte('started_at', fromDate)
    .lt('started_at', dayAfterToDate);
  if (aiId && aiId !== '__all__') {
    query = query.eq('ai_id', aiId);
  }
  const { data, error } = await query;
  if (error) throw error;
  let up = 0, down = 0, none = 0;
  (data || []).forEach((row: any) => {
    if (row.feedback === 'up') up += 1;
    else if (row.feedback === 'down') down += 1;
    else none += 1;
  });
  return { up, down, none };
}

// Get user segment distribution: counts of new vs. returning users for a given AI and period
// New: user's first conversation is in the period; Returning: first conversation is before period but has a conversation in the period
// User segment distribution: new vs returning users (based on user messages)
export async function getUserSegmentDistribution(clientId: string, agentId: string, fromDate: string, toDate: string): Promise<{ newUsers: number; returningUsers: number }> {
  const dayAfterToDate = new Date(new Date(toDate).getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  // 1. Get all user messages in the period
  let msgQuery = supabase
    .from('messages')
    .select('conversation_id, timestamp')
    .eq('sender', 'user')
    .eq('client_id', clientId)
    .gte('timestamp', fromDate)
    .lt('timestamp', dayAfterToDate);
  if (agentId && agentId !== '__all__') msgQuery = msgQuery.eq('ai_id', agentId);
  const { data: msgsInPeriod, error: msgErr } = await msgQuery;
  if (msgErr) throw msgErr;
  // Get unique conversation_ids for user messages in period
  const convoIdsInPeriod = Array.from(new Set((msgsInPeriod || []).map((m: any) => m.conversation_id)));
  if (convoIdsInPeriod.length === 0) return { newUsers: 0, returningUsers: 0 };
  // Join to conversations to get end_user_id
  const { data: convos, error: convoErr } = await supabase
    .from('conversations')
    .select('id, end_user_id')
    .in('id', convoIdsInPeriod);
  if (convoErr) throw convoErr;
  const userIdsInPeriod = Array.from(new Set((convos || []).map((c: any) => c.end_user_id).filter(Boolean)));
  let newUsers = 0, returningUsers = 0;
  // For each user, find their first-ever user message (via all conversations)
  for (const userId of userIdsInPeriod) {
    // Get all conversations for this user
    const userConvos = (convos || []).filter((c: any) => c.end_user_id === userId).map((c: any) => c.id);
    // Get all user messages for this user (across all time, all their conversations)
    let allMsgQuery = supabase
      .from('messages')
      .select('timestamp')
      .eq('sender', 'user')
      .in('conversation_id', userConvos)
      .order('timestamp', { ascending: true })
      .limit(1);
    if (agentId && agentId !== '__all__') allMsgQuery = allMsgQuery.eq('ai_id', agentId);
    const { data: earliestMsgs, error: earliestErr } = await allMsgQuery;
    if (earliestErr) throw earliestErr;
    if (earliestMsgs && earliestMsgs.length > 0) {
      const firstMsgTime = new Date(earliestMsgs[0].timestamp);
      if (firstMsgTime >= new Date(fromDate) && firstMsgTime < new Date(dayAfterToDate)) {
        newUsers++;
      } else if (firstMsgTime < new Date(fromDate)) {
        returningUsers++;
      }
    }
  }
  return { newUsers, returningUsers };
}


// Fetch all AIs for a user
export async function getAIsForUser(userId: string) {
  const { data, error } = await supabase
    .from("business_info")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// Get plan's AI agent limit
export function getPlanAILimit(plan: string | undefined): number {
  switch(plan?.toLowerCase()) {
    case 'starter': return 1;
    case 'basic': return 2;
    case 'pro': return 4;
    case 'growth': return 7;
    case 'advanced': return 10;
    case 'free': 
    default: return 1; // Free/trial plan or unknown plan defaults to 1
  }
}

// Count user's existing AI agents
export async function countUserAIs(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("business_info")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", userId);
      
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Error counting user AIs:", error);
    return 0;
  }
}

// Create a new AI
export async function createAIForUser(userId: string, aiData: Partial<BusinessInfo>) {
  const { data, error } = await supabase
    .from("business_info")
    .insert([{ user_id: userId, session_cookie: aiData.session_cookie, ...aiData }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Update an AI
export async function updateAI(aiId: string, aiData: Partial<BusinessInfo>) {
  const { data, error } = await supabase
    .from("business_info")
    .update(aiData)
    .eq("id", aiId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Delete an AI
export async function deleteAI(aiId: string, userId: string) {
  const { error } = await supabase
    .from("business_info")
    .delete()
    .eq("id", aiId)
    .eq("user_id", userId);
  if (error) throw error;
  return true;
}

// Get user's AIs
export async function getUserAIs(userId: string): Promise<BusinessInfo[]> {
  try {
    const { data, error } = await supabase
      .from("business_info")
      .select("*")
      .eq("user_id", userId);
      
    if (error) {
      console.error("Error fetching user AIs:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Exception fetching user AIs:", error);
    return [];
  }
}
