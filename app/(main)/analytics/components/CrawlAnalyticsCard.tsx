

"use client";

import React, { useState } from "react";

interface CrawlAnalyticsCardProps {
  totalPagesCrawled: number;
  filesIndexed: number;
  urlsCrawled: string[];
  loading: boolean;
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

const CrawlAnalyticsCard: React.FC<CrawlAnalyticsCardProps> = ({
  totalPagesCrawled,
  filesIndexed,
  urlsCrawled,
  loading,
}) => {
  const [showAll, setShowAll] = useState(false);
  // Track favicon error state by URL index
  const [faviconErrors, setFaviconErrors] = useState<{ [idx: number]: boolean }>({});
  const handleFaviconError = (idx: number) => {
    setFaviconErrors((prev) => ({ ...prev, [idx]: true }));
  };
  const visibleUrls = showAll ? urlsCrawled : urlsCrawled.slice(0, 7);
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
          </ul>
        ) : (
          <span className="text-gray-400">None</span>
        )}
      </div>
    </div>
  );
};

export default CrawlAnalyticsCard;
