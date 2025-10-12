"use client"

// Static export compatible

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"
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
  name: string | null;
  email: string | null;
  phone: string | null;
  ai_name: string | null;
  ai_id?: string | null;
  end_user_id?: string;
  hubspot_synched?: boolean;
};

import { supabase } from "@/lib/supabase";

export default function SalesLeadsPage() {
  const { user, loading: userLoading } = useUser();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [aiOptions, setAIOptions] = useState<{ value: string; label: string }[]>([{ value: "all", label: "All AI" }]);
  const [aiFilter, setAIFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [hubspotConnectionByAi, setHubspotConnectionByAi] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");

  // Memoized fetch function for use in both useEffect and refresh button
  const fetchLeadsAndAIs = React.useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("chat_history")
      .select("name,email,phone,chat_id,ai_name,ai_id,end_user_id")
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

    // Step 2: Fetch hubspot_synched/contact_id for all unique end_user_ids
    const endUserIds = Array.from(new Set(deduped.map(l => l.end_user_id).filter(Boolean)));
    let endUserSyncMap: Record<string, { hubspot_synched?: boolean; hubspot_contact_id?: string }> = {};
    if (endUserIds.length > 0) {
      const { data: endUsers, error: endUserError } = await supabase
        .from("end_users")
        .select("id,hubspot_synched,hubspot_contact_id")
        .in("id", endUserIds);
      if (!endUserError && endUsers) {
        endUserSyncMap = Object.fromEntries(
          endUsers.map((eu: any) => [eu.id, { hubspot_synched: eu.hubspot_synched, hubspot_contact_id: eu.hubspot_contact_id }])
        );
      }
    }

    // Step 3: Merge sync status into leads
    const merged = deduped.map((lead: any) => ({
      ...lead,
      hubspot_synched: lead.end_user_id ? endUserSyncMap[lead.end_user_id]?.hubspot_synched : false,
      hubspot_contact_id: lead.end_user_id ? endUserSyncMap[lead.end_user_id]?.hubspot_contact_id : undefined,
    }));
    setLeads(merged);

    // Step 3b: Fetch per-AI HubSpot connection status so we can disable the Sync button appropriately
    try {
      const aiIdsForStatus = Array.from(new Set((merged || []).map((l: any) => l.ai_id).filter(Boolean)));
      if (aiIdsForStatus.length > 0) {
        const entries = await Promise.all(
          aiIdsForStatus.map(async (id: string) => {
            try {
              const res = await fetch(`/api/hubspot/status?ai_id=${encodeURIComponent(id)}`);
              const j = await res.json();
              return [id, !!j.connected] as const;
            } catch {
              return [id, false] as const;
            }
          })
        );
        setHubspotConnectionByAi(Object.fromEntries(entries));
      } else {
        setHubspotConnectionByAi({});
      }
    } catch {
      setHubspotConnectionByAi({});
    }

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

  const [hubspotConnected, setHubspotConnected] = useState<boolean | null>(null);

  useEffect(() => {
    // Check HubSpot connection status on mount
    (async () => {
      try {
        const res = await fetch("/api/hubspot/status");
        const data = await res.json();
        setHubspotConnected(!!data.connected);
      } catch (err) {
        setHubspotConnected(false);
      }
    })();
  }, []);

  const filteredLeads = leads.filter(row => aiFilter === "all" || row.ai_name === aiFilter);
  const searchedLeads = filteredLeads.filter((l) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (l.name || "").toLowerCase().includes(q) ||
      (l.email || "").toLowerCase().includes(q) ||
      (l.phone || "").toLowerCase().includes(q) ||
      (l.ai_name || "").toLowerCase().includes(q)
    );
  });
  const totalLeads = filteredLeads.length;
  const syncedCount = filteredLeads.filter((l) => !!l.hubspot_synched).length;
  const unsyncedCount = totalLeads - syncedCount;

  if (loading || hubspotConnected === null) {
    return <div className="p-6 text-center">Loading leads...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header 
        title="Sales Leads" 
        description="Qualified contacts captured by your AI assistants. Filter, export, and sync to HubSpot in one place."
        showTitleInHeader={false}
      />
      <TooltipProvider>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {hubspotConnected === false && (
              <Card className="border-yellow-200 bg-yellow-50/70">
                <CardContent className="py-4 flex flex-col md:flex-row items-center justify-between gap-3">
                  <div className="text-yellow-800 text-sm md:text-base font-medium">You are not connected to HubSpot. Connect your account to sync leads.</div>
                  <Button
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => (window.location.href = "/integrations")}
                  >
                    Connect HubSpot
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Leads</CardDescription>
                  <CardTitle className="text-2xl">{totalLeads}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Synced to HubSpot</CardDescription>
                  <CardTitle className="text-2xl text-emerald-600">{syncedCount}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Not Yet Synced</CardDescription>
                  <CardTitle className="text-2xl text-slate-700">{unsyncedCount}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Filters & Actions */}
            <Card className="shadow-sm">
              <CardContent className="py-4">
                <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Filter by AI:</span>
                      <Select value={aiFilter} onValueChange={(v) => setAIFilter(v)}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="All AI" />
                        </SelectTrigger>
                        <SelectContent>
                          {aiOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="relative">
                      <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search name, email, phone, AI"
                        className="w-[260px]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const csvRows = [
                              ["Visitor Name", "Email ID", "Phone Number"],
                              ...searchedLeads.map((l) => [l.name ?? "", l.email ?? "", l.phone ?? ""]),
                            ];
                            const escapeCSV = (v: string) => '"' + (v || '').replace(/"/g, '""') + '"';
                            const csvContent = '\uFEFF' + csvRows.map((row) => row.map(escapeCSV).join(",")).join("\r\n");
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
                        >
                          <Download className="h-4 w-4 mr-1" /> Export CSV ({searchedLeads.length})
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Export filtered results</TooltipContent>
                    </Tooltip>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loading}
                      onClick={() => {
                        setLoading(true);
                        (async () => { await fetchLeadsAndAIs(); })();
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leads Table */}
            <Card className="shadow-sm overflow-hidden">
              <CardHeader className="py-4">
                <CardTitle className="text-base">Leads</CardTitle>
                <CardDescription>Contacts captured from conversations</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="bg-white sticky top-0 z-10">Visitor Name</TableHead>
                        <TableHead className="bg-white sticky top-0 z-10">Email</TableHead>
                        <TableHead className="bg-white sticky top-0 z-10">Phone</TableHead>
                        <TableHead className="bg-white sticky top-0 z-10">AI</TableHead>
                        <TableHead className="bg-white sticky top-0 z-10">Status</TableHead>
                        <TableHead className="bg-white sticky top-0 z-10 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchedLeads.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                            No leads found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        searchedLeads.map((lead) => (
                          <TableRow key={lead.chat_id} className="hover:bg-slate-50/80 transition-colors">
                            <TableCell className="font-medium">{lead.name || "-"}</TableCell>
                            <TableCell>{lead.email || "-"}</TableCell>
                            <TableCell>{lead.phone || "-"}</TableCell>
                            <TableCell>
                              {lead.ai_name ? <Badge variant="outline">{lead.ai_name}</Badge> : "-"}
                            </TableCell>
                            <TableCell>
                              {lead.hubspot_synched ? (
                                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Synced</Badge>
                              ) : (
                                <Badge variant="secondary">Not synced</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Link href={`/chat-history?chatId=${encodeURIComponent(lead.chat_id)}`}>
                                  <Button variant="ghost" size="sm">
                                    <MessageSquare className="h-4 w-4 mr-1" /> View
                                  </Button>
                                </Link>
                                {!lead.hubspot_synched && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          disabled={!lead.ai_id || !hubspotConnectionByAi[lead.ai_id]}
                                          onClick={async () => {
                                            if (!lead.ai_id || !hubspotConnectionByAi[lead.ai_id]) {
                                              toast.error("Connect HubSpot for this AI in Integrations to enable syncing.");
                                              return;
                                            }
                                            if (!lead.end_user_id) {
                                              toast.error("This lead cannot be synced (missing user ID)");
                                              return;
                                            }
                                            try {
                                              const res = await fetch("/api/hubspot/sync-lead", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ leadId: lead.end_user_id, ai_id: lead.ai_id ?? null })
                                              });
                                              const data = await res.json();
                                              if (res.ok && data.success) {
                                                toast.success("Lead synced to HubSpot!");
                                              } else {
                                                toast.error(data.error || "Failed to sync lead to HubSpot");
                                              }
                                            } catch (err) {
                                              toast.error("Failed to sync lead to HubSpot");
                                            }
                                          }}
                                        >
                                          Sync to HubSpot
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {!lead.ai_id || !hubspotConnectionByAi[lead.ai_id]
                                        ? "Connect HubSpot for this AI in Integrations to enable syncing"
                                        : "Sync this lead to the connected HubSpot for this AI"}
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
