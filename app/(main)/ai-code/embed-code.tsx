"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, X, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { getUserAIs } from "@/lib/supabase"
import { useUser } from "@/context/UserContext"

// Component that uses searchParams wrapped in Suspense
function EmbedCodeContent() {
  const { user } = useUser()
  const searchParams = useSearchParams()
  const urlAiId = searchParams.get('aiId')
  
  const [selectedAI, setSelectedAI] = useState(urlAiId || "")
  const [aiOptions, setAIOptions] = useState<{ value: string, label: string }[]>([])
  const [copiedHtml, setCopiedHtml] = useState(false)
  const [copiedFrame, setCopiedFrame] = useState(false)
  const [loading, setLoading] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Generate code snippets with the selected AI ID
  const htmlCode = `<script defer src="https://growbro-chatbox-widget.vercel.app/assets/chatbox-widget-bundle.js" data-ai-id="${selectedAI}"></script>`
  const iframeCode = `<iframe src="https://growbro-chatbox-widget.vercel.app/iframe.html?agentId=${selectedAI}" width="450" height="650"></iframe>`
  
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
    // Reset preview key to force iframe refresh when AI changes
    if (previewOpen) {
      setPreviewKey(prev => prev + 1)
    }
  }

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(htmlCode)
    setCopiedHtml(true)
    toast.success("HTML code copied to clipboard")
    setTimeout(() => setCopiedHtml(false), 2000)
  }

  const handleCopyFrame = () => {
    navigator.clipboard.writeText(iframeCode)
    setCopiedFrame(true)
    toast.success("iframe code copied to clipboard")
    setTimeout(() => setCopiedFrame(false), 2000)
  }

  // Toggle preview open/closed
  const togglePreview = () => {
    setPreviewOpen(prev => !prev)
  }

  // Refresh preview by incrementing the key which forces iframe re-render
  const refreshPreview = () => {
    setPreviewKey(prev => prev + 1)
  }

  // Create HTML content for the chatbot iframe
  const createChatbotHtml = (aiId: string) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chatbot Preview</title>
        <style>
          body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
          .container { width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <div class="container">
          <script defer src="https://growbro-chatbox-widget.vercel.app/assets/chatbox-widget-bundle.js" data-ai-id="${aiId}"></script>
        </div>
      </body>
      </html>
    `
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <h2 className="text-xl font-semibold mb-6">Get AI Code & Test AI</h2>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left column - Form & Code snippets */}
        <div className="w-full lg:w-5/12 flex flex-col bg-white p-6 rounded-lg shadow-sm border">
          <div className="mb-6">
            <p className="text-sm font-medium mb-2">Select AI:</p>
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

          <div className="mb-6">
            <div className="flex items-center mb-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-green-600 text-white hover:bg-green-700"
                onClick={handleCopyHtml}
                disabled={!selectedAI}
              >
                <Copy className="h-4 w-4 mr-2" />
                {copiedHtml ? "Copied!" : "Copy HTML"}
              </Button>
            </div>
            <p className="mb-2 text-sm">Copy and add the following script to your website html:</p>
            <Textarea 
              value={selectedAI ? htmlCode : "Please select an AI first"} 
              readOnly 
              className="font-mono text-sm h-24" 
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center mb-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-green-600 text-white hover:bg-green-700"
                onClick={handleCopyFrame}
                disabled={!selectedAI}
              >
                <Copy className="h-4 w-4 mr-2" />
                {copiedFrame ? "Copied!" : "Copy iframe"}
              </Button>
            </div>
            <p className="mb-2 text-sm">Or use iframe if you want to embed to specific section:</p>
            <Textarea 
              value={selectedAI ? iframeCode : "Please select an AI first"} 
              readOnly 
              className="font-mono text-sm h-24" 
            />
          </div>
        </div>

        {/* Right column - Preview area */}
        <div className="w-full lg:w-7/12">
          <div className="w-full h-[650px] relative rounded-lg border bg-gray-50 overflow-hidden">
            {!selectedAI ? (
              <div className="w-full h-full flex items-center justify-center text-center p-4">
                <p className="text-gray-500">Please select an AI agent to preview.</p>
              </div>
            ) : !previewOpen ? (
              <div className="w-full h-full flex items-center justify-center text-center p-4">
                <div>
                  <p className="text-gray-500 mb-4">Preview your chatbot here</p>
                  <Button 
                    variant="outline" 
                    className="bg-green-600 text-white hover:bg-green-700"
                    onClick={togglePreview}
                  >
                    Open Preview
                  </Button>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 w-full h-full flex flex-col">
                <div className="bg-gray-100 p-2 flex justify-between items-center border-b">
                  <h4 className="text-sm font-medium">AI Chatbot Preview</h4>
                  <div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={refreshPreview} 
                      className="h-8 w-8 p-0 mr-1"
                      title="Refresh preview"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={togglePreview}
                      className="h-8 w-8 p-0"
                      title="Close preview"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden" id="preview-container">
                  <iframe
                    ref={iframeRef}
                    key={previewKey} // This forces re-render when AI changes
                    srcDoc={createChatbotHtml(selectedAI)}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title="Chatbot Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation"
                  />
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            This preview shows how the chatbot will appear on your website.
          </p>
        </div>
      </div>
    </div>
  )
}

// Main export component with Suspense boundary
export default function EmbedCode() {
  return (
    <Suspense fallback={
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p>Loading embed code options...</p>
          </div>
        </div>
      </div>
    }>
      <EmbedCodeContent />
    </Suspense>
  )
}
