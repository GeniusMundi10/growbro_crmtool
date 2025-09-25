import Header from "@/components/header";
import { Shimmer } from "@/components/ui/shimmer";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <Header 
        title="Integrations" 
        description="Connect third-party tools to super-charge your AI assistant workflow."
        showTitleInHeader={false}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shimmer className="h-5 w-5 rounded" />
                  <Shimmer className="h-5 w-28" />
                </div>
                <Shimmer className="h-5 w-16 rounded-full" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((__, j) => (
                  <Shimmer key={j} className="h-4 w-[80%]" />
                ))}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Shimmer className="h-9 w-full rounded-md" />
                  <Shimmer className="h-9 w-full rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
