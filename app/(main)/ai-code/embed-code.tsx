"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy } from "lucide-react"
import { toast } from "sonner"
import { getUserAIs } from "@/lib/supabase"
import { useUser } from "@/context/UserContext"

export default function EmbedCode() {
  const { user } = useUser()
  const searchParams = useSearchParams()
  const urlAiId = searchParams.get('aiId')
  
  const [selectedAI, setSelectedAI] = useState(urlAiId || "")
  const [aiOptions, setAIOptions] = useState<{ value: string, label: string }[]>([])
  const [copiedHtml, setCopiedHtml] = useState(false)
  const [copiedFrame, setCopiedFrame] = useState(false)
  const [loading, setLoading] = useState(true)

  // Generate code snippets with the selected AI ID
  const htmlCode = `<script defer src="https://chat.growbro.ai/growbroai-chatbot-bundle.js" data-id="${selectedAI}"></script>`
  const iframeCode = `<iframe src="https://chat.growbro.ai/?agentId=${selectedAI}" width="450px" height="650px"></iframe>`
  
  // Load user's AIs on component mount
  useEffect(() => {
    if (user) {
      loadUserAIs()
    }
  }, [user])
  
  // Fetch user's AIs from Supabase
  const loadUserAIs = async () => {
    try {
      setLoading(true)
      const ais = await getUserAIs(user?.id || "")
      if (ais && ais.length > 0) {
        const options = ais.map(ai => ({
          value: ai.id,
          label: ai.ai_name
        }))
        setAIOptions(options)
        
        // If no AI is selected yet, and we have options, select the first one
        if (!selectedAI && options.length > 0) {
          setSelectedAI(options[0].value)
        }
      }
    } catch (error) {
      console.error("Error loading user AIs:", error)
      toast.error("Could not load your AI assistants")
    } finally {
      setLoading(false)
    }
  }
  
  // Handle AI selection change
  const handleAIChange = (value: string) => {
    setSelectedAI(value)
  }

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(htmlCode)
    setCopiedHtml(true)
    setTimeout(() => setCopiedHtml(false), 2000)
  }

  const handleCopyFrame = () => {
    navigator.clipboard.writeText(iframeCode)
    setCopiedFrame(true)
    setTimeout(() => setCopiedFrame(false), 2000)
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="mb-6">
        <Select value={selectedAI} onValueChange={handleAIChange}>
          <SelectTrigger className={loading ? "opacity-50" : ""}>
            <SelectValue placeholder="Select AI" />
          </SelectTrigger>
          <SelectContent>
            {aiOptions.length > 0 ? (
              aiOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))
            ) : (
              <div className="py-2 px-2 text-sm text-gray-500">
                {loading ? "Loading..." : "No AIs available"}
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-8">
        <div className="flex items-center mb-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-green-700 text-white hover:bg-green-800"
            onClick={handleCopyHtml}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy HTML
          </Button>
        </div>
        <p className="mb-2">Copy and add the following script to your website html:</p>
        <Textarea value={htmlCode} readOnly className="font-mono text-sm h-24" />
      </div>

      <div className="mb-8">
        <div className="flex items-center mb-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-green-700 text-white hover:bg-green-800"
            onClick={handleCopyFrame}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy iframe
          </Button>
        </div>
        <p className="mb-2">Or use iframe if you want to embed to specific section:</p>
        <Textarea value={iframeCode} readOnly className="font-mono text-sm h-24" />
      </div>

      <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg border">
        {selectedAI ? (
          <div className="text-center">
            <div className="mb-4">Preview of your AI chatbot will appear here</div>
            <Button className="bg-green-600 hover:bg-green-700">Open Preview</Button>
          </div>
        ) : (
          <p className="text-gray-500">Please select an AI agent to preview.</p>
        )}
      </div>
    </div>
  )
}
