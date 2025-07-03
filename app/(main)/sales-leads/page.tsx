"use client"

// Add these export directives to prevent prerendering issues
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import React, { useState, useEffect } from "react"
import { useUser } from "@/context/UserContext"
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
// Remove direct Supabase imports
// import { getCurrentUser, getLeads, createLead } from "@/lib/supabase"
type LeadRow = {
  chat_id: string;
  ai_name: string;
  name: string | null;
  email: string | null;
  phone: string | null;
};

import { supabase } from "@/lib/supabase";

export default function SalesLeadsPage() {
  const { user, loading: userLoading } = useUser();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [aiOptions, setAIOptions] = useState<{ value: string; label: string }[]>([{ value: "all", label: "All AI" }]);
  const [aiFilter, setAIFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Memoized fetch function for use in both useEffect and refresh button
  const fetchLeadsAndAIs = React.useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("chat_history")
      .select("chat_id, ai_name, name, email, phone")
      .eq("user_id", user.id);

    // Debug: log both error and data
    if (error) {
      console.error("Supabase error:", error);
    }
    console.log("chat_history data:", data);

    if (error) {
      setLeads([]);
      setLoading(false);
      toast.error("Failed to load leads. Please try again later.");
      return;
    }
    const filtered = (data || []).filter((row: any) => row.name || row.email || row.phone);
    // Deduplicate leads by email (or phone if email is missing)
    const seen = new Set<string>();
    const deduped = filtered.filter((row: any) => {
      const key = row.email?.toLowerCase() || row.phone || row.chat_id;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    setLeads(deduped);
    const aiSet = new Set<string>();
    filtered.forEach((row: any) => {
      if (row.ai_name) aiSet.add(row.ai_name);
    });
    setAIOptions([{ value: "all", label: "All AI" }, ...Array.from(aiSet).map(ai => ({ value: ai, label: ai }))]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!userLoading && user?.id) {
      fetchLeadsAndAIs();
    }
  }, [fetchLeadsAndAIs, userLoading, user]);

  const filteredLeads = leads.filter(row => aiFilter === "all" || row.ai_name === aiFilter);

  if (loading) {
    return <div className="p-6 text-center">Loading leads...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header title="Sales Leads" />
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">Sales Leads</h1>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-gray-500">AI:</span>
              <select
                value={aiFilter}
                onChange={e => setAIFilter(e.target.value)}
                className="border rounded px-2 py-1"
                style={{ minWidth: 150 }}
              >
                {aiOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  // Export filteredLeads as CSV with correct columns and Excel compatibility
                  const csvRows = [
                    ["Visitor Name", "Email ID", "Phone Number"],
                    ...filteredLeads.map(l => [
                      l.name ?? "",
                      l.email ?? "",
                      l.phone ?? ""
                    ])
                  ];
                  // Proper CSV escaping and BOM for Excel
                  const escapeCSV = (v: string) => '"' + (v || '').replace(/"/g, '""') + '"';
                  const csvContent = '\uFEFF' + csvRows.map(row => row.map(escapeCSV).join(",")).join("\r\n");
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'sales_leads.csv';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="ml-4 px-3 py-1 border rounded bg-blue-500 hover:bg-blue-600 text-white text-sm"
                title="Export as CSV"
              >
                Export as CSV
              </button>
              <button
                onClick={() => {
                  setLoading(true);
                  // re-run fetchLeadsAndAIs
                  (async () => {
                    await fetchLeadsAndAIs();
                  })();
                }}
                className="ml-2 px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200 text-sm"
                disabled={loading}
                title="Refresh Leads"
              >
                &#x21bb; Refresh
              </button>
            </div>
          </div>
        </div>
        <div className="rounded-lg border shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visitor Name</TableHead>
                <TableHead>Email ID</TableHead>
                <TableHead>Phone Number</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                    No leads available.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.chat_id}>
                    <TableCell className="font-medium">{lead.name || "-"}</TableCell>
                    <TableCell>{lead.email || "-"}</TableCell>
                    <TableCell>{lead.phone || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
