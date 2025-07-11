"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Settings,
  User,
  Calendar,
  CheckCircle,
  Clock,
  Menu,
  LogOut,
} from "lucide-react"
import { signOut } from "@/lib/auth"
import { useUser } from "@/context/UserContext"
import { useNotifications } from "@/context/NotificationContext"

interface HeaderProps {
  title: string
}

export default function Header({ title }: HeaderProps) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false)
  const { notifications, markAllRead } = useNotifications();

  const { user, loading: loadingUser } = useUser();
  
  const userFullName = "GrowBro User"
  const userInitials = "GB"
  
  const unreadCount = notifications.filter(n => n.unread).length
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])


  return (
    <motion.header
      className="sticky top-0 z-30 w-full border-b bg-white/95 backdrop-blur-sm shadow-sm"
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden mr-2 text-slate-600"
              onClick={() => {
                // This is just a placeholder for mobile menu toggle
                // The actual toggle is handled in the sidebar component
              }}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-xl font-bold text-slate-800 flex items-center">
            {title}
            {title === "Dashboard" && user && (
              <Badge 
                variant="outline" 
                className="ml-3 bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-normal"
              >
                {user.plan ? `${user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Plan` : "Plan"}
              </Badge>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <AnimatePresence>
              {searchOpen ? (
                <motion.div
                  initial={{ width: 40, opacity: 0 }}
                  animate={{ width: 250, opacity: 1 }}
                  exit={{ width: 40, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="relative"
                >
                  <input
                    type="text"
                    placeholder="Search..."
                    className="h-10 w-full rounded-full border border-gray-300 bg-gray-50 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    autoFocus
                    onBlur={() => setSearchOpen(false)}
                  />
                  <Search 
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" 
                  />
                </motion.div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-slate-500 hover:bg-slate-100"
                  onClick={() => setSearchOpen((open) => !open)}
                >
                  <Search className="h-5 w-5" />
                </Button>
              )}
            </AnimatePresence>
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative rounded-full p-2" aria-label="Open notifications">
                <Bell className="h-6 w-6 text-slate-500" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 mt-1 p-0 overflow-hidden border-none shadow-lg rounded-xl">
              <div className="bg-gradient-to-r from-emerald-700 to-green-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Notifications</h4>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-auto p-0 text-xs font-normal text-emerald-100 hover:text-white hover:bg-transparent"
                    onClick={() => setNotifications(prev => prev.map(n => ({ ...n, unread: false })))}
                  >
                    Mark all as read
                  </Button>
                </div>
                <p className="text-xs text-emerald-100 mt-1">Stay updated with your latest activities</p>
              </div>
              
              <div className="max-h-[350px] overflow-y-auto scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-500">
                    <div className="flex justify-center mb-3">
                      <Bell className="h-10 w-10 text-gray-300" />
                    </div>
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`flex items-start gap-3 p-3 hover:bg-slate-50 border-b border-slate-100 transition-colors ${notification.unread ? 'bg-emerald-50/50' : ''}`}
                    >
                      <div className="mt-1 flex-shrink-0">
                        {notification.icon || (
                          notification.unread ? 
                            <div className="h-2 w-2 rounded-full bg-emerald-500"></div> :
                            <Clock className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={notification.unread ? "font-medium text-slate-800" : "text-slate-600"}>
                          {notification.content}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">{notification.time}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="border-t border-slate-100 p-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-center rounded-lg py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  View all notifications
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full overflow-hidden border border-slate-200">
                <Avatar className="h-8 w-8">
                  {user && user.avatar_url ? (
                    <AvatarImage src={user.avatar_url} alt={user.name} />
                  ) : (
                    <AvatarFallback className="bg-emerald-50 text-emerald-700">
                      {user && user.name ? user.name.split(" ").map((n: string) => n[0]).join("") : "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-1 p-0 overflow-hidden border-none shadow-lg rounded-xl">
              <div className="bg-gradient-to-r from-emerald-700 to-green-600 p-4 text-white">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-white/20">
                    {user && user.avatar_url ? (
                      <AvatarImage src={user.avatar_url} alt={user.name} />
                    ) : (
                      <AvatarFallback className="bg-white/10 text-white">
                        {user && user.name ? user.name.split(" ").map((n: string) => n[0]).join("") : "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium">{user ? user.name : "Loading..."}</p>
                    <p className="text-xs text-emerald-100">{user ? user.email : ""}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-2">
                <Link href="/account" passHref legacyBehavior>
  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
    <a className="flex items-center w-full">
      <User className="mr-2 h-4 w-4 text-slate-500" />
      <span>My Profile</span>
    </a>
  </DropdownMenuItem>
</Link>
                <Link href="/account/settings" passHref legacyBehavior>
  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
    <a className="flex items-center w-full">
      <Settings className="mr-2 h-4 w-4 text-slate-500" />
      <span>Account Settings</span>
    </a>
  </DropdownMenuItem>
</Link>
              </div>
              
              <div className="p-2 pt-0">
                <Link href="/billing/pricing-plans" passHref legacyBehavior>
  <Button 
    asChild
    variant="ghost" 
    className="w-full justify-start rounded-lg py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
  >
    <a>Upgrade to Pro</a>
  </Button>
</Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="rounded-lg cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={async () => {
                    try {
                      await signOut();
                      router.push("/login");
                    } catch (error) {
                      console.error("Error signing out:", error);
                    }
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  )
}
