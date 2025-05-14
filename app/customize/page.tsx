"use client"

import { Suspense } from "react"
import Header from "@/components/header"
import ChatWidgetSettings from "./chat-widget-settings"

function CustomizePageContent() {
  return (
    <div className="min-h-screen bg-white">
      <Header title="Customize" />
      <div className="container mx-auto px-4 py-6">
        <ChatWidgetSettings />
      </div>
    </div>
  )
}

export default function CustomizePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    }>
      <CustomizePageContent />
    </Suspense>
  )
}
