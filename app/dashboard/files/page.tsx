import Header from "@/components/header"
import DashboardTabs from "@/components/dashboard-tabs"
import FilesUploadForm from "./files-upload-form"

export default function FilesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header title="Dashboard" />
      <div className="container mx-auto px-4 py-6">
        <DashboardTabs activeTab="files" />
        <div className="mt-8">
          <FilesUploadForm />
        </div>
      </div>
    </div>
  )
}
