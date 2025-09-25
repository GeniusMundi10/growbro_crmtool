import Header from "@/components/header";
import { Shimmer } from "@/components/ui/shimmer";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <Header 
        title="Plan & Billing" 
        description="Break down your usage month-by-month or view all-time totals across agents."
        showTitleInHeader={false}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4">
            <Shimmer className="h-10 w-36 rounded-md" />
            <Shimmer className="h-10 w-32 rounded-md" />
            <Shimmer className="h-10 w-24 rounded-md" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded-xl p-4">
                <Shimmer className="h-3.5 w-24 mb-2" />
                <Shimmer className="h-6 w-16" />
              </div>
            ))}
          </div>

          <div className="border rounded-2xl overflow-hidden">
            <div className="bg-green-600 px-6 py-3">
              <Shimmer className="h-4 w-40" />
            </div>
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Shimmer className="h-4 w-4 rounded" />
                  <Shimmer className="h-4 w-[60%]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
