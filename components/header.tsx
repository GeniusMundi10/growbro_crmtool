"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Bell,
  Search,
  HelpCircle,
  Settings,
  User,
  Calendar,
  CheckCircle,
  Clock,
  Menu,
} from "lucide-react"
import { fetchUsersDirectly } from "@/lib/supabase"

interface HeaderProps {
  title: string
}

export default function Header({ title }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifications, setNotifications] = useState([
    { id: 1, content: "New lead captured", unread: true, time: "10m ago" },
    { id: 2, content: "5 new messages in your chat", unread: true, time: "30m ago" },
    { id: 3, content: "Weekly analytics report available", unread: false, time: "2h ago" },
    { id: 4, content: "Meeting scheduled with John Doe", unread: false, time: "Yesterday", icon: <Calendar className="h-4 w-4 text-blue-500" /> },
    { id: 5, content: "Task completed: Update contact list", unread: false, time: "2 days ago", icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
  ])
  
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
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

  useEffect(() => {
    async function fetchUser() {
      const users = await fetchUsersDirectly();
      if (users && users.length > 0) setUser(users[0]);
      setLoadingUser(false);
    }
    fetchUser();
  }, []);

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
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="h-5 w-5" />
                </Button>
              )}
            </AnimatePresence>
          </div>

          {/* Help Button */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-slate-500 hover:bg-slate-100"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost" 
                size="icon"
                className="rounded-full text-slate-500 hover:bg-slate-100 relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 p-0 text-[10px] text-white"
                  >
                    {unreadCount}
                  </Badge>
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
                <DropdownMenuItem className="rounded-lg cursor-pointer">
                  <User className="mr-2 h-4 w-4 text-slate-500" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg cursor-pointer">
                  <Settings className="mr-2 h-4 w-4 text-slate-500" />
                  <span>Account Settings</span>
                </DropdownMenuItem>
              </div>
              
              <div className="p-2 pt-0">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start rounded-lg py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  Upgrade to Pro
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  )
}
