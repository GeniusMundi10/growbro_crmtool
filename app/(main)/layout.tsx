import Sidebar from "@/components/sidebar";
import { Toaster } from "sonner";
import { UserProvider } from "@/context/UserContext";
import type React from "react";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <div className="min-h-screen bg-background font-sans antialiased">
        <div className="flex h-screen overflow-hidden bg-gray-50">
          <Sidebar />
          <main className="flex-1 overflow-auto ml-[70px] md:ml-[280px] transition-all duration-300">
            {children}
          </main>
        </div>
        <Toaster position="top-right" richColors expand closeButton />
      </div>
    </UserProvider>
  );
}
