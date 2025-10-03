"use client"

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
import { siWhatsapp } from 'simple-icons';

// WhatsApp brand icon component
const WhatsAppIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg">
    <path d={siWhatsapp.path} fill="#25D366" />
  </svg>
);

// Helper to check if conversation is from WhatsApp
const isWhatsAppConversation = (chat: any, messages: any[] = []) => {
  // Check if any message has message_type === 'whatsapp'
  if (messages.length > 0 && messages.some((m: any) => m.message_type === 'whatsapp')) {
    return true;
  }
  // Check if phone number exists and no email (WhatsApp users typically don't have email)
  if (chat?.phone && chat.phone !== 'Anonymous' && (!chat?.email || chat.email === 'Anonymous')) {
    return true;
  }
  return false;
};

function ConversationViewer({ chat, onBack, onEmailSummary, sendingSummaryId }: { chat: any; onBack?: () => void; onEmailSummary?: (chat: any) => void; sendingSummaryId?: string | null }) {
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
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 rounded-tr-2xl">
        <div className="text-center max-w-md p-8">
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
              <MessageCircle className="h-12 w-12 text-blue-500" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <ArrowLeft className="h-4 w-4 text-white rotate-180" />
            </div>
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
            Select a conversation
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Choose a chat from the list to view the complete conversation history, 
            including all messages, timestamps, and customer details.
          </p>
          <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>Ready to view conversations</span>
          </div>
        </div>
      </div>
    );
  }

  const isWhatsApp = isWhatsAppConversation(chat, messages);

  return (
    <div className="flex-1 flex flex-col bg-white/95 backdrop-blur-sm rounded-tr-2xl shadow-xl border border-gray-200/50">
      {/* Premium Conversation Header */}
      <div className={`border-b border-gray-100 p-3 sm:p-6 ${isWhatsApp ? 'bg-gradient-to-r from-green-50/50 to-emerald-50/30' : 'bg-gradient-to-r from-white to-blue-50/30'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile back button */}
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                className={`lg:hidden p-2 rounded-xl transition-colors ${isWhatsApp ? 'hover:bg-green-100' : 'hover:bg-blue-100'}`}
                onClick={onBack}
              >
                <ArrowLeft className={`h-4 w-4 ${isWhatsApp ? 'text-green-600' : 'text-blue-600'}`} />
              </Button>
            )}
            <Avatar className={`h-10 w-10 sm:h-12 sm:w-12 shadow-lg ring-2 ${isWhatsApp ? 'ring-green-100' : 'ring-blue-100'}`}>
              <AvatarFallback className={`text-white font-semibold ${isWhatsApp ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-blue-500 to-purple-600'}`}>
                {chat.name && chat.name !== "Anonymous" ? chat.name.charAt(0).toUpperCase() : <User className="h-5 w-5 sm:h-6 sm:w-6" />}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-base sm:text-xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {chat.name || "Anonymous Visitor"}
                </h2>
                {isWhatsApp ? (
                  <Badge className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-1">
                    <WhatsAppIcon className="h-3 w-3" />
                    WhatsApp
                  </Badge>
                ) : (
                  <Badge className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    Website
                  </Badge>
                )}
              </div>
              <div className="flex items-center flex-wrap gap-2 text-xs sm:text-sm text-gray-600 mt-1">
                <span className={`flex items-center px-2 py-1 rounded-lg ${isWhatsApp ? 'bg-green-50' : 'bg-blue-50'}`}>
                  <Bot className={`h-3 w-3 mr-1 ${isWhatsApp ? 'text-green-600' : 'text-blue-600'}`} />
                  <span className={`font-medium ${isWhatsApp ? 'text-green-700' : 'text-blue-700'}`}>{chat.ai_name}</span>
                </span>
                {isWhatsApp && chat.phone && chat.phone !== 'Anonymous' && (
                  <span className="flex items-center px-2 py-1 bg-green-50 rounded-lg">
                    <Phone className="h-3 w-3 mr-1 text-green-600" />
                    <span className="font-medium text-green-700">{chat.phone}</span>
                  </span>
                )}
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1 text-emerald-600" />
                  <span className="font-medium">{format(parseISO(chat.date), "MMM dd, yyyy")}</span>
                </span>
                <span className="flex items-center">
                  <MessageCircle className="h-3 w-3 mr-1 text-purple-600" />
                  <span className="font-medium">{chat.messages_count} messages</span>
                </span>
              </div>
            </div>
          </div>
          
          {/* Premium Contact Info Pills + Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center flex-wrap gap-2">
              {chat.email && chat.email !== "Anonymous" && (
                <Badge className="bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200 px-2 sm:px-3 py-1 text-xs">
                  <AtSign className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">{chat.email.length > 25 ? `${chat.email.substring(0, 25)}...` : chat.email}</span>
                  <span className="sm:hidden">{chat.email.length > 15 ? `${chat.email.substring(0, 15)}...` : chat.email}</span>
                </Badge>
              )}
              {chat.phone && chat.phone !== "Anonymous" && !isWhatsApp && (
                <Badge className="bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border-orange-200 px-2 sm:px-3 py-1 text-xs">
                  <Phone className="h-3 w-3 mr-1" />
                  {chat.phone}
                </Badge>
              )}
            </div>
            <Button
              variant="default"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm text-xs sm:text-sm"
              onClick={() => onEmailSummary && onEmailSummary(chat)}
              disabled={sendingSummaryId === chat.chat_id}
            >
              {sendingSummaryId === chat.chat_id ? (
                <div className="animate-spin h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 border-2 border-white/60 border-t-white rounded-full" />
              ) : (
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              )}
              <span className="hidden sm:inline">Email Summary</span>
              <span className="sm:hidden">Email</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Premium Messages Area */}
      <div className="flex-1 bg-gradient-to-b from-blue-50/20 to-purple-50/20 relative overflow-hidden">
        <ScrollArea className="h-full p-3 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
                  <div className="absolute inset-0 rounded-full bg-blue-50 opacity-20 animate-pulse"></div>
                </div>
                <p className="text-gray-700 font-semibold text-lg">Loading conversation...</p>
                <p className="text-gray-500 text-sm mt-1">Fetching messages from the database</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <MessageCircle className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-xl font-bold text-gray-700 mb-2">No messages found</p>
                <p className="text-sm text-gray-500 max-w-sm">This conversation doesn&apos;t have any messages yet. Check back later or verify the conversation details.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {messages.map((msg, index) => {
                // Check if message is from bot using metadata or sender field
                const isBot = msg.metadata?.is_bot === true || msg.sender === "bot";
                
                return (
                  <div key={msg.id} className={`flex ${isBot ? "justify-start" : "justify-end"} group`}>
                    <div className={`max-w-[85%] sm:max-w-[75%] rounded-xl sm:rounded-2xl px-3 py-3 sm:px-5 sm:py-4 shadow-md hover:shadow-lg transition-all duration-200 ${
                      isBot
                        ? "bg-white border border-gray-100 text-gray-800 hover:border-blue-200" 
                        : "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-blue-200"
                    }`}>
                      <div className="whitespace-pre-line text-xs sm:text-sm leading-relaxed font-medium break-words">{msg.content}</div>
                      <div className={`text-[10px] sm:text-xs mt-2 sm:mt-3 flex items-center justify-between opacity-70 group-hover:opacity-100 transition-opacity ${
                        isBot ? "text-gray-500" : "text-blue-100"
                      }`}>
                        <span className="font-medium truncate mr-2">
                          {isBot ? chat.ai_name : "Customer"}
                        </span>
                        <span className="whitespace-nowrap">
                          {msg.timestamp ? format(new Date(msg.timestamp), "HH:mm") : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Premium Conversation Info Footer */}
      <div className="border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-gray-700">Conversation ID:</span>
              <span className="font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs">
                {chat.chat_id.split('-')[0]}...
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-gray-700">Duration:</span>
              <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                {chat.duration}
              </span>
            </div>
          </div>
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
  const isWhatsApp = isWhatsAppConversation(chat);
  
  return (
    <div
      className={`mx-1 sm:mx-2 mb-1 p-2.5 sm:p-4 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.01] sm:hover:scale-[1.02] hover:shadow-md ${
        isSelected 
          ? isWhatsApp
            ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg transform scale-[1.02]"
            : "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-[1.02]"
          : isWhatsApp
            ? "bg-white hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 border border-green-100"
            : "bg-white hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 border border-gray-100"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
            <Avatar className={`h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 shadow-md ${isSelected ? 'ring-2 ring-white/30' : isWhatsApp ? 'ring-2 ring-green-200' : ''}`}>
              <AvatarFallback className={`text-sm font-semibold ${
                isSelected 
                  ? "bg-white/20 text-white" 
                  : isWhatsApp
                    ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700"
                    : "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
              }`}>
                {chat.name && chat.name !== "Anonymous" ? chat.name.charAt(0).toUpperCase() : "A"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2 mb-1 flex-wrap">
                <p className={`text-sm sm:text-base font-semibold truncate ${isSelected ? "text-white" : "text-gray-900"}`}>
                  {chat.name || "Anonymous Visitor"}
                </p>
                {isWhatsApp ? (
                  <Badge 
                    variant={isSelected ? "secondary" : "outline"} 
                    className={`text-[10px] sm:text-xs flex items-center px-1.5 sm:px-2 py-0.5 ${
                      isSelected 
                        ? "bg-white/20 text-white border-white/30" 
                        : "bg-green-50 text-green-700 border-green-200"
                    }`}
                  >
                    <WhatsAppIcon className="h-3 w-3 mr-1" />
                    WhatsApp
                  </Badge>
                ) : (
                  <Badge 
                    variant={isSelected ? "secondary" : "outline"} 
                    className={`text-[10px] sm:text-xs flex items-center px-1.5 sm:px-2 py-0.5 ${
                      isSelected 
                        ? "bg-white/20 text-white border-white/30" 
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    <MessageCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                    <span className="hidden sm:inline">Website</span>
                    <span className="sm:hidden">Web</span>
                  </Badge>
                )}
                <Badge 
                  variant={isSelected ? "secondary" : "outline"} 
                  className={`text-[10px] sm:text-xs flex items-center px-1.5 sm:px-2 py-0.5 ${
                    isSelected 
                      ? "bg-white/20 text-white border-white/30" 
                      : isWhatsApp
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}
                >
                  <Bot className="h-3 w-3 mr-1" />
                  {chat.ai_name}
                </Badge>
              </div>
              <div className={`flex items-center space-x-2 sm:space-x-3 text-[10px] sm:text-xs ${isSelected ? "text-white/80" : "text-gray-500"}`}>
                <span className="flex items-center">
                  <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                  {format(parseISO(chat.date), "MMM dd")}
                </span>
                <span className="flex items-center">
                  <MessageCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                  {chat.messages_count}
                </span>
                <span className="flex items-center">
                  <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                  {chat.duration}
                </span>
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="flex items-center space-x-2 mb-2">
            {chat.email && chat.email !== "Anonymous" && (
              <Badge 
                variant="secondary" 
                className={`text-xs ${
                  isSelected 
                    ? "bg-white/15 text-white border-white/20" 
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                <AtSign className="h-3 w-3 mr-1" />
                {chat.email.length > 18 ? `${chat.email.substring(0, 18)}...` : chat.email}
              </Badge>
            )}
            {chat.phone && chat.phone !== "Anonymous" && (
              <Badge 
                variant="secondary" 
                className={`text-xs ${
                  isSelected 
                    ? "bg-white/15 text-white border-white/20" 
                    : isWhatsApp
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-orange-50 text-orange-700 border-orange-200"
                }`}
              >
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
              className={`h-8 w-8 p-0 rounded-lg transition-all duration-200 ${
                isSelected 
                  ? "hover:bg-white/20 text-white/80 hover:text-white" 
                  : "opacity-60 hover:opacity-100 hover:bg-gray-100"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onDownload(); }}
              className="hover:bg-blue-50 focus:bg-blue-50"
            >
              <Download className="h-4 w-4 mr-2 text-blue-600" />
              <span className="font-medium">Download</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onEmailSummary(); }}
              disabled={sendingSummaryId === chat.chat_id}
              className="hover:bg-purple-50 focus:bg-purple-50"
            >
              {sendingSummaryId === chat.chat_id ? (
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-gray-300 border-t-purple-600 rounded-full" />
              ) : (
                <Mail className="h-4 w-4 mr-2 text-purple-600" />
              )}
              <span className="font-medium">Email Summary</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function ChatHistoryPage() {
  const { user, loading: userLoading } = useUser();
  const [sendingSummaryId, setSendingSummaryId] = useState<string | null>(null);
  const [aiOptions, setAIOptions] = useState<{ value: string; label: string }[]>([{ value: "all", label: "All AI" }]);
  const [chats, setChats] = useState<any[]>([]);
  const [aiFilter, setAIFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [loading, setLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const searchParams = useSearchParams();
  const deepLinkChatId = searchParams.get('chatId');

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

  // Deep link: select chat by chatId from URL when chats are loaded
  useEffect(() => {
    if (!deepLinkChatId || !chats || chats.length === 0) return;
    const target = chats.find((c) => (c.chat_id || '').trim() === deepLinkChatId.trim());
    if (target) setSelectedChat(target);
  }, [deepLinkChatId, chats]);

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

  const sendSummaryEmail = async (chat: any) => {
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
      <Header 
        title="Chat History" 
        description="Manage and review all customer conversations"
        showTitleInHeader={false}
      />
      
      {/* Smooth Filters Section */}
      <div className="bg-white px-3 sm:px-6 py-4 sm:py-8 border-b border-slate-100">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center space-x-3">
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <span className="text-xs sm:text-sm font-medium text-blue-700">
                {chats.length} conversations
              </span>
            </div>
          </div>
        </div>

        {/* Smooth Filters */}
        <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 bg-slate-50/50 rounded-2xl border border-slate-200/50">
          {/* AI Filter */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg">
              <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
            </div>
            <span className="text-gray-700 text-xs sm:text-sm font-semibold">AI Agent:</span>
            <Select value={aiFilter} onValueChange={setAIFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white border-gray-200 shadow-sm hover:border-blue-300 transition-colors">
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-emerald-100 rounded-lg">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
              </div>
              <span className="text-gray-700 text-xs sm:text-sm font-semibold">From:</span>
              <Input
                type="date"
                value={dateRange.from}
                onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
                className="flex-1 sm:w-[140px] bg-white border-gray-200 shadow-sm hover:border-emerald-300 transition-colors text-xs sm:text-sm"
              />
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <span className="text-gray-700 text-xs sm:text-sm font-semibold sm:ml-0 ml-11">To:</span>
              <Input
                type="date"
                value={dateRange.to}
                onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
                className="flex-1 sm:w-[140px] bg-white border-gray-200 shadow-sm hover:border-emerald-300 transition-colors text-xs sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Elegant Two-Pane Layout */}
      <div className="flex h-[calc(100vh-280px)] sm:h-[calc(100vh-240px)] lg:h-[calc(100vh-200px)] gap-2 sm:gap-4 px-2 sm:px-6">
        {/* Smooth Chat List Pane */}
        <div className={`${selectedChat ? "hidden lg:flex lg:w-1/3 xl:w-2/5" : "flex w-full lg:w-1/3 xl:w-2/5"} bg-white flex-col rounded-xl sm:rounded-2xl shadow-sm border border-slate-200`}>
          {/* Clean Search Header */}
          <div className="p-3 sm:p-6 border-b border-slate-100 bg-slate-50/30">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                placeholder="Search conversations..."
                className="pl-10 sm:pl-11 h-9 sm:h-11 text-sm sm:text-base bg-white/80 border-gray-200 shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-200 rounded-lg sm:rounded-xl"
                // Add search functionality later if needed
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
                    <div className="absolute inset-0 rounded-full bg-blue-50 opacity-20 animate-pulse"></div>
                  </div>
                  <p className="text-gray-600 font-medium">Loading conversations...</p>
                  <p className="text-gray-400 text-sm mt-1">Please wait while we fetch your data</p>
                </div>
              </div>
            ) : chats.length === 0 ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-700 mb-2">No conversations found</p>
                  <p className="text-sm text-gray-500 max-w-xs">Try adjusting your filters or check back later for new conversations</p>
                </div>
              </div>
            ) : (
              <div className="p-2 space-y-1">
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

        {/* Smooth Conversation View Pane */}
        <div className={`flex-col ${selectedChat ? "flex w-full lg:w-2/3 xl:w-3/5" : "hidden lg:flex lg:w-2/3 xl:w-3/5"}`}>
          <ConversationViewer 
            chat={selectedChat} 
            onBack={() => setSelectedChat(null)}
            onEmailSummary={(chat) => sendSummaryEmail(chat)}
            sendingSummaryId={sendingSummaryId}
          />
        </div>
      </div>
    </div>
  );
}
