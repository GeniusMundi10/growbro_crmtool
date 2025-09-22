import Header from "@/components/header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Header title="Chat History" />
      
      {/* Premium Filters Header Skeleton */}
      <div className="border-b bg-white/80 backdrop-blur-sm px-6 py-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>

        {/* Enhanced Filters Skeleton */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200/50">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-11 w-[180px] rounded-xl" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-11 w-[140px] rounded-xl" />
              <Skeleton className="h-4 w-6" />
              <Skeleton className="h-11 w-[140px] rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Premium Two-Pane Layout Skeleton */}
      <div className="flex h-[calc(100vh-180px)] gap-1">
        {/* Enhanced Chat List Pane Skeleton */}
        <div className="w-1/3 bg-white/95 backdrop-blur-sm flex-col rounded-tl-2xl shadow-xl border border-gray-200/50">
          {/* Premium Search Header Skeleton */}
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50/30">
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>

          {/* Premium Chat List Items Skeleton */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="mx-2 mb-1 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <Skeleton className="h-10 w-10 rounded-full shadow-md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </div>
                          <div className="flex items-center space-x-3">
                            <Skeleton className="h-3 w-12" />
                            <Skeleton className="h-3 w-8" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-4 w-20 rounded-full" />
                        <Skeleton className="h-4 w-16 rounded-full" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Premium Conversation View Pane Skeleton */}
        <div className="flex-1 bg-white/95 backdrop-blur-sm rounded-tr-2xl shadow-xl border border-gray-200/50">
          {/* Enhanced Empty State Skeleton */}
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30">
            <div className="text-center max-w-md p-8">
              <div className="relative mb-8">
                <Skeleton className="w-24 h-24 rounded-3xl mx-auto shadow-lg" />
                <Skeleton className="absolute -top-2 -right-2 w-8 h-8 rounded-full" />
              </div>
              <Skeleton className="h-8 w-48 mx-auto mb-3" />
              <Skeleton className="h-4 w-64 mx-auto mb-2" />
              <Skeleton className="h-4 w-56 mx-auto mb-6" />
              <div className="flex items-center justify-center space-x-2">
                <Skeleton className="w-2 h-2 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
