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
  Plug,
  ChevronRight,
  Menu,
  Loader2,
  Circle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import AnimatedLogoSprout from "@/components/AnimatedLogoSprout"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { supabase, getAIsForUser, deleteAIAndData } from "@/lib/supabase"
import { useUser } from "@/context/UserContext"
import React from "react"
import { toast } from "sonner"

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
  { name: "Integrations", icon: <Plug className="h-5 w-5" />, path: "/integrations" },
]

interface SidebarProps {
  locked?: boolean;
}

export default function Sidebar({ locked = false }: SidebarProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; ai: any } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<any>(null);

  const pathname = usePathname()
  const [expanded, setExpanded] = useState(true)
  // Always start with Manage AI section expanded for better UX
  const [manageAIExpanded, setManageAIExpanded] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const { user, loading: loadingUserContext } = useUser();
  const [aiList, setAIList] = useState<any[]>([])
  const [loadingAIs, setLoadingAIs] = useState(true)
  const router = useRouter();
  const [aiTrainingStatus, setAiTrainingStatus] = useState<Record<string, boolean>>({});
  
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
      
      // Check vectorstore_ready status for each AI
      const trainingStatus: Record<string, boolean> = {};
      for (const ai of ais || []) {
        const { data } = await supabase
          .from("business_info")
          .select("vectorstore_ready")
          .eq("id", ai.id)
          .single();
        
        // Set to true if vectorstore is not ready (still training)
        trainingStatus[ai.id] = !(data?.vectorstore_ready === true);
      }
      setAiTrainingStatus(trainingStatus);
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
      const shouldRefreshAIs = sessionStorage.getItem('refresh_ais') === 'true';
      if (shouldRefreshAIs) {
        sessionStorage.removeItem('refresh_ais');
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
  }, [fetchUserAIs]);
  
  // Fetch AI data when user changes
  useEffect(() => {
    if (user?.id && mounted) {
      fetchUserAIs();
    }
  }, [user, fetchUserAIs, mounted]);
  
  // Setup polling for training status for all AIs in the list
  useEffect(() => {
    if (aiList.length === 0) return;
    
    // Initial check for all AIs
    const checkTrainingStatus = async () => {
      const updatedStatus = {...aiTrainingStatus};
      let hasChanges = false;
      
      for (const ai of aiList) {
        const { data } = await supabase
          .from("business_info")
          .select("vectorstore_ready")
          .eq("id", ai.id)
          .single();
        
        // If vectorstore is ready, update status (false means no longer in training)
        const isStillTraining = !(data?.vectorstore_ready === true);
        if (updatedStatus[ai.id] !== isStillTraining) {
          updatedStatus[ai.id] = isStillTraining;
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        setAiTrainingStatus(updatedStatus);
      }
    };
    
    // Check initial status
    checkTrainingStatus();
    
    // Set up polling interval to check for training status
    const interval = setInterval(checkTrainingStatus, 10000); // Poll every 10 seconds
    
    return () => clearInterval(interval);
  }, [aiList]);

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
    <div
      ref={sidebarRef}
      className={cn(
        "fixed top-0 left-0 z-40 h-screen bg-gradient-to-b from-emerald-900 to-green-700 text-white shadow-lg transition-colors",
        expanded ? "w-[280px]" : (isHovering ? "w-[280px]" : "w-[70px]")
      )}
      onMouseEnter={() => !expanded && setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
>
      {/* Context menu for AI delete, rendered at root level for correct positioning */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white text-gray-900 rounded shadow-md border p-2 min-w-[120px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button
            className="w-full text-left px-2 py-1 hover:bg-red-50 hover:text-red-600 rounded"
            onClick={() => {
              setShowDeleteConfirm(contextMenu.ai);
              setContextMenu(null);
            }}
          >Delete</button>
        </div>
      )}

      {/* Delete Confirmation Dialog (root level, not inside AI list) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded shadow-lg p-6 min-w-[320px] max-w-[90vw]">
            <h2 className="font-bold text-lg mb-2 text-gray-900">Delete AI?</h2>
            <p className="mb-4 text-gray-700">Are you sure you want to delete <b>{showDeleteConfirm.ai_name || 'this AI'}</b> and all its data? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
                onClick={() => setShowDeleteConfirm(null)}
              >Cancel</button>
              <button
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
                onClick={async () => {
                  if (!user?.id) return;
                  const ok = await deleteAIAndData(showDeleteConfirm.id, user.id);
                  if (ok) {
                    setAIList(list => list.filter(ai => ai.id !== showDeleteConfirm.id));
                    toast.success('AI and all data deleted');
                  } else {
                    toast.error('Failed to delete AI');
                  }
                  setShowDeleteConfirm(null);
                }}
              >Delete</button>
            </div>
          </div>
        </div>
      )}

      <TooltipProvider delayDuration={0}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-6">
            <div 
              className={cn(
                "flex items-center transition-opacity duration-200",
                expanded || isHovering ? "opacity-100" : "opacity-60"
              )}
            >
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <AnimatedLogoSprout size={32} colorScheme="light" />
              </div>
              {(expanded || isHovering) && (
                <Link href="/dashboard" className="flex items-center">
                  <h1 className="text-xl font-bold">growbro.ai</h1>
                </Link>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-white hover:bg-white/10 focus:outline-none"
              onClick={() => setExpanded(!expanded)}
            >
              <span className={expanded ? "transition-transform duration-300" : "rotate-180 transition-transform duration-300"}>
                {expanded ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </span>
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <nav className="space-y-1.5">
              {/* Manage AI section */}
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
                          <span className={manageAIExpanded ? "rotate-90 transition-transform duration-200" : "transition-transform duration-200"}>
                            <ChevronRight className="h-4 w-4" />
                          </span>
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
                {manageAIExpanded && (expanded || isHovering) && (
                  <div className="ml-7 mt-1 mb-1 overflow-hidden transition-all duration-200">
                    <div className="py-2 text-sm text-green-100 flex items-center">All AIs</div>
                    {loadingAIs ? (
                      <div className="text-xs text-gray-200 px-2 py-1">Loading...</div>
                    ) : aiList.length === 0 ? (
                      <div className="text-xs text-gray-200 px-2 py-1">No AIs found</div>
                    ) : (
                      aiList.map(ai => (
                        <div
                          key={ai.id}
                          onContextMenu={e => {
                            e.preventDefault();
                            setContextMenu({ x: e.clientX, y: e.clientY, ai });
                          }}
                          className="relative"
                        >
                          <Link
                            href={`/dashboard/info?aiId=${ai.id}`}
                            className="flex items-center rounded-md py-2 px-3 text-sm text-green-100 hover:bg-white/10 hover:text-white"
                          >
                            <span className="mr-2">🤖</span>
                            <span className="flex-1">{ai.ai_name || "Untitled AI"}</span>
                            {/* Show either training indicator or online indicator */}
                            {aiTrainingStatus[ai.id] ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="ml-1">
                                    <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="border-none bg-gray-900 text-white">
                                  AI is still being trained
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="ml-1">
                                    <Circle className="h-3 w-3 text-green-500 fill-green-500" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="border-none bg-gray-900 text-white">
                                  AI is online and ready
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </Link>
                          
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Add New AI button */}
              <div className="flex justify-center my-2">
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-center text-green-200 border border-green-500 hover:bg-green-800/80 hover:text-white"
                  onClick={() => router.push('/dashboard/info?new=true')}
                  aria-label="Add New AI"
                >
                  <PlusCircle className="h-5 w-5 mr-2" />
                  {(expanded || isHovering) && <span>Add New AI</span>}
                </Button>
              </div>

              {/* Main menu items */}
              {menuItems.map((item) => {
  const isBilling = item.name === "Billing";
  const isDisabled = locked && !isBilling;
  return (
    <div key={item.name}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.path}
            tabIndex={isDisabled ? -1 : 0}
            className={cn(
              "flex items-center rounded-lg px-3 py-3 text-sm transition-colors",
              pathname === item.path ||
                (pathname.startsWith(item.path + "/") && item.path !== "/")
                ? "bg-white/20 font-medium"
                : "hover:bg-white/10",
              !expanded && !isHovering && "justify-center",
              isDisabled && "opacity-50 pointer-events-none select-none cursor-not-allowed"
            )}
            aria-disabled={isDisabled ? "true" : undefined}
          >
            <div
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
            </div>
          </Link>
        </TooltipTrigger>
        {!expanded && !isHovering && (
          <TooltipContent side="right" className="border-none bg-gray-900 text-white">
            {item.name}
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  );
})}
            </nav>
          </div>

          {/* User info section at the bottom */}
          <div className="mt-auto p-4 border-t border-white/10">
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
          </div>
        </div>
      </TooltipProvider>
    </div>
  )
}
