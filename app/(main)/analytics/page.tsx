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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Header from "@/components/header"
import { getCurrentUser } from "@/lib/auth";
import { getDashboardMessageSummary, DashboardMessageSummary, getAIsForUser, getUniqueLeadsForPeriod, getDashboardKPIStats } from "@/lib/supabase"
import KPISection from "./components/KPISection"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function AnalyticsPage() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week')
  const [summaryRows, setSummaryRows] = useState<DashboardMessageSummary[]>([])
  const [ais, setAIs] = useState<any[]>([])
  const [selectedAIId, setSelectedAIId] = useState<string>("__all__");
  const [uniqueLeadsCount, setUniqueLeadsCount] = useState<number>(0);
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
          // For 'All AIs', sum unique leads for each AI (not deduplicated across AIs)
          const allCounts = await Promise.all(
            ais.map((ai: any) => getUniqueLeadsForPeriod(ai.id, fromDate!, toDate!))
          );
          uniqueLeads = allCounts.reduce((sum: number, n: number) => sum + n, 0);
        } else {
          rows = await getDashboardMessageSummary(selectedAIId, fromDate, toDate)
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
}
