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
  Legend
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
  const [period, setPeriod] = useState<"week" | "month">("week")
  const [summaryRows, setSummaryRows] = useState<DashboardMessageSummary[]>([])

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        if (currentUser) {
          // For now, just use the first AI for this user
          // You may want to support multiple AIs in the future
          const ais = await getAIsForUser(currentUser.id)
          if (ais && ais.length > 0) {
            const aiId = ais[0].id
            const rows = await getDashboardMessageSummary(aiId)
            setSummaryRows(rows)
          } else {
            setSummaryRows([])
          }
        }
      } catch (error) {
        setSummaryRows([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [period])

  if (loading) {
    return <div className="p-6 text-center">Loading analytics...</div>
  }

  // Data shaping for charts from summaryRows
  // Bar chart: messages by day
  const messagesByDay = summaryRows.map((row: DashboardMessageSummary) => ({ day: row.day.slice(0, 10), count: row.message_count }))
  const conversationsByDay = summaryRows.map((row: DashboardMessageSummary) => ({ day: row.day.slice(0, 10), count: row.conversation_count }))
  const newLeadsByDay = summaryRows.map((row: DashboardMessageSummary) => ({ day: row.day.slice(0, 10), count: row.new_leads }))

  // Stat cards (latest day)
  const latest = summaryRows.length > 0 ? summaryRows[summaryRows.length - 1] : null
      convoMap[day] = (convoMap[day] || 0) + 1
    })
    leads.forEach(lead => {
      const day = days[new Date(lead.created_at).getDay()]
      leadMap[day] = (leadMap[day] || 0) + 1
    })
    return days.map(day => ({
      day,
      rate: convoMap[day] ? Math.round((100 * (leadMap[day] || 0)) / convoMap[day]) : 0
    }))
  })()

  return (
    <div className="min-h-screen bg-white">
      <Header title="Analytics" />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          
          <Tabs defaultValue="week" value={period} onValueChange={(v) => setPeriod(v as "day" | "week" | "month")}>
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
              <CardDescription>Total Conversations</CardDescription>
              <CardTitle className="text-3xl">{analytics.total_conversations}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-500">
                <MessageSquare className="h-4 w-4 mr-1" />
                <span>+12% from last {period}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Messages</CardDescription>
              <CardTitle className="text-3xl">{analytics.total_messages}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-500">
                <MessageSquare className="h-4 w-4 mr-1" />
                <span>+8% from last {period}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Leads</CardDescription>
              <CardTitle className="text-3xl">{analytics.total_leads}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-500">
                <Users className="h-4 w-4 mr-1" />
                <span>+15% from last {period}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg. Conversation Length</CardDescription>
              <CardTitle className="text-3xl">{analytics.avg_conversation_length} min</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                <span>-2% from last {period}</span>
              </div>
            </CardContent>
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
                  data={sampleConversationsByDay}
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
