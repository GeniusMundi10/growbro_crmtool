"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getCurrentUser, onAuthStateChange, UserProfile } from "@/lib/auth";

interface UserContextType {
  user: UserProfile | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {}
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Error fetching current user:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch user on initial load
    fetchUser();

    // Set up listener for auth state changes
    const { data: { subscription } } = onAuthStateChange(async (session) => {
      if (session) {
        // User is authenticated, refresh user data
        await fetchUser();
      } else {
        // User is not authenticated
        setUser(null);
      }
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <UserContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

export type { UserProfile };