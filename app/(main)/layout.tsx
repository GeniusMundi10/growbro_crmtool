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
    if (!loading && locked && pathname !== "/billing/pricing-plans") {
      router.replace("/billing/pricing-plans");
    }
  }, [loading, locked, pathname, router]);

  // Always render children on /billing/pricing-plans, even if locked
  return (
    <div className="flex min-h-screen">
      <Sidebar locked={locked} />
      <main className="flex-1 overflow-auto ml-[70px] md:ml-[280px] transition-all duration-300 bg-gray-50 dark:bg-black/40">
        {children}
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
