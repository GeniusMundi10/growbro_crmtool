import Header from "@/components/header";
import { Shimmer } from "@/components/ui/shimmer";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <Header 
        title="Plan & Billing" 
        description="View your current plan, track usage, and manage billing settings. Upgrade anytime."
        showTitleInHeader={false}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Current Plan Card skeleton */}
          <div className="border rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Shimmer className="h-5 w-40" />
                  <Shimmer className="h-4 w-56" />
                </div>
                <Shimmer className="h-6 w-20 rounded-full" />
              </div>
            </div>
            <div className="p-6 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Shimmer className="h-4 w-4 rounded" />
                  <Shimmer className="h-4 w-[60%]" />
                </div>
              ))}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="border rounded-xl p-4">
                    <Shimmer className="h-3.5 w-24 mb-2" />
                    <Shimmer className="h-6 w-16" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <Shimmer className="h-10 w-full rounded-md" />
                <Shimmer className="h-10 w-full rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
