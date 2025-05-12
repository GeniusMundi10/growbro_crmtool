"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  ChevronDown,
  Download,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import Header from "@/components/header"
import { getCurrentUser, getLeads, createLead } from "@/lib/supabase"
import type { Lead } from "@/lib/supabase"

export default function SalesLeadsPage() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddLeadDialog, setShowAddLeadDialog] = useState(false)
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "manual",
    status: "new",
    notes: ""
  })

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          toast.error("User not authenticated")
          return
        }
        
        setUser(currentUser)
        
        const fetchedLeads = await getLeads(currentUser.id)
        setLeads(fetchedLeads)
      } catch (error) {
        console.error("Error loading data:", error)
        toast.error("Failed to load leads")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddLead = async () => {
    if (!user) return
    
    try {
      if (!newLead.name || !newLead.email) {
        toast.error("Name and email are required")
        return
      }
      
      const result = await createLead({
        user_id: user.id,
        name: newLead.name,
        email: newLead.email,
        phone: newLead.phone,
        company: newLead.company,
        source: newLead.source,
        status: "new",
        notes: newLead.notes
      })
      
      if (result) {
        setLeads(prevLeads => [result, ...prevLeads])
        setShowAddLeadDialog(false)
        setNewLead({
          name: "",
          email: "",
          phone: "",
          company: "",
          source: "manual",
          status: "new",
          notes: ""
        })
        toast.success("Lead added successfully")
      }
    } catch (error) {
      console.error("Error adding lead:", error)
      toast.error("Failed to add lead")
    }
  }

  const handleRefresh = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const fetchedLeads = await getLeads(user.id)
      setLeads(fetchedLeads)
      toast.success("Leads refreshed")
    } catch (error) {
      console.error("Error refreshing leads:", error)
      toast.error("Failed to refresh leads")
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (leads.length === 0) {
      toast.error("No leads to export")
      return
    }
    
    try {
      // Create CSV content
      const headers = ["Name", "Email", "Phone", "Company", "Source", "Status", "Created Date"]
      const csvRows = [headers.join(",")]
      
      for (const lead of leads) {
        const row = [
          `"${lead.name}"`,
          `"${lead.email}"`,
          `"${lead.phone}"`,
          `"${lead.company}"`,
          `"${lead.source}"`,
          `"${lead.status}"`,
          `"${new Date(lead.created_at).toLocaleDateString()}"`
        ]
        csvRows.push(row.join(","))
      }
      
      const csvContent = csvRows.join("\n")
      
      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `growbro-leads-${new Date().toISOString().split("T")[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success("Leads exported successfully")
    } catch (error) {
      console.error("Error exporting leads:", error)
      toast.error("Failed to export leads")
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-800"
      case "contacted": return "bg-yellow-100 text-yellow-800"
      case "qualified": return "bg-green-100 text-green-800"
      case "proposal": return "bg-purple-100 text-purple-800"
      case "closed": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Loading leads...</div>
  }

  return (
    <div className="min-h-screen bg-white">
      <Header title="Sales Leads" />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">Sales Leads</h1>
          
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search leads..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleExportCSV}
              >
                <Download className="h-4 w-4" />
              </Button>
              
              <Dialog open={showAddLeadDialog} onOpenChange={setShowAddLeadDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-green-700 hover:bg-green-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lead
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Lead</DialogTitle>
                    <DialogDescription>
                      Enter the lead information. Required fields are marked with an asterisk (*).
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="name" className="text-right font-medium">
                        Name *
                      </label>
                      <Input
                        id="name"
                        className="col-span-3"
                        value={newLead.name}
                        onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="email" className="text-right font-medium">
                        Email *
                      </label>
                      <Input
                        id="email"
                        type="email"
                        className="col-span-3"
                        value={newLead.email}
                        onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="phone" className="text-right font-medium">
                        Phone
                      </label>
                      <Input
                        id="phone"
                        className="col-span-3"
                        value={newLead.phone}
                        onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="company" className="text-right font-medium">
                        Company
                      </label>
                      <Input
                        id="company"
                        className="col-span-3"
                        value={newLead.company}
                        onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="notes" className="text-right font-medium">
                        Notes
                      </label>
                      <Input
                        id="notes"
                        className="col-span-3"
                        value={newLead.notes}
                        onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddLeadDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="bg-green-700 hover:bg-green-800"
                      onClick={handleAddLead}
                    >
                      Add Lead
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
        
        <Separator className="mb-6" />
        
        <div className="rounded-lg border shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {searchQuery ? "No leads match your search" : "No leads available. Add your first lead!"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell>{lead.company}</TableCell>
                    <TableCell className="capitalize">{lead.source}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusBadgeColor(lead.status)}>
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            <span>Message</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <span>Edit Lead</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <span>Delete Lead</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
