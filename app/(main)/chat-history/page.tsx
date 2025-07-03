"use client"

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Download, Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO, isWithinInterval } from "date-fns";

function ConversationViewer({ chat, onClose }: { chat: any, onClose: () => void }) {
  const { user } = useUser();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    async function fetchMessages() {
      if (!chat?.chat_id) return;
      
      const trimmedId = typeof chat.chat_id === 'string' ? chat.chat_id.trim() : chat.chat_id;
      
      const { data, error } = await (await import("@/lib/supabase")).supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", trimmedId)
        .eq("user_id", user?.id)
        .order("timestamp", { ascending: true });
      
      
      if (!error && data) setMessages(data);
      setLoading(false);
    }
    fetchMessages();
  }, [chat]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative">
        <button className="absolute left-4 top-4 text-sm text-blue-600 hover:underline" onClick={onClose}>&larr; Go Back</button>
        <h2 className="text-xl font-bold mb-4 text-center">Conversation</h2>
        <div className="text-xs text-center text-gray-400 mb-2">conversation_id: {chat.chat_id}</div>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No messages found.</div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "bot" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[70%] p-4 rounded-lg shadow-sm ${msg.sender === "bot" ? "bg-blue-50 text-blue-900" : "bg-gray-100 text-gray-800"}`}>
                  <div className="text-xs font-bold mb-1">{msg.sender === "bot" ? chat.ai_name : "Client"}</div>
                  <div className="whitespace-pre-line">{msg.content}</div>
                  <div className="text-[10px] text-gray-400 mt-2">{msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ""}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatHistoryPage() {
  const { user, loading: userLoading } = useUser();
  const [aiOptions, setAIOptions] = useState<{ value: string; label: string }[]>([{ value: "all", label: "All AI" }]);
  const [chats, setChats] = useState<any[]>([]);
  const [aiFilter, setAIFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [loading, setLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);

  useEffect(() => {
    if (!userLoading && user?.id) {
      fetchChats();
    }
    // eslint-disable-next-line
  }, [aiFilter, dateRange.from, dateRange.to, userLoading, user]);

  useEffect(() => {
    async function fetchAIs() {
      const { data, error } = await (await import("@/lib/supabase")).supabase
        .from("chat_history")
        .select("ai_name")
        .neq("ai_name", null);
      if (!error && data) {
        const uniqueNames = Array.from(new Set(data.map((row: any) => row.ai_name))).filter(Boolean);
        setAIOptions([
          { value: "all", label: "All AI" },
          ...uniqueNames.map((name) => ({ value: name, label: name })),
        ]);
      }
    }
    fetchAIs();
  }, []);

  async function fetchChats() {
    if (!user?.id) return;
    setLoading(true);
    let query = (await import("@/lib/supabase")).supabase.from("chat_history").select("*").eq("user_id", user.id).order("date", { ascending: false });
    if (aiFilter !== "all") {
      query = query.eq("ai_name", aiFilter);
    }
    if (dateRange.from) {
      query = query.gte("date", dateRange.from);
    }
    if (dateRange.to) {
      query = query.lte("date", dateRange.to);
    }
    const { data, error } = await query;
    if (!error) setChats(data || []);
    setLoading(false);
  }

  const handleView = (chatId: string) => {
    const chat = chats.find((c) => c.chat_id === chatId);
    setSelectedChat(chat);
  };

  const handleDownload = async (chatId: string) => {
    const chat = chats.find((c) => c.chat_id === chatId);
    if (!chat) return;
    // Fetch messages for this chat
    const { data: messages, error } = await (await import("@/lib/supabase")).supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", chatId)
      .order("timestamp", { ascending: true });
    if (error) {
      alert("Failed to fetch conversation messages.");
      return;
    }
    if (!messages || messages.length === 0) {
      alert("No messages found for this conversation.");
      return;
    }
    // Format messages as plain text
    const lines = messages.map((msg: any) => {
      const sender = msg.sender === "bot" ? chat.ai_name : "Client";
      const time = msg.timestamp ? ` [${msg.timestamp}]` : "";
      return `${sender}${time}: ${msg.content}`;
    });
    const text = lines.join("\n\n");
    // Download as txt file
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversation_${chatId}.txt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header title="Chat History" />
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Chat History</h1>
        </div>

        {selectedChat && (
          <ConversationViewer chat={selectedChat} onClose={() => setSelectedChat(null)} />
        )}

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* AI Filter */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500">AI:</span>
            <Select value={aiFilter} onValueChange={setAIFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select AI" />
              </SelectTrigger>
              <SelectContent>
                {aiOptions.map((ai) => (
                  <SelectItem key={ai.value} value={ai.value}>{ai.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500">From:</span>
            <Input
              type="date"
              value={dateRange.from}
              onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-[140px]"
            />
            <span className="text-gray-500">To:</span>
            <Input
              type="date"
              value={dateRange.to}
              onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-[140px]"
            />
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chat ID</TableHead>
                <TableHead>AI Name</TableHead>
                <TableHead>Visitor Name</TableHead>
                <TableHead>Email ID</TableHead>
                <TableHead>Phone No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Messages Count</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : chats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No chat history found.
                  </TableCell>
                </TableRow>
              ) : (
                chats.map((chat) => (
                  <TableRow key={chat.chat_id}>
                    <TableCell>{chat.chat_id}</TableCell>
                    <TableCell>{chat.ai_name}</TableCell>
                    <TableCell className="font-medium">{chat.name ? chat.name : "Anonymous"}</TableCell>
                    <TableCell>{chat.email ? chat.email : "Anonymous"}</TableCell>
                    <TableCell>{chat.phone ? chat.phone : "Anonymous"}</TableCell>
                    <TableCell>{format(parseISO(chat.date), "yyyy-MM-dd")}</TableCell>
                    <TableCell>{chat.duration}</TableCell>
                    <TableCell>{chat.messages_count}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleView(chat.chat_id)} title="View Conversation">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded"
                        title="Download Conversation"
                        onClick={() => handleDownload(chat.chat_id)}
                      >
                        <Download className="w-4 h-4" />
                      </button>
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
