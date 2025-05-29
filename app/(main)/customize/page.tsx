"use client";
export const dynamic = "force-dynamic";

import Header from "@/components/header"
import ChatWidgetSettings from "./chat-widget-settings"

export default function CustomizePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header title="Customize" />
      <div className="container mx-auto px-4 py-6">
        <ChatWidgetSettings />
      </div>
    </div>
  )
}
