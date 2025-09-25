import Header from "@/components/header";
import { Shimmer } from "@/components/ui/shimmer";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <Header 
        title="Help Center" 
        description="Guides, FAQs, videos, and support to help you get the most out of GrowBro."
        showTitleInHeader={false}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Tabs skeleton */}
          <div className="flex gap-3">
            <Shimmer className="h-9 w-24 rounded-md" />
            <Shimmer className="h-9 w-20 rounded-md" />
            <Shimmer className="h-9 w-20 rounded-md" />
            <Shimmer className="h-9 w-32 rounded-md" />
          </div>

          {/* Quick links skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border rounded-xl p-4">
                <Shimmer className="h-4 w-28 mb-2" />
                <Shimmer className="h-4 w-40" />
              </div>
            ))}
          </div>

          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="border rounded-2xl p-6">
                <Shimmer className="h-5 w-40 mb-2" />
                <Shimmer className="h-4 w-64 mb-4" />
                {Array.from({ length: 6 }).map((__, j) => (
                  <div key={j} className="flex items-center gap-2 mb-2">
                    <Shimmer className="h-4 w-4 rounded" />
                    <Shimmer className="h-4 w-[60%]" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
