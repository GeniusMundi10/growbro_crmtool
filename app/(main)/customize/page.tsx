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
      <div className="container mx-auto px-6 py-8">
        <ChatWidgetSettings />
      </div>
    </div>
  )
}
