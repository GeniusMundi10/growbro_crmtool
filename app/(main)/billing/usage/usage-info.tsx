"use client"

import { useState } from "react"
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
import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function UsageInfo() {
  const router = useRouter()
  const [month, setMonth] = useState("June")
  const [year, setYear] = useState("2025")
  
  // Mock data - in a real app, this would come from an API call
  const usageData = [
    {
      agentName: "growbro.bot",
      chatMessages: 2,
      voiceMinutes: 0,
      totalMinutes: 2
    }
  ]

  // Generate months for dropdown
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  
  // Generate years (current year and 2 previous years)
  const currentYear = new Date().getFullYear()
  const years = [currentYear.toString(), (currentYear - 1).toString(), (currentYear - 2).toString()]

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
                <TableHead className="text-white font-semibold">Voice Minutes</TableHead>
                <TableHead className="text-white font-semibold">Total Minutes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usageData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.agentName}</TableCell>
                  <TableCell>{item.chatMessages}</TableCell>
                  <TableCell>{item.voiceMinutes}</TableCell>
                  <TableCell>{item.totalMinutes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
