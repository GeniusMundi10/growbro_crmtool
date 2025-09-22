import Header from "@/components/header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <Header title="Chat History" />
      
      {/* Filters Header Skeleton */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Filters Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-10 w-[180px]" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-10 w-[140px]" />
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-10 w-[140px]" />
          </div>
        </div>
      </div>

      {/* Two-Pane Layout Skeleton */}
      <div className="flex h-[calc(100vh-140px)]">
        {/* Chat List Pane Skeleton */}
        <div className="w-1/3 border-r bg-white flex flex-col">
          {/* Search Bar Skeleton */}
          <div className="p-4 border-b bg-gray-50">
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Chat List Items Skeleton */}
          <ScrollArea className="flex-1">
            <div className="divide-y">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="p-4 border-b">
                  <div className="flex items-start space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-8" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-4 w-20 rounded-full" />
                        <Skeleton className="h-4 w-16 rounded-full" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Conversation View Pane Skeleton */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Empty State */}
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
              <Skeleton className="h-6 w-48 mx-auto mb-2" />
              <Skeleton className="h-4 w-64 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
