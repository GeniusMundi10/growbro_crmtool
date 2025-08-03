"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"

interface DashboardTabsProps {
  activeTab: string
}

const tabs = [
  { id: "info", label: "INFO" },
  { id: "lead-capture", label: "LEAD CAPTURE" },
  { id: "photo", label: "PHOTO" },
  { id: "voice", label: "VOICE" },
  { id: "websites", label: "WEBSITES" },
  { id: "files", label: "FILES" },
  { id: "resource-links", label: "RESOURCE LINKS" },
  { id: "greetings", label: "GREETINGS" },
  { id: "services", label: "SERVICES" },
  { id: "integrations", label: "INTEGRATIONS" },
]

export default function DashboardTabs({ activeTab }: DashboardTabsProps) {
  const searchParams = useSearchParams();
  const aiId = searchParams.get('aiId');
  return (
    <div className="relative mb-4">
      <div className="flex overflow-x-auto scrollbar-hide gap-1 rounded-lg border bg-white p-1 shadow-sm">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const href = aiId ? `/dashboard/${tab.id}?aiId=${aiId}` : `/dashboard/${tab.id}`;
          return (
            <Link
              key={tab.id}
              href={href}
              className={cn(
                "relative inline-flex min-w-max items-center whitespace-nowrap px-4 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                "rounded-md"
              )}
            >
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-500 rounded-md"
                  layoutId="active-tab"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className={cn(
                "relative z-10 transition-colors",
                isActive ? "text-white font-semibold" : "text-slate-600 hover:text-slate-900"
              )}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
      
      <div className="mt-1 flex items-center justify-between">
        <div className="text-xs text-slate-500 italic ml-2">
          Configure your AI assistant settings
        </div>
        <div className="text-xs text-slate-500 mr-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse mr-1"></span>
          All changes save automatically
        </div>
      </div>
    </div>
  )
}
