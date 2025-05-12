import Header from "@/components/header"
import DashboardTabs from "@/components/dashboard-tabs"
import VoiceSettingsForm from "./voice-settings-form"

export default function VoicePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header title="Dashboard" />
      <div className="container mx-auto px-4 py-6">
        <DashboardTabs activeTab="voice" />
        <div className="mt-8">
          <VoiceSettingsForm />
        </div>
      </div>
    </div>
  )
}
