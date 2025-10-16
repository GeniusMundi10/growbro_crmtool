"use client";
export const dynamic = "force-dynamic";

import Header from "@/components/header"
import ChatWidgetSettings from "./chat-widget-settings"

export default function CustomizePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header 
        title="Customize Chat Widget" 
        description="Personalize your chatbox appearance with colors, branding, and settings that match your business style"
        showTitleInHeader={false}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <ChatWidgetSettings />
      </div>
    </div>
  )
}
