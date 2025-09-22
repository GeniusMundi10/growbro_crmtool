"use client"

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Download, Mail, MessageCircle, Clock, User, Phone, AtSign, Calendar, Bot, MoreVertical, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format, parseISO } from "date-fns";

function ConversationViewer({ chat, onBack }: { chat: any; onBack?: () => void }) {
  const { user } = useUser();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    async function fetchMessages() {
      if (!chat?.chat_id) {
        setLoading(false);
        return;
      }
      
      const trimmedId = typeof chat.chat_id === 'string' ? chat.chat_id.trim() : chat.chat_id;
      
      const { data, error } = await (await import("@/lib/supabase")).supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", trimmedId)
        .eq("client_id", user?.id)
        .order("timestamp", { ascending: true });
      
      if (!error && data) setMessages(data);
      setLoading(false);
    }
    fetchMessages();
  }, [chat, user?.id]);

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600 mb-2">Select a conversation</p>
          <p className="text-sm text-gray-500">Choose a chat from the list to view the conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Conversation Header */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Mobile back button */}
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden p-2"
                onClick={onBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-blue-100 text-blue-600">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-lg">{chat.name || "Anonymous Visitor"}</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <Bot className="h-3 w-3 mr-1" />
                  {chat.ai_name}
                </span>
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(parseISO(chat.date), "MMM dd, yyyy")}
                </span>
                <span className="flex items-center">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  {chat.messages_count} messages
                </span>
              </div>
            </div>
          </div>
          
          {/* Contact Info Pills */}
          <div className="flex items-center space-x-2">
            {chat.email && chat.email !== "Anonymous" && (
              <Badge variant="secondary" className="text-xs">
                <AtSign className="h-3 w-3 mr-1" />
                {chat.email}
              </Badge>
            )}
            {chat.phone && chat.phone !== "Anonymous" && (
              <Badge variant="secondary" className="text-xs">
                <Phone className="h-3 w-3 mr-1" />
                {chat.phone}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading conversation...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-600 mb-2">No messages found</p>
              <p className="text-sm text-gray-500">This conversation doesn&apos;t have any messages yet</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={msg.id} className={`flex ${msg.sender === "bot" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  msg.sender === "bot" 
                    ? "bg-gray-100 text-gray-900" 
                    : "bg-blue-600 text-white"
                }`}>
                  <div className="whitespace-pre-line text-sm leading-relaxed">{msg.content}</div>
                  <div className={`text-xs mt-2 ${msg.sender === "bot" ? "text-gray-500" : "text-blue-200"}`}>
                    {msg.timestamp ? format(new Date(msg.timestamp), "HH:mm") : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Conversation Info Footer */}
      <div className="border-t bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Conversation ID: {chat.chat_id}</span>
          <span>Duration: {chat.duration}</span>
        </div>
      </div>
    </div>
  );
}

