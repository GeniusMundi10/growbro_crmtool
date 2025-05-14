"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  BarChart3,
  MessageSquare,
  Settings,
  Users,
  FileText,
  HelpCircle,
  PlusCircle,
  History,
  CreditCard,
  Map,
  ChevronRight,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { supabase, debugFetchUsers, fetchUsersDirectly, getAIsForUser } from "@/lib/supabase"
import { useUser } from "@/context/UserContext"
import React from "react"

const menuItems = [
  { name: "Analytics", icon: <BarChart3 className="h-5 w-5" />, path: "/analytics" },
  { name: "Customize", icon: <Settings className="h-5 w-5" />, path: "/customize" },
  { name: "Get AI Code & Test AI", icon: <FileText className="h-5 w-5" />, path: "/ai-code" },
  { name: "Sales Leads", icon: <Users className="h-5 w-5" />, path: "/sales-leads" },
  { name: "Chat History", icon: <History className="h-5 w-5" />, path: "/chat-history" },
  { name: "Team", icon: <Users className="h-5 w-5" />, path: "/team" },
  { name: "Account", icon: <Settings className="h-5 w-5" />, path: "/account" },
  { name: "Help Center", icon: <HelpCircle className="h-5 w-5" />, path: "/help" },
  { name: "Take a Tour", icon: <Map className="h-5 w-5" />, path: "/tour" },
  { name: "Billing", icon: <CreditCard className="h-5 w-5" />, path: "/billing" },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(true)
  const [manageAIExpanded, setManageAIExpanded] = useState(
    pathname === "/dashboard" || pathname.startsWith("/dashboard/")
  )
  const [mounted, setMounted] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const { user, loading: loadingUserContext } = useUser();
  const [aiList, setAIList] = useState<any[]>([])
  const [loadingAIs, setLoadingAIs] = useState(true)
  const router = useRouter();
  
  // Handle window resize to collapse sidebar on mobile
  useEffect(() => {
    setMounted(true)
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setExpanded(false)
      } else {
        setExpanded(true)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    
    // Handle clicks outside sidebar to close it on mobile
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target as Node) &&
        window.innerWidth < 768 && 
        expanded
      ) {
        setExpanded(false)
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      window.removeEventListener("resize", handleResize)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [expanded])

  // Fix the fetchUserAIs function reference and dependencies
  const fetchUserAIs = React.useCallback(async () => {
    if (!user?.id) return;
    setLoadingAIs(true);
    try {
      const ais = await getAIsForUser(user.id);
      setAIList(ais || []);
    } catch (e) {
      setAIList([]);
    } finally {
      setLoadingAIs(false);
    }
  }, [user]);

  // Check for window to handle SSR and for refresh flag in session storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check session storage flag
      const shouldRefresh = sessionStorage.getItem('refreshAIList');
      if (shouldRefresh === 'true') {
        // Clear the flag
        sessionStorage.removeItem('refreshAIList');
        // Refresh the AI list
        fetchUserAIs();
      }
      
      // Add event listener for custom refresh event
      const handleRefreshEvent = () => {
        fetchUserAIs();
      };
      
      window.addEventListener('refreshAIList', handleRefreshEvent);
      
      // Cleanup
      return () => {
        window.removeEventListener('refreshAIList', handleRefreshEvent);
      };
    }
  }, [pathname, fetchUserAIs]); // Re-run when pathname changes (after navigation)

  // Initial fetch of AIs when user is loaded
  useEffect(() => {
    if (user) {
      fetchUserAIs();
    }
  }, [user, fetchUserAIs]);

  if (!mounted) return null

  const sidebarVariants = {
    expanded: { width: "280px", transition: { type: "spring", stiffness: 300, damping: 30 } },
    collapsed: { width: "70px", transition: { type: "spring", stiffness: 300, damping: 30 } },
    hovering: { width: "280px", transition: { type: "spring", stiffness: 300, damping: 30 } }
  }

  // Determine current variant based on expanded state and hover state
  const currentVariant = expanded 
    ? "expanded" 
    : (isHovering ? "hovering" : "collapsed");

  return (
    <motion.div
      ref={sidebarRef}
      className={cn(
        "fixed top-0 left-0 z-40 h-screen bg-gradient-to-b from-emerald-900 to-green-700 text-white shadow-lg transition-colors",
      )}
      initial={false}
      animate={currentVariant}
      variants={sidebarVariants}
      onHoverStart={() => !expanded && setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
    >
      <TooltipProvider delayDuration={0}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-6">
            <motion.div 
              className="flex items-center"
              animate={{ opacity: expanded || isHovering ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <span className="text-xl font-bold text-white">G</span>
              </div>
              {(expanded || isHovering) && (
                <Link href="/dashboard" className="flex items-center">
                  <h1 className="text-xl font-bold">growbro.ai</h1>
                </Link>
              )}
            </motion.div>
            
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-white hover:bg-white/10 focus:outline-none"
              onClick={() => setExpanded(!expanded)}
            >
              <motion.div
                animate={{ rotate: expanded ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                {expanded ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </motion.div>
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <nav className="space-y-1.5">
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "flex items-center rounded-lg px-3 py-3 text-sm transition-colors cursor-pointer",
                        manageAIExpanded ? "bg-white/20 font-medium" : "hover:bg-white/10",
                        !expanded && !isHovering && "justify-center"
                      )}
                      onClick={() => setManageAIExpanded(!manageAIExpanded)}
                    >
                      <span className="flex items-center">
                        <MessageSquare className="h-5 w-5" />
                      </span>
                      {(expanded || isHovering) && (
                        <div className="ml-3 flex w-full justify-between items-center">
                          <span>Manage AI</span>
                          <motion.div animate={{ rotate: manageAIExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronRight className="h-4 w-4" />
                          </motion.div>
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  {!expanded && !isHovering && (
                    <TooltipContent side="right" className="border-none bg-gray-900 text-white">
                      Manage AI
                    </TooltipContent>
                  )}
                </Tooltip>
                <AnimatePresence>
                  {manageAIExpanded && (expanded || isHovering) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-7 mt-1 mb-1 overflow-hidden"
                    >
                      <div className="py-2 text-sm text-green-100 flex items-center justify-between">
                        <span>All AIs</span>
                        <Link href="/dashboard/info?new=true" legacyBehavior>
                          <a className="flex items-center text-green-200 px-2 py-1 rounded hover:bg-white/10 text-sm">
                            <PlusCircle className="h-4 w-4 mr-1" /> New
                          </a>
                        </Link>
                      </div>
                      {loadingAIs ? (
                        <div className="text-xs text-gray-200 px-2 py-1">Loading...</div>
                      ) : aiList.length === 0 ? (
                        <div className="text-xs text-gray-200 px-2 py-1">No AIs found</div>
                      ) : (
                        aiList.map(ai => (
                          <Link
                            key={ai.id}
                            href={`/dashboard/info?aiId=${ai.id}`}
                            className="flex items-center rounded-md py-2 px-3 text-sm text-green-100 hover:bg-white/10 hover:text-white"
                          >
                            <span className="mr-2">🤖</span>
                            <span>{ai.ai_name || "Untitled AI"}</span>
                          </Link>
                        ))
                      )}
                      <Link
                        href="/dashboard/info?new=true"
                        className="flex items-center rounded-md py-2 px-3 mt-2 text-sm text-green-100 hover:bg-white/10 hover:text-white border border-dashed border-green-200/30"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        <span>Create New AI</span>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {menuItems.map((item) => (
                <div key={item.name}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.path}
                        className={cn(
                          "flex items-center rounded-lg px-3 py-3 text-sm transition-colors",
                          pathname === item.path || 
                          (pathname.startsWith(item.path + "/") && item.path !== "/") ? 
                            "bg-white/20 font-medium" : 
                            "hover:bg-white/10",
                          !expanded && !isHovering && "justify-center",
                        )}
                      >
                        <motion.div
                          className={cn(
                            "flex items-center",
                            !expanded && !isHovering && "justify-center",
                            (expanded || isHovering) && "w-full"
                          )}
                        >
                          <span className={cn(!expanded && !isHovering && "w-5 h-5", "flex items-center")}>{item.icon}</span>
                          {(expanded || isHovering) && (
                            <div className="ml-3 flex w-full justify-between items-center">
                              <span>{item.name}</span>
                            </div>
                          )}
                        </motion.div>
                      </Link>
                    </TooltipTrigger>
                    {!expanded && !isHovering && (
                      <TooltipContent side="right" className="border-none bg-gray-900 text-white">
                        {item.name}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </div>
              ))}
            </nav>
          </div>

          <motion.div 
            className="mt-auto p-4 border-t border-white/10"
            animate={{ opacity: expanded || isHovering ? 1 : 0.7 }}
          >
            <div className={cn(
              "flex items-center rounded-lg p-2 hover:bg-white/10",
              !expanded && !isHovering && "justify-center"
            )}>
              {loadingUserContext ? (
                <div className="text-xs text-gray-300">Loading...</div>
              ) : user ? (
                <>
                  <Avatar className="h-9 w-9 ring-2 ring-white/20">
                    {user.avatar_url ? (
                      <AvatarImage src={user.avatar_url} alt={user.name} />
                    ) : (
                      <AvatarFallback className="bg-white/10 text-white">
                        {user.name?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {(expanded || isHovering) && (
                    <div className="ml-3 overflow-hidden">
                      <p className="text-sm font-medium leading-tight">{user.name}</p>
                      <p className="truncate text-xs text-gray-300">{user.email}</p>
                      <p className="truncate text-xs text-green-200">{user.plan?.toUpperCase()}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-xs text-red-300">No user found</div>
              )}
            </div>
          </motion.div>
        </div>
      </TooltipProvider>
    </motion.div>
  )
}
