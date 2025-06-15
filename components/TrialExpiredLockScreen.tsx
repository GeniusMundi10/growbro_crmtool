"use client";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import Link from "next/link";

export default function TrialExpiredLockScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-4">
      <div className="bg-gradient-to-br from-red-900/80 to-black/80 rounded-xl shadow-xl p-8 max-w-lg w-full border border-red-600">
        <CreditCard className="mx-auto mb-4 h-12 w-12 text-red-400 animate-pulse" />
        <h2 className="text-2xl font-bold mb-2 text-red-200">Your Free Trial Has Expired</h2>
        <p className="mb-4 text-red-100">To continue using Growbro CRM, please upgrade to a paid plan.</p>
        <Link href="/billing">
          <Button className="bg-red-700 hover:bg-red-800 text-white w-full">Upgrade Now</Button>
        </Link>
        <p className="mt-4 text-xs text-red-300">If you believe this is a mistake, please contact support.</p>
      </div>
    </div>
  );
}
