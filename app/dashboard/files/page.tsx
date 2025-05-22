import Header from "@/components/header"
import DashboardTabs from "@/components/dashboard-tabs"
import FilesForm from "./files-form"

export default function FilesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header title="Dashboard" />
      <div className="container mx-auto px-4 py-6">
        <DashboardTabs activeTab="files" />
        <div className="mt-8">
          <FilesForm />
        </div>
      </div>
    </div>
  )
}
