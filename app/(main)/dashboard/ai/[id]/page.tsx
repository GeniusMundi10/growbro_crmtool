"use client"

import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import BusinessInfoForm from "@/app/dashboard/info/business-info-form"
import { getBusinessInfo } from "@/lib/supabase"
import { toast } from "sonner"

const DEMO_USER_ID = "demo-user-123"

export default function AIPage() {
  const router = useRouter()
  const params = useParams()
  const aiId = params.id as string
  const [businessInfo, setBusinessInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<"edit" | "create">("edit")

  useEffect(() => {
    if (aiId === "new") {
      setMode("create")
      setBusinessInfo({})
      setLoading(false)
    } else {
      setMode("edit")
      setLoading(true)
      getBusinessInfoById(aiId)
    }
  }, [aiId])

  async function getBusinessInfoById(id: string) {
    try {
      const data = await getBusinessInfo(id)
      setBusinessInfo(data)
    } catch (e) {
      toast.error("Failed to load AI details")
      setBusinessInfo(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="max-w-3xl mx-auto py-8">
      <BusinessInfoForm 
        aiId={aiId !== "new" ? aiId : undefined}
        initialData={businessInfo}
        mode={mode}
        userId={DEMO_USER_ID}
        onSaved={() => router.push("/dashboard")}
      />
    </div>
  )
} 