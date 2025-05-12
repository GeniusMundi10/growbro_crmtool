"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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

const menuItems = [
  { 
    name: "Manage AI", 
    icon: <MessageSquare className="h-5 w-5" />, 
    path: "/dashboard", 
    hasSubmenu: true,
    submenuItems: [
      { name: "Create New AI", icon: <PlusCircle className="h-4 w-4" />, path: "/dashboard/create" }
    ]
  },
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
              {menuItems.map((item) => (
                <div key={item.name}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.hasSubmenu ? "#" : item.path}
                        className={cn(
                          "flex items-center rounded-lg px-3 py-3 text-sm transition-colors",
                          pathname === item.path || 
                          (pathname.startsWith(item.path + "/") && item.path !== "/") ? 
                            "bg-white/20 font-medium" : 
                            "hover:bg-white/10",
                          !expanded && !isHovering && "justify-center",
                        )}
                        onClick={(e) => {
                          if (item.hasSubmenu) {
                            e.preventDefault()
                            setManageAIExpanded(!manageAIExpanded)
                          }
                        }}
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
                              {item.hasSubmenu && (
                                <motion.div
                                  animate={{ rotate: manageAIExpanded ? 90 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </motion.div>
                              )}
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

                  <AnimatePresence>
                    {item.hasSubmenu && manageAIExpanded && (expanded || isHovering) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-7 mt-1 mb-1 overflow-hidden"
                      >
                        <div className="py-2 text-sm text-green-100">
                          GrowBro AI
                        </div>
                        {item.submenuItems?.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.path}
                            className="flex items-center rounded-md py-2 px-3 text-sm text-green-100 hover:bg-white/10 hover:text-white"
                          >
                            {subItem.icon && <span className="mr-2">{subItem.icon}</span>}
                            <span>{subItem.name}</span>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
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
              <Avatar className="h-9 w-9 ring-2 ring-white/20">
                <AvatarFallback className="bg-white/10 text-white">
                  GB
                </AvatarFallback>
              </Avatar>
              
              {(expanded || isHovering) && (
                <div className="ml-3 overflow-hidden">
                  <p className="text-sm font-medium leading-tight">GrowBro User</p>
                  <p className="truncate text-xs text-gray-300">user@example.com</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </TooltipProvider>
    </motion.div>
  )
}