function ChatListItem({ chat, isSelected, onClick, onDownload, onEmailSummary, sendingSummaryId }: {
  chat: any;
  isSelected: boolean;
  onClick: () => void;
  onDownload: () => void;
  onEmailSummary: () => void;
  sendingSummaryId: string | null;
}) {
  return (
    <div
      className={`p-4 border-b cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
        isSelected ? "bg-blue-50 border-r-4 border-r-blue-600" : "hover:bg-gray-50"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                {chat.name && chat.name !== "Anonymous" ? chat.name.charAt(0).toUpperCase() : "A"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="font-medium text-gray-900 truncate">
                  {chat.name || "Anonymous Visitor"}
                </p>
                <Badge variant="outline" className="text-xs flex items-center">
                  <Bot className="h-3 w-3 mr-1" />
                  {chat.ai_name}
                </Badge>
              </div>
              <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(parseISO(chat.date), "MMM dd")}
                </span>
                <span className="flex items-center">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  {chat.messages_count}
                </span>
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {chat.duration}
                </span>
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="flex items-center space-x-2 mb-2">
            {chat.email && chat.email !== "Anonymous" && (
              <Badge variant="secondary" className="text-xs">
                <AtSign className="h-3 w-3 mr-1" />
                {chat.email.length > 20 ? `${chat.email.substring(0, 20)}...` : chat.email}
              </Badge>
            )}
            {chat.phone && chat.phone !== "Anonymous" && (
              <Badge variant="secondary" className="text-xs">
                <Phone className="h-3 w-3 mr-1" />
                {chat.phone}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-60 hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload(); }}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onEmailSummary(); }}
              disabled={sendingSummaryId === chat.chat_id}
            >
              {sendingSummaryId === chat.chat_id ? (
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-gray-300 border-t-blue-600 rounded-full" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Email Summary
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function ChatHistoryPage() {
  const [sendingSummaryId, setSendingSummaryId] = useState<string | null>(null);

  async function sendSummaryEmail(chat: any) {
    setSendingSummaryId(chat.chat_id);
    try {
      const response = await fetch("https://growbro-backend.fly.dev/api/conversation/summary-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: chat.chat_id,
          ai_id: chat.ai_id || chat.aiId || chat.aiID // fallback for various naming
        })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        alert(`Summary email for conversation ${chat.chat_id} sent successfully!`);
      } else {
        alert(`Failed to send summary email for conversation ${chat.chat_id}: ${result.error || 'Unknown error'}`);
      }
    } catch (e) {
      alert(`Failed to send summary email for conversation ${chat.chat_id}: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setSendingSummaryId(null);
    }
  }
  const { user, loading: userLoading } = useUser();
  const [aiOptions, setAIOptions] = useState<{ value: string; label: string }[]>([{ value: "all", label: "All AI" }]);
  const [chats, setChats] = useState<any[]>([]);
  const [aiFilter, setAIFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [loading, setLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);

  // Move fetchChats inside useEffect to fix dependency issue
  useEffect(() => {
    async function fetchChats() {
      if (!user?.id) return;
      setLoading(true);
      let query = (await import("@/lib/supabase")).supabase.from("chat_history").select("*").eq("client_id", user.id).order("date", { ascending: false });
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

    if (!userLoading && user?.id) {
      fetchChats();
    }
  }, [aiFilter, dateRange.from, dateRange.to, userLoading, user]);

  useEffect(() => {
    async function fetchAIs() {
      if (!user || !user.id) return;
      const { data, error } = await (await import("@/lib/supabase")).supabase
        .from("chat_history")
        .select("ai_name")
        .eq("client_id", user.id)
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
  }, [user]);


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
      
      {/* Filters Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Chat History</h1>
          <div className="text-sm text-gray-500">
            {chats.length} conversations
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* AI Filter */}
          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-sm font-medium">AI:</span>
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
            <span className="text-gray-600 text-sm font-medium">From:</span>
            <Input
              type="date"
              value={dateRange.from}
              onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-[140px]"
            />
            <span className="text-gray-600 text-sm font-medium">To:</span>
            <Input
              type="date"
              value={dateRange.to}
              onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-[140px]"
            />
          </div>
        </div>
      </div>

      {/* Two-Pane Layout */}
      <div className="flex h-[calc(100vh-140px)]">
        {/* Chat List Pane */}
        <div className={`${selectedChat ? "hidden lg:flex lg:w-1/3" : "flex w-full lg:w-1/3"} border-r bg-white flex-col`}>
          <div className="p-4 border-b bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                className="pl-10"
                // Add search functionality later if needed
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading conversations...</p>
                </div>
              </div>
            ) : chats.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-600 mb-2">No conversations found</p>
                  <p className="text-sm text-gray-500">Try adjusting your filters</p>
                </div>
              </div>
            ) : (
              <div className="divide-y">
                {chats.map((chat) => (
                  <ChatListItem
                    key={chat.chat_id}
                    chat={chat}
                    isSelected={selectedChat?.chat_id === chat.chat_id}
                    onClick={() => setSelectedChat(chat)}
                    onDownload={() => handleDownload(chat.chat_id)}
                    onEmailSummary={() => sendSummaryEmail(chat)}
                    sendingSummaryId={sendingSummaryId}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Conversation View Pane */}
        <div className={`${selectedChat ? "flex w-full lg:w-2/3" : "hidden lg:flex lg:w-2/3"} flex-col`}>
          <ConversationViewer 
            chat={selectedChat} 
            onBack={() => setSelectedChat(null)}
          />
        </div>
      </div>
    </div>
  )
}
