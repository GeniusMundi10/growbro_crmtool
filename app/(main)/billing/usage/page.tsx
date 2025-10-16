import Header from "@/components/header"
import UsageInfo from "./usage-info"

export default function UsagePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header 
        title="Plan & Billing" 
        description="Break down your usage month-by-month or view all-time totals across agents."
        showTitleInHeader={false}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <UsageInfo />
      </div>
    </div>
  )
}
