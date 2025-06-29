import React from "react";

interface CrawlAnalyticsCardProps {
  totalPagesCrawled: number;
  filesIndexed: number;
  urlsCrawled: string[];
  loading: boolean;
}

const CrawlAnalyticsCard: React.FC<CrawlAnalyticsCardProps> = ({
  totalPagesCrawled,
  filesIndexed,
  urlsCrawled,
  loading,
}) => (
  <div className="bg-white rounded shadow p-6">
    <h3 className="font-semibold text-lg mb-2">Knowledge Base Crawl Analytics</h3>
    <div className="mb-2">Total Pages Crawled: <b>{loading ? 'Loading...' : totalPagesCrawled ?? 0}</b></div>
    <div className="mb-2">Files Indexed: <b>{loading ? 'Loading...' : filesIndexed ?? 0}</b></div>
    <div className="mb-2">
      <b>Pages/Links Crawled:</b>
      {loading ? (
        <span className="ml-2">Loading...</span>
      ) : urlsCrawled && urlsCrawled.length > 0 ? (
        <ul className="list-disc ml-6">
          {urlsCrawled.map((url, idx) => (
            <li key={idx}>
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">{url}</a>
            </li>
          ))}
        </ul>
      ) : (
        <span className="ml-2">None</span>
      )}
    </div>
  </div>
);

export default CrawlAnalyticsCard;
