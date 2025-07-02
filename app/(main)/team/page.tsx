"use client"

import Header from "@/components/header"
import TeamManagement from "./team-management"
import UpgradePrompt from "@/components/UpgradePrompt"
import { useUser } from "@/context/UserContext"

export default function TeamPage() {
  const { user, loading } = useUser();
  const blockedPlans = ["starter", "basic", "free"];
  const plan = user?.plan?.toLowerCase();

  return (
    <div className="min-h-screen bg-white">
      <Header title="Manage Team" />
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center min-h-[300px] text-gray-400">Loading...</div>
        ) : blockedPlans.includes(plan || "") ? (
          <UpgradePrompt />
        ) : (
          <TeamManagement />
        )}
      </div>
    </div>
  );
}
