"use client"

// Add these export directives to prevent prerendering issues
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// Remove direct Supabase imports
// import { getCurrentUser, getBusinessInfo, saveMessage, getChatHistory } from "@/lib/supabase"
import type { ChatMessage, BusinessInfo } from "@/lib/supabase"

// Mock data and functions to replace Supabase calls
const mockUser = { id: "demo-user-123" };

const mockBusinessInfo = {
  id: "mock-business-info-id",
  user_id: "demo-user-123",
  ai_name: "GrowBro Assistant",
  company_name: "GrowBro Technologies",
  website: "https://example.com",
  email: "contact@example.com",
  calendar_link: "https://calendar.example.com",
  phone_number: "555-123-4567",
  agent_type: "information-education",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const mockGetCurrentUser = async () => {
  return mockUser;
};

const mockGetBusinessInfo = async () => {
  return mockBusinessInfo;
};

const mockGetChatHistory = async () => {
  return [
    {
      id: "welcome",
      conversation_id: "conversation-123",
      role: "assistant" as const,
      content: `Hello! I'm the AI assistant for ${mockBusinessInfo.company_name}. How can I help you today?`,
      created_at: new Date().toISOString()
    }
  ];
};

// OpenAI API will be simulated for demo purposes
const simulateAIResponse = async (message: string, businessInfo: Partial<BusinessInfo>) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800))
  
  const responses = [
    `Thanks for reaching out to ${businessInfo.company_name || 'our company'}! How can I help you today?`,
    `I'd be happy to tell you more about our services at ${businessInfo.company_name || 'our company'}.`,
    `That's a great question! Based on what you're looking for, I think we have several options that might work for you.`,
    `Would you like to schedule a call with our team? I can help you set that up.`,
    `I understand your needs. Let me suggest a few solutions we offer.`
  ]
  
  // Pick a random response
  return responses[Math.floor(Math.random() * responses.length)]
}

export default function ChatPage() {
  const searchParams = useSearchParams()
  const conversationId = searchParams.get("id") || "new"
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [businessInfo, setBusinessInfo] = useState<Partial<BusinessInfo>>({})
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [visitorInfo, setVisitorInfo] = useState({
    name: "John Doe",
    email: "johndoe@example.com",
    phone: ""
  })
  
  useEffect(() => {
    async function loadData() {
      try {
        // Use mock functions instead of real Supabase calls
        const currentUser = await mockGetCurrentUser()
        if (!currentUser) {
          toast.error("User not authenticated")
          return
        }
        
        setUser(currentUser)
        
        const info = await mockGetBusinessInfo()
        if (info) {
          setBusinessInfo(info)
        }
        
        if (conversationId !== "new") {
          const chatHistory = await mockGetChatHistory()
          setMessages(chatHistory)
        } else {
          // If it's a new conversation, add a welcome message
          const welcomeMessage = {
            id: "welcome",
            conversation_id: "new",
            role: "assistant" as const,
            content: `Hello! I'm the AI assistant for ${info?.company_name || 'this company'}. How can I help you today?`,
            created_at: new Date().toISOString()
          }
          setMessages([welcomeMessage])
        }
      } catch (error) {
        console.error("Error loading data:", error)
        toast.error("Failed to load chat information")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [conversationId])
  
  useEffect(() => {
    // Scroll to bottom whenever messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user) return
    
    setSending(true)
    
    try {
      // Add user message to UI
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        role: "user",
        content: inputMessage,
        created_at: new Date().toISOString()
      }
      
      setMessages(prevMessages => [...prevMessages, userMessage])
      setInputMessage("")
      
      // No need to save to Supabase in demo
      
      // Simulate AI response
      const aiResponse = await simulateAIResponse(inputMessage, businessInfo)
      
      // Add AI response to UI
      const assistantMessage: ChatMessage = {
        id: `temp-${Date.now() + 1}`,
        conversation_id: conversationId,
        role: "assistant",
        content: aiResponse,
        created_at: new Date().toISOString()
      }
      
      setMessages(prevMessages => [...prevMessages, assistantMessage])
      
      // No need to save to Supabase in demo
      
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Loading chat...</div>
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col h-full">
        <header className="bg-green-700 text-white p-4">
          <h1 className="text-xl font-bold">Chat with {businessInfo.ai_name || "AI Assistant"}</h1>
        </header>
        
        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          {messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`mb-4 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src="/ai-avatar.png" alt="AI" />
                  <AvatarFallback className="bg-green-700 text-white">AI</AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={`max-w-3/4 rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-green-700 text-white"
                    : "bg-white text-gray-800 border border-gray-200"
                }`}
              >
                {message.content}
              </div>
              
              {message.role === "user" && (
                <Avatar className="h-8 w-8 ml-2">
                  <AvatarImage src="/user-avatar.png" alt="User" />
                  <AvatarFallback className="bg-gray-500 text-white">U</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 border-t">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Textarea
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                className="min-h-[80px] resize-none"
              />
            </div>
            <Button 
              className="bg-green-700 hover:bg-green-800"
              onClick={handleSendMessage}
              disabled={sending || !inputMessage.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="w-80 border-l bg-white p-4 hidden md:block">
        <h2 className="text-lg font-semibold mb-4">Visitor Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Name</label>
            <Input 
              value={visitorInfo.name} 
              onChange={(e) => setVisitorInfo(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <Input 
              value={visitorInfo.email} 
              onChange={(e) => setVisitorInfo(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">Phone</label>
            <Input 
              value={visitorInfo.phone} 
              onChange={(e) => setVisitorInfo(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          
          <Separator className="my-6" />
          
          <div>
            <h3 className="text-sm font-medium mb-2">Quick Responses</h3>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm" 
                onClick={() => setInputMessage("Tell me more about your services.")}
              >
                Tell me more about your services
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm" 
                onClick={() => setInputMessage("I'd like to schedule a demo.")}
              >
                I'd like to schedule a demo
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm" 
                onClick={() => setInputMessage("What are your pricing options?")}
              >
                What are your pricing options?
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 