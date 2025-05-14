"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchUsersDirectly } from "@/lib/supabase";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  plan?: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
}

const UserContext = createContext<UserContextType>({ user: null, loading: true });

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      const users = await fetchUsersDirectly();
      if (users && users.length > 0) setUser(users[0]);
      setLoading(false);
    }
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
} 