"use client";

import React, { useState } from "react";

interface CrawlAnalyticsCardProps {
  totalPagesCrawled: number;
  filesIndexed: number;
  urlsCrawled: string[];
  loading: boolean;
  aiId: string;
  urlToAiMap?: Record<string, string>; // Maps URLs to their AI IDs
  onUrlsRemoved?: () => void;
}

const MetricCard = ({ icon, label, value, loading }: { icon: string; label: string; value: number; loading: boolean }) => (
  <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg shadow-sm p-4 transition hover:shadow-md">
    <div className="text-3xl mb-1">{icon}</div>
    <div className="text-2xl font-bold min-h-[2rem]">
      {loading ? <span className="animate-pulse text-gray-300">•••</span> : value}
    </div>
    <div className="text-xs text-gray-600 mt-1 uppercase tracking-wide">{label}</div>
  </div>
);

interface CrawlAnalyticsCardProps {
  totalPagesCrawled: number;
  filesIndexed: number;
  urlsCrawled: string[];
  loading: boolean;
  aiId: string;
  onUrlsRemoved?: () => void;
}

const CrawlAnalyticsCard: React.FC<CrawlAnalyticsCardProps> = ({
  totalPagesCrawled,
  filesIndexed,
  urlsCrawled,
  loading,
  aiId,
  urlToAiMap = {}, // Default to empty object if not provided
  onUrlsRemoved
}) => {
  const [showAll, setShowAll] = useState(false);
  // Track favicon error state by URL index
  const [faviconErrors, setFaviconErrors] = useState<{ [idx: number]: boolean }>({});
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [removing, setRemoving] = useState(false);

  const handleFaviconError = (idx: number) => {
    setFaviconErrors((prev) => ({ ...prev, [idx]: true }));
  };
  const visibleUrls = showAll ? urlsCrawled : urlsCrawled.slice(0, 7);

  const handleCheckboxChange = (url: string) => {
    setSelectedUrls((prev) =>
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const handleRemove = async () => {
    if (selectedUrls.length === 0) return;
    setRemoving(true);
    
    try {
      // Import the deleteAIWebsiteByUrl function from supabase.ts
      const { deleteAIWebsiteByUrl } = await import("@/lib/supabase");
      
      // Group URLs by their AI ID for efficient removal
      const urlsByAi: Record<string, string[]> = {};
      
      // For each selected URL, determine which AI it belongs to
      for (const url of selectedUrls) {
        // If we have a urlToAiMap and this URL is in it, use that AI ID
        // Otherwise fall back to the provided aiId (single AI case)
        const targetAiId = urlToAiMap[url] || aiId;
        
        // Initialize the array if this is the first URL for this AI
        if (!urlsByAi[targetAiId]) {
          urlsByAi[targetAiId] = [];
        }
        
        // Add this URL to the correct AI's list
        urlsByAi[targetAiId].push(url);
        
        // Also delete the URL from the ai_website table to keep Websites tab in sync
        try {
          await deleteAIWebsiteByUrl(targetAiId, url);
          console.log(`Removed URL ${url} from ai_website table for AI ${targetAiId}`);
        } catch (err) {
          // Log but continue - we still want to remove from vectorstore even if Websites sync fails
          console.warn(`Failed to remove URL from ai_website table: ${err}`);
        }
      }
      
      // Make a separate API call for each AI's URLs
      const promises = Object.entries(urlsByAi).map(([aiId, urls]) => {
        console.log(`Removing ${urls.length} URLs from AI: ${aiId}`);
        return fetch("https://growbro-vectorstore-worker.fly.dev/remove-urls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ai_id: aiId, urls_to_remove: urls })
        }).then(res => res.json());
      });
      
      // Wait for all removals to complete
      const results = await Promise.all(promises);
      
      // Check if any removal failed
      const anyFailed = results.some(result => result.status !== "success");
      
      if (anyFailed) {
        throw new Error("Some URLs could not be removed. Please try again.");
      }
      
      setSelectedUrls([]);
      if (typeof onUrlsRemoved === "function") onUrlsRemoved();
    } catch (e) {
      console.error("Failed to remove URLs:", e);
      alert("Failed to remove URLs. Please try again.");
    } finally {
      setRemoving(false);
    }
  };


  return (
    <div className="bg-white rounded shadow p-4 mb-6">
      <h3 className="font-semibold text-lg mb-4">Knowledge Base Crawl Analytics</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <MetricCard icon="🔗" label="Links Crawled" value={urlsCrawled?.length ?? 0} loading={loading} />
        <MetricCard icon="📁" label="Files Indexed" value={filesIndexed ?? 0} loading={loading} />
      </div>
      <div>
        <div className="font-semibold mb-2 flex items-center">
          <span className="mr-2">Links Crawled</span>
          <span className="text-xs text-gray-400">({urlsCrawled?.length ?? 0})</span>
        </div>
        {loading ? (
          <div className="space-y-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 rounded animate-pulse w-3/4 mb-1" />
            ))}
          </div>
        ) : urlsCrawled && urlsCrawled.length > 0 ? (
          <ul className="list-none pl-0 space-y-1">
            {/* Track favicon error state by URL index */}
            {visibleUrls.map((url, idx) => {
              const checked = selectedUrls.includes(url);
              let domain = '';
              try {
                domain = new URL(url).hostname.replace('www.', '');
              } catch (e) {
                domain = '';
              }

              // Use a parent-level state object for favicon errors
              // (see above component for useState)
              // fallback: if faviconErrors[idx] is true, show fallback icon
              const faviconError = faviconErrors[idx] || false;

              return (
                <li key={idx} className="flex items-center group bg-gray-50 hover:bg-[#e6faed] rounded-lg px-2 py-1 transition">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={checked}
                    onChange={() => handleCheckboxChange(url)}
                    aria-label={`Select ${url}`}
                  />
                  {faviconError ? (
                    <span className="w-5 h-5 mr-2 flex items-center justify-center text-[#16a34a]" style={{ minWidth: 20 }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l7.07-7.07a4 4 0 10-5.657-5.657l-7.07 7.07a6 6 0 108.485 8.485L19 13" />
                      </svg>
                    </span>
                  ) : (
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${domain}`}
                      alt="favicon"
                      className="w-5 h-5 mr-2 rounded"
                      style={{ minWidth: 20 }}
                      onError={() => handleFaviconError(idx)}
                    />
                  )}
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#16a34a] font-semibold hover:underline transition break-all text-sm flex-1"
                  >
                    <span className="font-bold mr-1">{domain}</span>
                    <span className="text-gray-700">{url.length > 50 ? url.slice(0, 47) + '…' : url}</span>
                  </a>
                  <button
                    className="ml-2 px-2 py-1 rounded-full bg-[#16a34a]/10 text-[#16a34a] text-xs font-medium hover:bg-[#16a34a]/20 transition shadow-sm"
                    title="Copy URL"
                    aria-label="Copy URL"
                    onClick={() => navigator.clipboard.writeText(url)}
                  >
                    Copy
                  </button>
                </li>
              );
            })}

            {urlsCrawled.length > 7 && (
              <li>
                <button
                  className="text-xs text-blue-600 hover:underline mt-1"
                  onClick={() => setShowAll(s => !s)}
                >
                  {showAll ? 'Show Less' : `Show All (${urlsCrawled.length})`}
                </button>
              </li>
            )}
            {urlsCrawled.length > 0 && (
              <li>
                <button
                  className="mt-2 px-3 py-1 bg-red-500 text-white rounded shadow text-xs font-semibold disabled:opacity-50"
                  disabled={selectedUrls.length === 0 || removing}
                  onClick={handleRemove}
                >
                  {removing ? 'Removing...' : `Remove Selected (${selectedUrls.length})`}
                </button>
              </li>
            )}
          </ul>
        ) : (
          <span className="text-gray-400">None</span>
        )}
      </div>
    </div>
  );
};

export default CrawlAnalyticsCard;
