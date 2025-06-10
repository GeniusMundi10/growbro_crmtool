"use client"

// Add these export directives to prevent prerendering issues
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"
import { Calendar, Clock, MessageSquare, User, Users } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Header from "@/components/header"
import { getCurrentUser } from "@/lib/auth";
import { getDashboardMessageSummary, DashboardMessageSummary, getAIsForUser } from "@/lib/supabase"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function AnalyticsPage() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week')
  const [summaryRows, setSummaryRows] = useState<DashboardMessageSummary[]>([])
  const [ais, setAIs] = useState<any[]>([])
  const [selectedAIId, setSelectedAIId] = useState<string>("__all__");

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
    // Only run on mount
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    async function fetchAnalytics() {
      if (!ais) return;
      setLoading(true)
      try {
        // Compute fromDate and toDate based on period
        const now = new Date()
        let fromDate: string | undefined
        let toDate: string | undefined = now.toISOString().slice(0, 10)
        if (period === 'day') {
          fromDate = now.toISOString().slice(0, 10)
        } else if (period === 'week') {
          const weekAgo = new Date(now)
          weekAgo.setDate(now.getDate() - 6)
          fromDate = weekAgo.toISOString().slice(0, 10)
        } else if (period === 'month') {
          const monthAgo = new Date(now)
          monthAgo.setMonth(now.getMonth() - 1)
          fromDate = monthAgo.toISOString().slice(0, 10)
        }
        let rows: DashboardMessageSummary[] = [];
        if (selectedAIId === "__all__") {
          // Aggregate all AIs
          const allRows = await Promise.all(
            ais.map((ai: any) => getDashboardMessageSummary(ai.id, fromDate, toDate))
          );
          // Flatten and aggregate by day
          const byDay: { [day: string]: DashboardMessageSummary } = {};
          allRows.flat().forEach(row => {
            if (!byDay[row.day]) {
              byDay[row.day] = { ...row };
            } else {
              byDay[row.day] = {
                ...row,
                message_count: (byDay[row.day].message_count || 0) + (row.message_count || 0),
                conversation_count: (byDay[row.day].conversation_count || 0) + (row.conversation_count || 0),
                new_leads: (byDay[row.day].new_leads || 0) + (row.new_leads || 0),
                total_leads: (byDay[row.day].total_leads || 0) + (row.total_leads || 0),
                avg_conversation_duration: ((byDay[row.day].avg_conversation_duration || 0) + (row.avg_conversation_duration || 0)) / 2, // simple avg
              }
            }
          });
          rows = Object.values(byDay).sort((a, b) => a.day.localeCompare(b.day));
        } else {
          rows = await getDashboardMessageSummary(selectedAIId, fromDate, toDate)
        }
        setSummaryRows(rows)
      } catch {
        setSummaryRows([])
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [selectedAIId, period, ais])

  if (loading) {
    return <div className="p-6 text-center">Loading analytics...</div>
  }

  // Data shaping for charts from summaryRows
  // Bar chart: messages by day
  const messagesByDay = summaryRows.map((row: DashboardMessageSummary) => ({ day: row.day.slice(0, 10), count: row.message_count }))
  const conversationsByDay = summaryRows.map((row: DashboardMessageSummary) => ({ day: row.day.slice(0, 10), count: row.conversation_count }))
  const newLeadsByDay = summaryRows.map((row: DashboardMessageSummary) => ({ day: row.day.slice(0, 10), count: row.new_leads }))

  // Stat cards (latest day)
  const latest = summaryRows.length > 0 ? summaryRows[summaryRows.length - 1] : null;

  return (
    <div className="min-h-screen bg-white">
      <Header title="Analytics" />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>

          {/* AI Selector Dropdown */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Conversations (period)</CardDescription>
              <CardTitle className="text-3xl">{summaryRows.reduce((sum, row) => sum + (row.conversation_count || 0), 0)}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Messages (period)</CardDescription>
              <CardTitle className="text-3xl">{summaryRows.reduce((sum, row) => sum + (row.message_count || 0), 0)}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Leads (unique, period)</CardDescription>
              <CardTitle className="text-3xl">{[...new Set(summaryRows.flatMap(row => row.total_leads ? [row.total_leads] : []))].reduce((a, b) => a + b, 0)}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg. Conversation Duration (min, period)</CardDescription>
              <CardTitle className="text-3xl">{summaryRows.length > 0 ? (summaryRows.reduce((sum, row) => sum + (row.avg_conversation_duration || 0), 0) / summaryRows.length).toFixed(1) : 0} min</CardTitle>
            </CardHeader>
          </Card>
        </div>
        
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
  )
}

