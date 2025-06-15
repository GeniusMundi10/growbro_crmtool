"use client";

import Sidebar from "@/components/sidebar";
import { Toaster } from "sonner";
import { UserProvider, useUser } from "@/context/UserContext";
import { usePathname, useRouter } from "next/navigation";
import TrialExpiredLockScreen from "@/components/TrialExpiredLockScreen";
import { useEffect } from "react";
import type React from "react";

function MainLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading, isTrialExpired } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const locked = isTrialExpired(user);

  useEffect(() => {
    if (!loading && locked && pathname !== "/billing") {
      router.replace("/billing");
    }
  }, [loading, locked, pathname, router]);

  // Only show lock screen on /billing if locked
  const showLockScreen = !loading && locked && pathname === "/billing";

  return (
    <div className="flex min-h-screen">
      <Sidebar locked={locked} />
      <main className="flex-1 overflow-auto ml-[70px] md:ml-[280px] transition-all duration-300 bg-gray-50 dark:bg-black/40">
        {showLockScreen ? <TrialExpiredLockScreen /> : children}
      </main>
      <Toaster position="top-right" richColors expand closeButton />
    </div>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <div className="min-h-screen bg-background font-sans antialiased">
        <MainLayoutInner>{children}</MainLayoutInner>
      </div>
    </UserProvider>
  );
}
