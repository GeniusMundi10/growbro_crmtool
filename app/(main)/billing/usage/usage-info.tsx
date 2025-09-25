"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { ChevronLeft, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { useUser } from "@/context/UserContext"
import { Shimmer } from "@/components/ui/shimmer"
import { format } from "date-fns"

export default function UsageInfo() {
  const router = useRouter()
  const { user } = useUser()
  
  // Get current month and year for default selection
  const currentDate = new Date()
  const currentMonthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentDate)
  const currentYear = currentDate.getFullYear().toString()
  
  const [month, setMonth] = useState(currentMonthName)
  const [year, setYear] = useState(currentYear)
  const [usageData, setUsageData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scope, setScope] = useState<'month' | 'all'>('month')
  
  // Function to fetch usage data based on month and year
  const fetchUsageData = async () => {
    if (!user?.id) return
    
    setLoading(true)
    setError(null)
    
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!, 
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      // Build base query
      let query = supabase
        .from('dashboard_message_summary')
        .select('ai_name, message_count')
        .eq('client_id', user.id)

      // Apply date filters if scope is month
      if (scope === 'month') {
        const monthNumber = new Date(Date.parse(`${month} 1, ${year}`)).getMonth() + 1
        const startDateString = format(new Date(parseInt(year), monthNumber - 1, 1), 'yyyy-MM-dd')
        const endDateString = format(new Date(parseInt(year), monthNumber, 0), 'yyyy-MM-dd')
        console.log(`Fetching data for ${month} ${year}, date range:`, startDateString, 'to', endDateString)
        query = query.gte('day', startDateString).lte('day', endDateString)
      } else {
        console.log('Fetching all-time usage data')
      }

      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching usage data:', error)
        setError('Failed to load usage data. Please try again.')
        setLoading(false)
        return
      }
      
      console.log('Raw data from Supabase:', data)
      
      // Process the data to group by ai_name and sum message counts
      const processedData: Record<string, { chatMessages: number, voiceMinutes: number, totalMinutes: number }> = {}
      
      if (data && data.length > 0) {
        data.forEach(item => {
          const aiName = item.ai_name || 'Unknown Agent'
          const messageCount = Number(item.message_count) || 0
          
          if (!processedData[aiName]) {
            processedData[aiName] = {
              chatMessages: 0,
              voiceMinutes: 0,
              totalMinutes: 0
            }
          }
          
          processedData[aiName].chatMessages += messageCount
          // Voice minutes is 0 by default
          processedData[aiName].totalMinutes = processedData[aiName].chatMessages + processedData[aiName].voiceMinutes
        })
      }
      
      // Convert to array format for display
      const formattedData = Object.entries(processedData).map(([agentName, stats]) => ({
        agentName,
        chatMessages: stats.chatMessages,
        voiceMinutes: stats.voiceMinutes,
        totalMinutes: stats.totalMinutes
      }))
      
      console.log('Processed usage data:', formattedData)
      setUsageData(formattedData)
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }
  
  // Fetch data when component mounts or filters change
  useEffect(() => {
    fetchUsageData()
  }, [month, year, scope, user?.id])

  // Generate months for dropdown
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  
  // Generate years (current year and 2 previous years)
  // Note: We're using the currentYear we defined earlier at the top of the component
  const years = [
    currentYear, 
    (parseInt(currentYear) - 1).toString(), 
    (parseInt(currentYear) - 2).toString()
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="flex items-center gap-1" 
          onClick={() => router.push("/billing")}
        >
          <ChevronLeft size={16} />
          Go Back
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <Select value={scope} onValueChange={(v) => setScope(v as any)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All-time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={month} onValueChange={setMonth} disabled={scope === 'all'}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={year} onValueChange={setYear} disabled={scope === 'all'}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="py-4">
                <Shimmer className="h-4 w-28 mb-2" />
                <Shimmer className="h-7 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="shadow-none border">
            <CardContent className="py-4">
              <div className="text-xs text-muted-foreground">{scope === 'month' ? 'Chat Messages (this month)' : 'Chat Messages (all-time)'}</div>
              <div className="text-xl font-semibold">{usageData.reduce((s, x) => s + (x.chatMessages || 0), 0)}</div>
            </CardContent>
          </Card>
          <Card className="shadow-none border">
            <CardContent className="py-4">
              <div className="text-xs text-muted-foreground">{scope === 'month' ? 'Voice Minutes (this month)' : 'Voice Minutes (all-time)'}</div>
              <div className="text-xl font-semibold">{usageData.reduce((s, x) => s + (x.voiceMinutes || 0), 0)}</div>
            </CardContent>
          </Card>
          <Card className="shadow-none border">
            <CardContent className="py-4">
              <div className="text-xs text-muted-foreground">Active Agents</div>
              <div className="text-xl font-semibold">{usageData.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-green-600 text-white">
              <TableRow>
                <TableHead className="text-white font-semibold">Agent Name</TableHead>
                <TableHead className="text-white font-semibold">Chat Messages</TableHead>
                <TableHead className="text-white font-semibold">Voice Messages</TableHead>
                <TableHead className="text-white font-semibold">Total Messages</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading usage data...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-red-500 py-8">{error}</TableCell>
                </TableRow>
              ) : usageData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    No usage data found for this period
                  </TableCell>
                </TableRow>
              ) : (
                usageData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.agentName}</TableCell>
                    <TableCell>{item.chatMessages}</TableCell>
                    <TableCell>{item.voiceMinutes}</TableCell>
                    <TableCell>{item.totalMinutes}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
