import Header from "@/components/header"
import DropdownMenuItem from "@/components/dropdown-menu-item";
import Link from "next/link";
import AccountSettings from "./account-settings"

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header title="Account Settings" />
      <DropdownMenuItem asChild>
        <Link href="/account/settings">Account Settings</Link>
      </DropdownMenuItem>
      <div className="container mx-auto px-4 py-6">
        <AccountSettings />
      </div>
    </div>
  )
}
