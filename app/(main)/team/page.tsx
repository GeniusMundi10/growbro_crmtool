import Header from "@/components/header"
import TeamManagement from "./team-management"

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header title="Manage Team" />
      <div className="container mx-auto px-4 py-6">
        <TeamManagement />
      </div>
    </div>
  )
}
