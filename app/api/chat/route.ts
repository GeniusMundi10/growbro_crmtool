import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages, conversationId, userId } = await req.json()

    // Get business info for context
    const { data: businessInfo } = await supabase.from("business_info").select("*").eq("user_id", userId).single()

    // Create system message with business context
    const systemMessage = `You are an AI assistant for ${businessInfo?.company_name || "GrowBro.ai"}. 
    Your name is ${businessInfo?.ai_name || "GrowBro Assistant"}.
    You help with ${businessInfo?.agent_type?.replace("-", " ") || "customer support"}.
    Be professional, helpful, and concise in your responses.`

    // Stream the AI response
    const result = streamText({
      model: openai("gpt-4-turbo"),
      messages,
      system: systemMessage,
    })

    // Save message to database (in background)
    const latestUserMessage = messages[messages.length - 1]
    if (latestUserMessage.role === "user") {
      await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        role: "user",
        content: latestUserMessage.content,
      })
    }

    // When the stream completes, save the assistant's response
    result.text.then(async (assistantResponse) => {
      await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: assistantResponse,
      })
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Failed to process chat request" }, { status: 500 })
  }
}
