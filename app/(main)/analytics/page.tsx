"use client"

// Add these export directives to prevent prerendering issues
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { updateBusinessInfo } from "@/lib/supabase";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"
import { Calendar, Clock, MessageSquare, User, Users } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TimeSeriesChart from "./components/TimeSeriesChart";
import FunnelChart from "./components/FunnelChart";
import LeaderboardTable from "./components/LeaderboardTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Header from "@/components/header"
import { getCurrentUser } from "@/lib/auth";
import { getDashboardMessageSummary, DashboardMessageSummary, getAIsForUser, getUniqueLeadsForPeriod, getDashboardKPIStats, getUserSegmentDistribution, getFunnelData, getDashboardFeedbackStats } from "@/lib/supabase"
import KPISection from "./components/KPISection"
import ConversationDurationPieChart from "./components/ConversationDurationPieChart"
import UserSegmentPieChart from "./components/UserSegmentPieChart"
import CrawlAnalyticsCard from "./components/CrawlAnalyticsCard";

const SEGMENT_COLORS = ["#60a5fa", "#34d399"];

// --- Weekday grouping utility ---
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
function groupByWeekday(rows: DashboardMessageSummary[], valueKey: keyof DashboardMessageSummary) {
  const weekdayTotals: Record<string, number> = {};
  WEEKDAYS.forEach(day => { weekdayTotals[day] = 0; });
  rows.forEach(row => {
    const date = new Date(row.day);
    let weekdayIdx = date.getDay();
    weekdayIdx = (weekdayIdx + 6) % 7; // Monday=0, Sunday=6
    const weekday = WEEKDAYS[weekdayIdx];
    weekdayTotals[weekday] += row[valueKey] ?? 0;
  });
  return WEEKDAYS.map(day => ({
    weekday: day,
    value: weekdayTotals[day],
  }));
}

