"use client"

// Add these export directives to prevent prerendering issues
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect } from "react"
import { toast } from "sonner"
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
import { getDashboardMessageSummary, DashboardMessageSummary, getAIsForUser, getUniqueLeadsForPeriod, getDashboardKPIStats } from "@/lib/supabase"
import KPISection from "./components/KPISection"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function AnalyticsPage() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [loading, setLoading] = useState(true)
  // Always default to 'week' filter, even on remount or navigation
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>(() => 'week')
  const [summaryRows, setSummaryRows] = useState<DashboardMessageSummary[]>([])
  const [ais, setAIs] = useState<any[]>([])
  const [selectedAIId, setSelectedAIId] = useState<string>("__all__");
  const [uniqueLeadsCount, setUniqueLeadsCount] = useState<number>(0);
  const [aiSummaryRows, setAISummaryRows] = useState<any[]>([]); // Per-AI totals for leaderboard
  const [kpiStats, setKpiStats] = useState<{
    totalMessages: number;
    totalConversations: number;
    totalLeads: number;
    avgConversationDuration: number;
  } | null>(null);

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
        const [kpi, prevKpi] = await Promise.all([
          getDashboardKPIStats({
            aiId: selectedAIId,
            fromDate: fromDate!,
            toDate: toDate!
          }),
          getDashboardKPIStats({
            aiId: selectedAIId,
            fromDate: prevFromDate!,
            toDate: prevToDate!
          })
        ])
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
        let rows: DashboardMessageSummary[] = [];
        let uniqueLeads = 0;
        if (selectedAIId === "__all__") {
          // Aggregate all AIs
          const allRows = await Promise.all(
            ais.map((ai: any) => getDashboardMessageSummary(ai.id, fromDate, toDate))
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
          // For leaderboard: aggregate per-AI totals
          const aiTotals = ais.map((ai: any, idx: number) => {
            const aiRows = allRows[idx] || [];
            return {
              aiId: ai.id,
              aiName: ai.label || ai.ai_name || ai.id,
              message_count: aiRows.reduce((sum: number, row: DashboardMessageSummary) => sum + (row.message_count || 0), 0),
              conversation_count: aiRows.reduce((sum: number, row: DashboardMessageSummary) => sum + (row.conversation_count || 0), 0),
              new_leads: aiRows.reduce((sum: number, row: DashboardMessageSummary) => sum + (row.new_leads || 0), 0),
            };
          });
          setAISummaryRows(aiTotals);
          // For 'All AIs', sum unique leads for each AI (not deduplicated across AIs)
          const allCounts = await Promise.all(
            ais.map((ai: any) => getUniqueLeadsForPeriod(ai.id, fromDate!, toDate!))
          );
          uniqueLeads = allCounts.reduce((sum: number, n: number) => sum + n, 0);
        } else {
          rows = await getDashboardMessageSummary(selectedAIId, fromDate, toDate)
          // For leaderboard: single AI
          setAISummaryRows([
            {
              aiId: selectedAIId,
              aiName: ais.find((ai: any) => ai.id === selectedAIId)?.label || ais.find((ai: any) => ai.id === selectedAIId)?.ai_name || selectedAIId,
              message_count: rows.reduce((sum: number, row: DashboardMessageSummary) => sum + (row.message_count || 0), 0),
              conversation_count: rows.reduce((sum: number, row: DashboardMessageSummary) => sum + (row.conversation_count || 0), 0),
              new_leads: rows.reduce((sum: number, row: DashboardMessageSummary) => sum + (row.new_leads || 0), 0),
            }
          ]);
          uniqueLeads = await getUniqueLeadsForPeriod(selectedAIId, fromDate!, toDate!);
        }
        setSummaryRows(rows)
        setUniqueLeadsCount(uniqueLeads)
      } catch {
        setSummaryRows([])
        setUniqueLeadsCount(0)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [selectedAIId, period])
  if (loading) {
    return <div className="p-6 text-center">Loading analytics...</div>;
  }

  // Data shaping for charts from summaryRows
  const messagesByDay = summaryRows.map((row: DashboardMessageSummary) => ({ day: row.day.slice(0, 10), count: row.message_count }));
  const conversationsByDay = summaryRows.map((row: DashboardMessageSummary) => ({ day: row.day.slice(0, 10), count: row.conversation_count }));
  const newLeadsByDay = summaryRows.map((row: DashboardMessageSummary) => ({ day: row.day.slice(0, 10), count: row.new_leads }));

  return (
    <div className="min-h-screen bg-white">
      <Header title="Analytics" />
      <div className="container mx-auto py-8">
        <KPISection
          totalMessages={kpiStats?.totalMessages ?? 0}
          totalConversations={kpiStats?.totalConversations ?? 0}
          totalLeads={kpiStats?.totalLeads ?? 0}
          avgConversationDuration={kpiStats?.avgConversationDuration ?? 0}
          period={period}
          trendMessages={kpiStats?.trendMessages}
          trendConversations={kpiStats?.trendConversations}
          trendLeads={kpiStats?.trendLeads}
          trendDuration={kpiStats?.trendDuration}
        />
        {/* AI Selector Dropdown */}
        {ais.length > 0 && (
          <select
            className="border rounded px-3 py-2 text-sm mb-4"
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
          { label: "Messages", value: kpiStats?.totalMessages ?? 0, color: "#0ea5e9" },
          { label: "Conversations", value: kpiStats?.totalConversations ?? 0, color: "#16a34a" },
          { label: "Leads (Unique)", value: uniqueLeadsCount ?? 0, color: "#f59e42" }
        ]}
        title="Conversation Funnel"
        description="See how many messages lead to conversations and unique leads in the selected period."
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
        <Card>
          <CardHeader>
            <CardTitle>Conversations by Day</CardTitle>
            <CardDescription>Number of conversations started each day</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={conversationsByDay}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#16a34a" name="Conversations" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Messages by Day</CardTitle>
            <CardDescription>Number of messages sent each day</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={messagesByDay}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#16a34a" name="Messages" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>New Leads by Day</CardTitle>
            <CardDescription>Number of new leads each day</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={newLeadsByDay}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#16a34a" name="New Leads" />
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
    </div>
  );
}
