import Header from "@/components/header";
import { Shimmer } from "@/components/ui/shimmer";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <Header 
        title="Sales Leads"
        description="Qualified contacts captured by your AI assistants. Filter, export, and sync to HubSpot in one place."
        showTitleInHeader={false}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Stats skeleton (3 cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="border rounded-xl p-5 bg-white shadow-sm">
                <Shimmer className="h-4 w-28 mb-2" />
                <Shimmer className="h-8 w-16" />
              </div>
            ))}
          </div>

          {/* Filters & actions skeleton */}
          <div className="border rounded-xl p-4 bg-white shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="flex items-center gap-2">
                  <Shimmer className="h-4 w-20" />
                  <Shimmer className="h-9 w-[200px]" />
                </div>
                <Shimmer className="h-9 w-[260px]" />
              </div>
              <div className="flex items-center gap-2">
                <Shimmer className="h-9 w-32" />
                <Shimmer className="h-9 w-28" />
              </div>
            </div>
          </div>

          {/* Table skeleton with header and rows */}
          <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="border-b bg-gray-50 px-4 py-3">
              <div className="grid grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Shimmer key={i} className="h-4 w-24" />
                ))}
              </div>
            </div>
            <div className="divide-y">
              {Array.from({ length: 8 }).map((_, row) => (
                <div key={row} className="px-4 py-3">
                  <div className="grid grid-cols-6 items-center gap-3">
                    <Shimmer className="h-4 w-32" />
                    <Shimmer className="h-4 w-48" />
                    <Shimmer className="h-4 w-28" />
                    <Shimmer className="h-6 w-20 rounded-full" />
                    <Shimmer className="h-6 w-24 rounded" />
                    <div className="flex justify-end">
                      <Shimmer className="h-8 w-32" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
