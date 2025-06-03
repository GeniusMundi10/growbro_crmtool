import Header from "@/components/header"
import UsageInfo from "./usage-info"

export default function UsagePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header title="Plan & Billing" />
      <div className="container mx-auto px-4 py-6">
        <UsageInfo />
      </div>
    </div>
  )
}
