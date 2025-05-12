import Header from "@/components/header"
import DashboardTabs from "@/components/dashboard-tabs"
import LeadCaptureForm from "./lead-capture-form"

export default function LeadCapturePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header title="Dashboard" />
      <div className="container mx-auto px-4 py-6">
        <DashboardTabs activeTab="lead-capture" />
        <div className="mt-8">
          <LeadCaptureForm />
        </div>
      </div>
    </div>
  )
}
