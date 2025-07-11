"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Notification {
  id: string;
  content: string;
  unread: boolean;
  time: string;
  icon?: React.ReactNode;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notif: Omit<Notification, "id" | "unread" | "time">) => void;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notif: Omit<Notification, "id" | "unread" | "time">) => {
    setNotifications(prev => [
      {
        ...notif,
        id: `${Date.now()}-${Math.random()}`,
        unread: true,
        time: new Date().toLocaleString(),
      },
      ...prev,
    ]);
  };

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, unread: false })));

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
