import Header from "@/components/header"
import Link from "next/link";
import AccountSettings from "./account-settings"

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header title="Account Settings" />
      <div className="mb-4">
        <Link href="/account/settings" className="text-blue-600 hover:underline">
          Account Settings
        </Link>
      </div>
      <div className="container mx-auto px-4 py-6">
        <AccountSettings />
      </div>
    </div>
  )
}
