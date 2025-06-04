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
      
      // Convert month name to month number (1-12)
      const monthNumber = new Date(Date.parse(`${month} 1, ${year}`)).getMonth() + 1
      
      // Format start and end dates for the selected month
      const startDate = new Date(parseInt(year), monthNumber - 1, 1)
      const endDate = new Date(parseInt(year), monthNumber, 0) // Last day of the month
      
      console.log(`Fetching data for ${month} ${year}, date range:`, startDate, 'to', endDate)
      
      // Query to get data filtered by client_id and month/year
      const { data, error } = await supabase
        .from('dashboard_message_summary')
        .select('ai_name, message_count')
        .eq('client_id', user.id)
        .gte('day', startDate.toISOString())
        .lte('day', endDate.toISOString())
      
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
  }, [month, year, user?.id])

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
          <Select value={month} onValueChange={setMonth}>
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
          <Select value={year} onValueChange={setYear}>
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
