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
  const [selectedAIId, setSelectedAIId] = useState<string | null>(null)

  useEffect(() => {
    async function loadUserAndAIs() {
      setLoading(true)
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        if (currentUser) {
          const ais = await getAIsForUser(currentUser.id)
          setAIs(ais)
          if (ais && ais.length > 0 && !selectedAIId) {
            setSelectedAIId(ais[0].id)
          }
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
      if (!selectedAIId) return;
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
        const rows = await getDashboardMessageSummary(selectedAIId, fromDate, toDate)
        setSummaryRows(rows)
      } catch {
        setSummaryRows([])
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [selectedAIId, period])

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
          {ais.length > 1 && (
            <select
              className="border rounded px-3 py-2 text-sm"
              value={selectedAIId || ''}
              onChange={e => setSelectedAIId(e.target.value)}
            >
              {ais.map(ai => (
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
    </div>
  )
}
