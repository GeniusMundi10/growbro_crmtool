import Header from "@/components/header"
import AccountSettings from "./account-settings"

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header title="Account Settings" />
      <div className="container mx-auto px-4 py-6">
        <AccountSettings />
      </div>
    </div>
  )
}
