import Header from "@/components/header"
import AccountSettings from "./account-settings"

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header 
        title="My Profile" 
        description="Manage your personal details, company information, and contact settings."
        showTitleInHeader={false}
      />
      <div className="container mx-auto px-4 py-8">
        <AccountSettings />
      </div>
    </div>
  )
}
