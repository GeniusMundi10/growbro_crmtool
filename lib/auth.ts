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
export async function getCurrentUser(): Promise<UserProfile & { plan?: string; trial_days?: number } | null> {
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

    // 3. Fetch trial info from user_trial_status view
    const { data: trial, error: trialError } = await supabase
      .from('user_trial_status')
      .select('plan, trial_days')
      .eq('user_id', authUser.id)
      .single();

    if (!profile || profileError) {
      // Only fallback if the row is missing or there is a query error
      console.warn('No matching row in public.users for user id:', authUser.id);
      return {
        id: authUser.id,
        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        avatar_url: authUser.user_metadata?.avatar_url,
        plan: trial?.plan || 'free',
        trial_days: trial?.trial_days,
        phone: '',
        company: '',
        website: '',
      };
    }

    return {
      ...profile,
      plan: trial?.plan || profile.plan || 'free',
      trial_days: trial?.trial_days,
    };

  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}


export { supabase };

