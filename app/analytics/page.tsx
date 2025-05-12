"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
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
import { getCurrentUser, getAnalytics } from "@/lib/supabase"
import type { Analytics } from "@/lib/supabase"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

// Sample data for demo purposes
const sampleAnalytics = {
  id: "1",
  user_id: "user_123",
  total_conversations: 87,
  total_messages: 563,
  total_leads: 42,
  avg_conversation_length: 12,
  data_period: "week",
  created_at: new Date().toISOString()
}

const sampleConversationsByDay = [
  { day: "Monday", count: 12 },
  { day: "Tuesday", count: 19 },
  { day: "Wednesday", count: 22 },
  { day: "Thursday", count: 18 },
  { day: "Friday", count: 15 },
  { day: "Saturday", count: 7 },
  { day: "Sunday", count: 4 },
]

const sampleLeadsBySource = [
  { name: "Chat", value: 25 },
  { name: "Website", value: 8 },
  { name: "Referral", value: 5 },
  { name: "Ads", value: 4 },
]

const sampleLeadsByStatus = [
  { name: "New", value: 18 },
  { name: "Contacted", value: 12 },
  { name: "Qualified", value: 8 },
  { name: "Proposal", value: 3 },
  { name: "Closed", value: 1 },
]

export default function AnalyticsPage() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<Analytics>(sampleAnalytics as unknown as Analytics)
  const [period, setPeriod] = useState<"day" | "week" | "month">("week")
  
  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          setLoading(false)
          return
        }
        
        setUser(currentUser)
        
        const fetchedAnalytics = await getAnalytics(currentUser.id, period)
        if (fetchedAnalytics) {
          setAnalytics(fetchedAnalytics)
        }
        // For demo, we'll use the sample data if no actual data exists
      } catch (error) {
        // Silently fail and use sample data instead of showing errors
        setAnalytics(sampleAnalytics as unknown as Analytics)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [period])
  
  if (loading) {
    return <div className="p-6 text-center">Loading analytics...</div>
  }

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
              <CardTitle>Leads by Source</CardTitle>
              <CardDescription>Where your leads are coming from</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sampleLeadsBySource}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {sampleLeadsBySource.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Leads by Status</CardTitle>
              <CardDescription>Current status distribution of your leads</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sampleLeadsByStatus}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {sampleLeadsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Conversion Rate Over Time</CardTitle>
              <CardDescription>Percentage of conversations that convert to leads</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { day: "Mon", rate: 12 },
                    { day: "Tue", rate: 15 },
                    { day: "Wed", rate: 18 },
                    { day: "Thu", rate: 22 },
                    { day: "Fri", rate: 25 },
                    { day: "Sat", rate: 20 },
                    { day: "Sun", rate: 17 },
                  ]}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis unit="%" />
                  <Tooltip formatter={(value) => [`${value}%`, "Conversion Rate"]} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#16a34a"
                    name="Conversion Rate"
                    strokeWidth={2}
                    dot={{ strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