export default function AnalyticsPage() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [loading, setLoading] = useState(true)
  // Always default to 'week' filter, even on remount or navigation
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>(() => 'week')
  const [summaryRows, setSummaryRows] = useState<DashboardMessageSummary[]>([])
  const [ais, setAIs] = useState<any[]>([])
  const [selectedAIId, setSelectedAIId] = useState<string>("__all__");
  const [uniqueLeadsCount, setUniqueLeadsCount] = useState<number>(0);
  const [prevUniqueLeadsCount, setPrevUniqueLeadsCount] = useState<number>(0);
  const [aiSummaryRows, setAISummaryRows] = useState<any[]>([]); // Per-AI totals for leaderboard
  const [kpiStats, setKpiStats] = useState<{
    totalMessages: number;
    totalConversations: number;
    totalLeads: number;
    avgConversationDuration: number;
    trendMessages?: number;
    trendConversations?: number;
    trendLeads?: number;
    trendDuration?: number;
  } | null>(null);
  const [feedbackStats, setFeedbackStats] = useState<{ up: number; down: number; none: number }>({ up: 0, down: 0, none: 0 });
  const [userSegment, setUserSegment] = useState<{ newUsers: number; returningUsers: number } | null>(null);
  // Funnel data
  const [funnelData, setFunnelData] = useState<{ startedCount: number; engagedCount: number; leadsCount: number } | null>(null);
  // Crawl analytics state
  const [crawlAnalytics, setCrawlAnalytics] = useState<{
    totalPagesCrawled: number;
    filesIndexed: number;
    urlsCrawled: string[];
    urlToAiMap: Record<string, string>; // Maps each URL to its AI ID
    loading: boolean;
  }>({ totalPagesCrawled: 0, filesIndexed: 0, urlsCrawled: [], urlToAiMap: {}, loading: false });

  // Effect for fetching crawl analytics data - runs when selectedAIId or ais changes
  useEffect(() => {
    async function fetchCrawlAnalytics() {
      setCrawlAnalytics(prev => ({ ...prev, loading: true }));
      try {
        if (selectedAIId === "__all__") {
          if (!ais || ais.length === 0) {
            setCrawlAnalytics({ totalPagesCrawled: 0, filesIndexed: 0, urlsCrawled: [], urlToAiMap: {}, loading: false });
            return;
          }
          const mod = await import("@/lib/supabase");
          const infos = await Promise.all(ais.map((ai: any) => mod.getBusinessInfo(ai.id)));
          console.log('[CrawlAnalytics] All AIs fetched business_info:', infos);
          let totalPagesCrawled = 0;
          let filesIndexed = 0;
          let urlsSet = new Set<string>();
          let urlToAiMap: Record<string, string> = {};
          
          for (const info of infos) {
            if (!info || !info.id) continue;
            totalPagesCrawled += Number(info.total_pages_crawled) || 0;
            filesIndexed += Number(info.files_indexed) || 0;
            let urls: string[] = Array.isArray(info.urls_crawled)
              ? info.urls_crawled
              : (typeof info.urls_crawled === "string" && info.urls_crawled.startsWith("[")
                  ? JSON.parse(info.urls_crawled)
                  : []);
                  
            // Add URLs to set and map each URL to this AI's ID
            urls.forEach((u: string) => {
              urlsSet.add(u);
              urlToAiMap[u] = info.id; // Map URL to AI ID
            });
          }
          
          setCrawlAnalytics({
            totalPagesCrawled,
            filesIndexed,
            urlsCrawled: Array.from(urlsSet),
            urlToAiMap, // Store the URL to AI mapping
            loading: false,
          });
        } else if (selectedAIId) {
          const mod = await import("@/lib/supabase");
          const info = await mod.getBusinessInfo(selectedAIId);
          console.log('[CrawlAnalytics] Single AI fetched business_info:', info);
          // For single AI, all URLs belong to this AI
          const urls = Array.isArray(info?.urls_crawled)
            ? info.urls_crawled
            : (typeof info?.urls_crawled === "string" && info?.urls_crawled.startsWith("[")
                ? JSON.parse(info.urls_crawled)
                : []);
          
          // Create a mapping where all URLs map to this AI ID
          const urlToAiMap: Record<string, string> = {};
          urls.forEach((url: string) => urlToAiMap[url] = selectedAIId);
          
          setCrawlAnalytics({
            totalPagesCrawled: info?.total_pages_crawled ?? 0,
            filesIndexed: info?.files_indexed ?? 0,
            urlsCrawled: urls,
            urlToAiMap,
            loading: false,
          });
        } else {
          setCrawlAnalytics({ totalPagesCrawled: 0, filesIndexed: 0, urlsCrawled: [], urlToAiMap: {}, loading: false });
        }
      } catch {
        setCrawlAnalytics({ totalPagesCrawled: 0, filesIndexed: 0, urlsCrawled: [], urlToAiMap: {}, loading: false });
      }
    }
    const fetchData = async () => {
      await fetchCrawlAnalytics();
    };
    fetchData();
  }, [selectedAIId, ais]);
  
  // Effect for initial user and AIs loading - runs only once on mount
  useEffect(() => {
    async function loadUserAndAIs() {
      setLoading(true)
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        if (currentUser) {
          const ais = await getAIsForUser(currentUser.id)
          setAIs(ais)
        }
      } finally {
        setLoading(false)
      }
    }
    loadUserAndAIs()
  }, [])

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true)
      try {
        const now = new Date()
        let fromDate: string | undefined
        let toDate: string | undefined = now.toISOString().slice(0, 10)
        let prevFromDate: string | undefined
        let prevToDate: string | undefined
        if (period === 'day') {
          fromDate = now.toISOString().slice(0, 10)
          prevFromDate = new Date(now.getTime() - 24*60*60*1000).toISOString().slice(0, 10)
          prevToDate = fromDate
        } else if (period === 'week') {
          const weekAgo = new Date(now)
          weekAgo.setDate(now.getDate() - 6)
          fromDate = weekAgo.toISOString().slice(0, 10)
          const prevWeekAgo = new Date(weekAgo)
          prevWeekAgo.setDate(weekAgo.getDate() - 7)
          prevFromDate = prevWeekAgo.toISOString().slice(0, 10)
          prevToDate = weekAgo.toISOString().slice(0, 10)
        } else if (period === 'month') {
          const monthAgo = new Date(now)
          monthAgo.setMonth(now.getMonth() - 1)
          fromDate = monthAgo.toISOString().slice(0, 10)
          const prevMonthAgo = new Date(monthAgo)
          prevMonthAgo.setMonth(monthAgo.getMonth() - 1)
          prevFromDate = prevMonthAgo.toISOString().slice(0, 10)
          prevToDate = monthAgo.toISOString().slice(0, 10)
        }
        let feedback = { up: 0, down: 0, none: 0 };
        try {
          feedback = await getDashboardFeedbackStats(user!.id, selectedAIId, fromDate!, toDate!);
        } catch (e) {
          // If feedback stats fail, fallback to zeros
          feedback = { up: 0, down: 0, none: 0 };
        }
        const [kpi, prevKpi, segment] = await Promise.all([
          getDashboardKPIStats({
            clientId: user!.id,
            aiId: selectedAIId,
            fromDate: fromDate!,
            toDate: toDate!
          }),
          getDashboardKPIStats({
            clientId: user!.id,
            aiId: selectedAIId,
            fromDate: prevFromDate!,
            toDate: prevToDate!
          }),
          getUserSegmentDistribution(user!.id, selectedAIId, fromDate!, toDate!)
        ]);
        setKpiStats({ 
          totalMessages: kpi.totalMessages,
          totalConversations: kpi.totalConversations,
          totalLeads: kpi.totalLeads,
          avgConversationDuration: kpi.avgConversationDuration,
          trendMessages: kpi.totalMessages - (prevKpi?.totalMessages ?? 0),
          trendConversations: kpi.totalConversations - (prevKpi?.totalConversations ?? 0),
          trendLeads: kpi.totalLeads - (prevKpi?.totalLeads ?? 0),
          trendDuration: kpi.avgConversationDuration - (prevKpi?.avgConversationDuration ?? 0)
        });
        setFeedbackStats(feedback);
        let rows: DashboardMessageSummary[] = [];
        let uniqueLeads = 0;
        if (selectedAIId === "__all__") {
          // Aggregate all AIs
          const allRows = await Promise.all(
            ais.map((ai: any) => getDashboardMessageSummary(user!.id, ai.id, fromDate, toDate))
          );
          // Per-day aggregation for charts
          const byDay: { [day: string]: DashboardMessageSummary } = {};
          allRows.flat().forEach((row: DashboardMessageSummary) => {
            if (!byDay[row.day]) {
              byDay[row.day] = { ...row };
            } else {
              byDay[row.day] = {
                ...row,
                message_count: (byDay[row.day].message_count || 0) + (row.message_count || 0),
                conversation_count: (byDay[row.day].conversation_count || 0) + (row.conversation_count || 0),
                new_leads: (byDay[row.day].new_leads || 0) + (row.new_leads || 0),
                total_leads: (byDay[row.day].total_leads || 0) + (row.total_leads || 0),
                avg_conversation_duration: ((byDay[row.day].avg_conversation_duration || 0) + (row.avg_conversation_duration || 0)) / 2,
              }
            }
          });
          rows = Object.values(byDay).sort((a, b) => a.day.localeCompare(b.day));
          // For leaderboard: get consistent stats for each AI using getDashboardKPIStats
          // This ensures the lead counts match the KPI cards and funnel
          const aiTotals = await Promise.all(ais.map(async (ai: any) => {
            // Use getDashboardKPIStats for each AI to get consistent lead counts
            const aiKpiStats = await getDashboardKPIStats({
              clientId: user!.id,
              aiId: ai.id,
              fromDate: fromDate!,
              toDate: toDate!
            });
            return {
              aiId: ai.id,
              aiName: ai.label || ai.ai_name || ai.id,
              message_count: aiKpiStats.totalMessages,
              conversation_count: aiKpiStats.totalConversations,
              new_leads: aiKpiStats.totalLeads, // Use totalLeads for consistency
            };
          }));
          setAISummaryRows(aiTotals);
          // For 'All AIs', sum unique leads for each AI (not deduplicated across AIs)
          const allCounts = await Promise.all(
            ais.map((ai: any) => getUniqueLeadsForPeriod(user!.id, ai.id, fromDate!, toDate!))
          );
          uniqueLeads = allCounts.reduce((sum: number, n: number) => sum + n, 0);
          // Previous period unique leads
          const prevAllCounts = await Promise.all(
            ais.map((ai: any) => getUniqueLeadsForPeriod(user!.id, ai.id, prevFromDate!, prevToDate!))
          );
          setPrevUniqueLeadsCount(prevAllCounts.reduce((sum: number, n: number) => sum + n, 0));
        } else {
          rows = await getDashboardMessageSummary(user!.id, selectedAIId, fromDate, toDate)
          // For leaderboard: single AI - use the same kpiStats object
          // This ensures the lead counts match the KPI cards and funnel
          setAISummaryRows([
            {
              aiId: selectedAIId,
              aiName: ais.find((ai: any) => ai.id === selectedAIId)?.label || ais.find((ai: any) => ai.id === selectedAIId)?.ai_name || selectedAIId,
              message_count: kpi.totalMessages, // Use kpi values for consistency
              conversation_count: kpi.totalConversations, // Use kpi values for consistency
              new_leads: kpi.totalLeads, // Use kpi totalLeads for consistency
            }
          ]);
          uniqueLeads = await getUniqueLeadsForPeriod(user!.id, selectedAIId, fromDate!, toDate!);
          // Previous period unique leads for single AI
          setPrevUniqueLeadsCount(await getUniqueLeadsForPeriod(user!.id, selectedAIId, prevFromDate!, prevToDate!));
        }
        setSummaryRows(rows)
        setUniqueLeadsCount(uniqueLeads)
        setUserSegment(segment);
        // Fetch funnel data for new funnel chart
        const funnel = await getFunnelData(user!.id, selectedAIId, fromDate!, toDate!);
        setFunnelData(funnel);
      } catch {
        setSummaryRows([])
        setUniqueLeadsCount(0)
        setFunnelData(null)
      } finally {
        setLoading(false)
      }
    }
    if (user && ais.length > 0) {
      fetchAnalytics();
    }
  }, [user, ais, period, selectedAIId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] w-full">
        {/* Simple, clean loading spinner */}
        <div className="relative h-24 w-24 flex items-center justify-center">
          {/* Outer loading circle */}
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          
          {/* Loading progress - semi-circle that animates */}
          <div className="absolute inset-0 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin-slow"></div>
          
          {/* Inner circle with company brand color */}
          <div className="h-4 w-4 bg-blue-500 rounded-full"></div>
        </div>
        
        {/* Simple loading text */}
        <div className="mt-8 text-base font-medium text-gray-600">
          <p>Loading analytics dashboard</p>
        </div>
      </div>
    );
  }

  // Data shaping for charts from summaryRows
  const conversationsByWeekday = groupByWeekday(summaryRows, "conversation_count");
  const messagesByWeekday = groupByWeekday(summaryRows, "message_count");
  const newLeadsByWeekday = groupByWeekday(summaryRows, "new_leads");

  return (
    <div className="min-h-screen bg-white">
      <Header title="Analytics" />
      {/* Filter Bar: AI Selector + Period Tabs */}
      <div className="flex flex-wrap justify-center items-center gap-4 bg-white rounded-lg shadow px-4 py-3 mb-6">
        {ais.length > 0 && (
          <select
            className="border rounded px-3 py-2 text-sm"
            value={selectedAIId}
            onChange={e => setSelectedAIId(e.target.value)}
          >
            <option value="__all__">All AIs (Client Level)</option>
            {ais.map((ai: any) => (
              <option key={ai.id} value={ai.id}>{ai.label || ai.ai_name || ai.id}</option>
            ))}
          </select>
        )}
        <Tabs defaultValue={period} value={period} onValueChange={(v) => setPeriod(v as 'day' | 'week' | 'month')}>
          <TabsList>
            <TabsTrigger value="day">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="mx-auto py-8 max-w-2xl md:max-w-3xl xl:max-w-5xl 2xl:max-w-7xl">
        <KPISection
          totalMessages={kpiStats?.totalMessages || 0}
          totalConversations={kpiStats?.totalConversations || 0}
          totalLeads={kpiStats?.totalLeads || 0}
          avgConversationDuration={kpiStats?.avgConversationDuration || 0}
          period={period}
          goodChats={feedbackStats.up}
          badChats={feedbackStats.down}
          trendMessages={kpiStats?.trendMessages}
          trendConversations={kpiStats?.trendConversations}
          trendLeads={kpiStats?.trendLeads}
          trendDuration={kpiStats?.trendDuration}
        />

        {/* --- Crawl Analytics Card (after KPIs) --- */}
        <div className="my-8">
        <CrawlAnalyticsCard
          totalPagesCrawled={crawlAnalytics.totalPagesCrawled}
          filesIndexed={crawlAnalytics.filesIndexed}
          urlsCrawled={crawlAnalytics.urlsCrawled}
          loading={crawlAnalytics.loading}
          aiId={selectedAIId === "__all__" ? (ais[0]?.id ?? "") : selectedAIId}
          urlToAiMap={crawlAnalytics.urlToAiMap}
          onUrlsRemoved={async () => {
            // Call the same function that's used in the useEffect
            const fetchData = async () => {
              // Update business info and refresh crawl analytics
              if (selectedAIId === "__all__") {
                // Refresh all AIs data
                const mod = await import("@/lib/supabase");
                const aiIds = ais.map(ai => ai.id).filter(Boolean) as string[];
                const infos = await Promise.all(aiIds.map(id => mod.getBusinessInfo(id)));
                
                let totalPagesCrawled = 0;
                let filesIndexed = 0;
                let urlsSet = new Set<string>();
                let urlToAiMap: Record<string, string> = {};
                
                for (const info of infos) {
                  if (!info || !info.id) continue;
                  totalPagesCrawled += Number(info.total_pages_crawled) || 0;
                  filesIndexed += Number(info.files_indexed) || 0;
                  let urls: string[] = Array.isArray(info.urls_crawled)
                    ? info.urls_crawled
                    : (typeof info.urls_crawled === "string" && info.urls_crawled.startsWith("[")
                        ? JSON.parse(info.urls_crawled)
                        : []);
                        
                  // Add URLs to set and map each URL to this AI's ID
                  urls.forEach((u: string) => {
                    urlsSet.add(u);
                    urlToAiMap[u] = info.id; // Map URL to AI ID
                  });
                }
                
                setCrawlAnalytics({
                  totalPagesCrawled,
                  filesIndexed,
                  urlsCrawled: Array.from(urlsSet),
                  urlToAiMap,
                  loading: false,
                });
              } else if (selectedAIId) {
                // Refresh single AI data
                const mod = await import("@/lib/supabase");
                const info = await mod.getBusinessInfo(selectedAIId);
                
                // For single AI, all URLs belong to this AI
                const urls = Array.isArray(info?.urls_crawled)
                  ? info.urls_crawled
                  : (typeof info?.urls_crawled === "string" && info?.urls_crawled.startsWith("[")
                      ? JSON.parse(info.urls_crawled)
                      : []);
                
                // Create a mapping where all URLs map to this AI ID
                const urlToAiMap: Record<string, string> = {};
                urls.forEach((url: string) => urlToAiMap[url] = selectedAIId);
                
                setCrawlAnalytics({
                  totalPagesCrawled: info?.total_pages_crawled ?? 0,
                  filesIndexed: info?.files_indexed ?? 0,
                  urlsCrawled: urls,
                  urlToAiMap,
                  loading: false,
                });
              }
            };
            
            await fetchData();
            toast.success("Selected URLs removed and knowledge base updated.");
          }}
        />
      </div>
        
        {/* Pie Charts Side by Side */}
        <div className="flex flex-col lg:flex-row gap-8 justify-center items-stretch mb-8">
          <div className="flex-1 min-w-[280px]">
            <ConversationDurationPieChart
              durations={summaryRows
                .map(row => row.avg_conversation_duration)
                .filter((d): d is number => typeof d === 'number' && !isNaN(d))
              }
            />
          </div>
          <div className="flex-1 min-w-[280px]">
            {userSegment && (
              <UserSegmentPieChart
                data={[
                  { label: "New Users", value: userSegment.newUsers, color: SEGMENT_COLORS[0] },
                  { label: "Returning Users", value: userSegment.returningUsers, color: SEGMENT_COLORS[1] },
                ]}
              />
            )}
          </div>
        </div>
      {/* --- Modular Time Series Chart --- */}
      <TimeSeriesChart
        data={summaryRows.map((row) => ({
          day: row.day.slice(0, 10),
          messages: row.message_count,
          conversations: row.conversation_count,
        }))}
        series={[
          { key: "messages", label: "Messages", color: "#0ea5e9" },
          { key: "conversations", label: "Conversations", color: "#16a34a" },
        ]}
        title="Messages & Conversations Over Time"
        description="Trends for messages and conversations by day in the selected period."
      />

      {/* --- Funnel Chart for Conversion --- */}
      <FunnelChart
        stages={[
          { label: "Conversations Started", value: funnelData?.startedCount ?? 0, color: "#0ea5e9" },
          { label: "Engaged Conversations", value: funnelData?.engagedCount ?? 0, color: "#16a34a" },
          { label: "Leads (Unique)", value: funnelData?.leadsCount ?? 0, color: "#f59e42" }
        ]}
        title="Conversation Engagement Funnel"
        description="See how many conversations become engaged and convert to unique leads in the selected period."
      />

      {/* --- Leaderboard Table for AIs by Conversations --- */}
      <LeaderboardTable
        rows={aiSummaryRows
          .map((row, idx) => ({
            rank: idx + 1,
            name: row.aiName,
            subtitle: row.aiId,
            value: row.message_count,
            extra1: row.conversation_count,
            extra2: row.new_leads,
          }))
          .sort((a, b) => b.value - a.value)
          .map((row, idx) => ({ ...row, rank: idx + 1 }))}
        title="AI Leaderboard"
        description="Top AIs by total messages, conversations, and leads in the selected period."
        valueLabel="Messages"
        extra1Label="Conversations"
        extra2Label="Leads"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Conversations by Weekday */}
        <Card>
          <CardHeader>
            <CardTitle>Conversations by Weekday</CardTitle>
            <CardDescription>Total conversations started on each weekday</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversationsByWeekday} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="weekdayConvoBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="weekday" tick={{ fontWeight: 600 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="url(#weekdayConvoBar)" radius={[8, 8, 0, 0]} name="Conversations" isAnimationActive />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Messages by Weekday */}
        <Card>
          <CardHeader>
            <CardTitle>Messages by Weekday</CardTitle>
            <CardDescription>Total messages sent on each weekday</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={messagesByWeekday} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="weekdayMsgBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="weekday" tick={{ fontWeight: 600 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="url(#weekdayMsgBar)" radius={[8, 8, 0, 0]} name="Messages" isAnimationActive />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* New Leads by Weekday */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>New Leads by Weekday</CardTitle>
            <CardDescription>Number of new leads acquired on each weekday</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={newLeadsByWeekday} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="weekdayLeadsBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e42" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e42" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="weekday" tick={{ fontWeight: 600 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="url(#weekdayLeadsBar)" radius={[8, 8, 0, 0]} name="New Leads" isAnimationActive />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      {/* --- New Analytics Charts Row --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Avg Messages Per Conversation by Day */}
        <Card>
          <CardHeader>
            <CardTitle>Avg Messages Per Conversation</CardTitle>
            <CardDescription>Average number of messages per conversation by day</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summaryRows.map(row => ({ day: row.day, avg: row.avg_messages_per_conversation }))} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={true} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avg" stroke="#0ea5e9" name="Avg Msgs/Conversation" dot />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Avg Messages Per Lead by Day */}
        <Card>
          <CardHeader>
            <CardTitle>Avg Messages Per Lead</CardTitle>
            <CardDescription>Average number of messages per lead by day</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summaryRows.map(row => ({ day: row.day, avg: row.avg_messages_per_lead }))} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={true} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avg" stroke="#f59e42" name="Avg Msgs/Lead" dot />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Conversation Duration (min/avg/max) by Day */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Conversation Duration by Day</CardTitle>
            <CardDescription>Min, Avg, and Max conversation duration (minutes) by day</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summaryRows.map(row => ({ day: row.day, min: row.min_conversation_duration, avg: row.avg_conversation_duration, max: row.max_conversation_duration }))} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={true} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="min" stroke="#22c55e" name="Min Duration" dot />
                <Line type="monotone" dataKey="avg" stroke="#0ea5e9" name="Avg Duration" dot />
                <Line type="monotone" dataKey="max" stroke="#ef4444" name="Max Duration" dot />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Enhanced Lead Acquisition Trend (Area Chart) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Lead Acquisition Trend</CardTitle>
            <CardDescription>New leads acquired each day (area chart)</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summaryRows.map(row => ({ day: row.day, newLeads: row.new_leads }))} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNewLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={true} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="newLeads" stroke="#16a34a" fillOpacity={1} fill="url(#colorNewLeads)" name="New Leads" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      {/* End max-w container */}
      </div>
    </div>
  );
}
