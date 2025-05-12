import Header from "@/components/header"
import BillingInfo from "./billing-info"

export default function BillingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header title="Plan & Billing" />
      <div className="container mx-auto px-4 py-6">
        <BillingInfo />
      </div>
    </div>
  )
}
