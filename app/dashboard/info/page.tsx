"use client"

import { motion } from "framer-motion"
import { useSearchParams } from "next/navigation"
import Header from "@/components/header"
import DashboardTabs from "@/components/dashboard-tabs"
import BusinessInfoForm from "./business-info-form"
import { useRouter } from "next/navigation"
import { useUser } from "@/context/UserContext"
import { useEffect, useState } from "react"
import { getBusinessInfo } from "@/lib/supabase"
import { toast } from "sonner"

// Add delay to ensure saves complete before redirect
const SAVE_DELAY_MS = 500

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
}

export default function BusinessInfoPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const searchParams = useSearchParams();
  const aiId = searchParams.get('aiId');
  const isNew = searchParams.get('new') === 'true';
  const [businessInfo, setBusinessInfo] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [mode, setMode] = useState<"edit" | "create">("create");

  useEffect(() => {
    // If new=true, we always want a fresh form
    if (isNew) {
      setBusinessInfo(null);
      setMode("create");
      return;
    }
    
    // Otherwise, proceed with normal aiId loading logic
    if (aiId && user) {
      setLoadingAI(true);
      setMode("edit");
      getBusinessInfoById(aiId);
    }
  }, [aiId, user, isNew]);

  async function getBusinessInfoById(id: string) {
    try {
      const data = await getBusinessInfo(id);
      setBusinessInfo(data);
    } catch (e) {
      toast.error("Failed to load AI details");
      setBusinessInfo(null);
    } finally {
      setLoadingAI(false);
    }
  }

  if (loading) return null;
  if (!user) return <div className="p-8 text-center">User not found</div>;

  // Handle successful save with delay to ensure DB operation completes
  const handleSaved = async () => {
    // Force a short delay to ensure Supabase operation completes
    await new Promise(resolve => setTimeout(resolve, SAVE_DELAY_MS));
    // Set session storage flag to trigger sidebar refresh when returning to dashboard
    sessionStorage.setItem('refreshAIList', 'true');
    
    // Stay on the same page instead of redirecting if we're editing an existing AI
    if (aiId && !isNew) {
      toast.success("Changes saved successfully");
      // No redirect - staying on the same page with aiId
      
      // Force sidebar refresh by dispatching a custom event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refreshAIList'));
      }
    } else {
      // Only redirect for new AI creation or when the new flag is present
      // Ensure we go back to dashboard without any query parameters
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header title="Dashboard" />
      <motion.div 
        className="container mx-auto px-4 py-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold mb-6 text-slate-800">Welcome to GrowBro.ai</h1>
          <p className="text-slate-600 mb-8">
            Configure your AI assistant to match your business needs. Start by filling out the business information below.
          </p>
          <DashboardTabs activeTab="info" />
        </motion.div>
        
        <motion.div 
          variants={itemVariants}
          className="mt-8"
        >
          {loadingAI ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <BusinessInfoForm 
              mode={mode}
              aiId={isNew ? undefined : aiId || undefined}
              initialData={isNew ? null : businessInfo}
              userId={user.id}
              onSaved={handleSaved}
            />
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
