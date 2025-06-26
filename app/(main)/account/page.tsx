import Header from "@/components/header"
import Link from "next/link";
import AccountSettings from "./account-settings"

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header title="My Profile" />
      <div className="container mx-auto px-4 py-6">
        <AccountSettings />
      </div>
    </div>
  )
}
