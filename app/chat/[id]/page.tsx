"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Paperclip, Mic } from "lucide-react"
import { useChat } from "ai/react"

// Mock function to replace Supabase call
const mockGetChatHistory = async () => {
  return [
    {
      id: "mock-message-1",
      conversation_id: "conversation-123",
      role: "assistant",
      content: "Hello! How can I help you today?",
      created_at: new Date().toISOString()
    }
  ];
};

export default function ChatPage() {
  const { id } = useParams()
  const conversationId = Array.isArray(id) ? id[0] : id
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: isChatLoading,
  } = useChat({
    api: "/api/chat",
    body: {
      conversationId,
      userId: "current-user-id", // In a real app, get this from auth
    },
    initialMessages: [],
  })

  useEffect(() => {
    // Load chat history
    const loadChatHistory = async () => {
      setIsLoading(true)
      // Use mock function instead of real Supabase call
      const history = await mockGetChatHistory()
      // In a real app, you would set these as initialMessages for useChat
      setIsLoading(false)
    }

    loadChatHistory()
  }, [conversationId])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-purple-900 text-white p-4">
        <div className="container mx-auto flex items-center">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src="/placeholder.svg" alt="AI" />
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold">GrowBro Assistant</h1>
            <p className="text-sm text-purple-200">Online</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user" ? "bg-purple-600 text-white" : "bg-white border border-gray-200"
                  }`}
                >
                  <p>{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <Button type="button" size="icon" variant="ghost" className="rounded-full">
            <Paperclip className="h-5 w-5" />
          </Button>

          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 min-h-[60px] max-h-[200px] resize-none"
            rows={1}
          />

          <Button type="button" size="icon" variant="ghost" className="rounded-full">
            <Mic className="h-5 w-5" />
          </Button>

          <Button
            type="submit"
            size="icon"
            className="rounded-full bg-purple-600 hover:bg-purple-700"
            disabled={isChatLoading || !input.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}
