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
  const [previewKey, setPreviewKey] = useState(0) // For forcing re-render
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Generate code snippets with the selected AI ID
  const htmlCode = `<script defer src="https://growbro-chatbox-widget.vercel.app/assets/index-DAUQoV-Y.js" data-ai-id="${selectedAI}"></script>`
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
    
    // If preview is open, force a refresh by incrementing the key
    if (previewOpen) {
      setPreviewKey(prev => prev + 1)
    }
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

  // Toggle the preview state
  const togglePreview = () => {
    setPreviewOpen(!previewOpen)
  }
  
  // Function to refresh the preview
  const refreshPreview = () => {
    if (previewOpen && selectedAI) {
      setPreviewKey(prev => prev + 1)
    }
  }
  
  // Function to create HTML content with the chatbot script
  const createChatbotHtml = (aiId: string) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              margin: 0;
              padding: 0;
              overflow: hidden;
              width: 100%;
              height: 100vh;
              font-family: sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              background-color: #f9fafb;
            }
            .loading {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100%;
              width: 100%;
            }
            .spinner {
              width: 40px;
              height: 40px;
              border: 4px solid rgba(0, 0, 0, 0.1);
              border-radius: 50%;
              border-top: 4px solid #10b981;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            /* Force chatbot to be centered */
            div[data-growbro-widget], 
            div[class*="growbro"], 
            div[id*="growbro"] {
              position: relative !important;
              top: auto !important;
              right: auto !important;
              bottom: auto !important;
              left: auto !important;
              margin: 0 auto !important;
              transform: none !important;
            }
          </style>
        </head>
        <body>
          <div id="preview-container">
            <div class="loading">
              <div class="spinner"></div>
            </div>
          </div>
          <script defer src="https://growbro-chatbox-widget.vercel.app/assets/index-DAUQoV-Y.js" data-ai-id="${aiId}"></script>
        </body>
      </html>
    `
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

      <div className="mb-8">
        <h3 className="text-lg font-medium mb-2">Preview</h3>
        <div 
          ref={previewContainerRef}
          className={`relative overflow-hidden transition-all duration-300 rounded-lg border ${previewOpen ? 'h-[650px]' : 'h-64'}`}
          style={{
            background: previewOpen ? '#f9fafb' : '#f3f4f6',
          }}
        >
          {!previewOpen && (
            <div className="flex justify-center items-center h-full">
              {selectedAI ? (
                <div className="text-center">
                  <div className="mb-4">Preview of your AI chatbot will appear here</div>
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={togglePreview}
                  >
                    Open Preview
                  </Button>
                </div>
              ) : (
                <p className="text-gray-500">Please select an AI agent to preview.</p>
              )}
            </div>
          )}
          
          {previewOpen && (
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
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Note: This preview shows how the chatbot will appear on your website.
        </p>
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
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700 mx-auto mb-4"></div>
            <p>Loading embed code options...</p>
          </div>
        </div>
      </div>
    }>
      <EmbedCodeContent />
    </Suspense>
  )
}
