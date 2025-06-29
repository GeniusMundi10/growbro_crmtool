

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
  const visibleUrls = showAll ? urlsCrawled : urlsCrawled.slice(0, 7);
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="font-semibold text-lg mb-4">Knowledge Base Crawl Analytics</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard icon="📄" label="Pages Crawled" value={totalPagesCrawled ?? 0} loading={loading} />
        <MetricCard icon="📁" label="Files Indexed" value={filesIndexed ?? 0} loading={loading} />
        <MetricCard icon="🔗" label="Pages/Links" value={urlsCrawled?.length ?? 0} loading={loading} />
      </div>
      <div>
        <div className="font-semibold mb-2 flex items-center">
          <span className="mr-2">Pages/Links Crawled</span>
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
            {visibleUrls.map((url, idx) => (
              <li key={idx} className="flex items-center group">
                <span className="mr-2 text-blue-400">🔗</span>
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline break-all hover:text-blue-900 transition-all text-sm flex-1">{url}</a>
                <button
                  className="ml-2 text-gray-400 hover:text-gray-700 transition"
                  title="Copy URL"
                  onClick={() => navigator.clipboard.writeText(url)}
                >
                  📋
                </button>
              </li>
            ))}
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
