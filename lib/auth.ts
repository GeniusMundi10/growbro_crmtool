import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { type Session, User as AuthUser } from '@supabase/supabase-js';

const supabase = createClientComponentClient();

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  plan?: string;
  phone?: string;
  company?: string;
  website?: string;
}

export async function getSession(): Promise<Session | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function refreshSession(): Promise<Session | null> {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Error refreshing session:', error);
    return null;
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

export function onAuthStateChange(callback: (session: Session | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}

/**
 * Fetches the current authenticated user details including profile data
 * This is the main function to use when you need the complete user profile
 */
export async function getCurrentUser(): Promise<UserProfile & { trial_days?: number } | null> {
  try {
    // 1. Get the authentication session
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!session?.user) return null;

    const authUser = session.user;

    // 2. Fetch the user profile from public.users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError) throw profileError;
    if (!profile) return null;

    // 3. Fetch trial info from user_trial_status view
    const { data: trial, error: trialError } = await supabase
      .from('user_trial_status')
      .select('plan, trial_days')
      .eq('user_id', authUser.id)
      .single();

    // 4. Merge and return
    // 3. Always use public.users fields for display
    return {
      id: profile.id,
      name: profile.name || profile.full_name || '',
      email: profile.email || '',
      avatar_url: profile.avatar_url || '',
      plan: profile.plan || 'free',
      phone: profile.phone || '',
      company: profile.company || '',
      website: profile.website || '',
    };
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}


export { supabase };

