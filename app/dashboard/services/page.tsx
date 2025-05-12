import Header from "@/components/header"
import DashboardTabs from "@/components/dashboard-tabs"
import ServicesForm from "./services-form"

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header title="Dashboard" />
      <div className="container mx-auto px-4 py-6">
        <DashboardTabs activeTab="services" />
        <div className="mt-8">
          <ServicesForm />
        </div>
      </div>
    </div>
  )
}
