"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, X } from "lucide-react"
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
  const previewContainerRef = useRef<HTMLDivElement>(null)

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
    
    // If preview is open, close and reopen it to refresh the script
    if (previewOpen) {
      setPreviewOpen(false)
      setTimeout(() => setPreviewOpen(true), 100)
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
  
  // Global variable to track script loading and containment
  useEffect(() => {
    // Add a custom CSS style to force the chatbot to be contained
    const styleElement = document.createElement('style')
    styleElement.id = 'chatbot-containment-style'
    styleElement.textContent = `
      /* Only hide chatbot elements outside our container, but don't affect ones inside */
      body > [data-growbro-widget],
      body > div[class*="growbro"],
      body > div[id*="growbro"],
      body > div[class*="chatbot"],
      body > div[id*="chatbot"] {
        display: none !important;
      }

      /* Ensure the chatbot container is properly sized */
      #chatbot-preview-container {
        width: 100% !important;
        height: 100% !important;
        overflow: hidden !important;
      }

      /* Allow widget to be visible in our container */
      #preview-container [data-growbro-widget],
      #preview-container [class*="growbro"],
      #preview-container [id*="growbro"],
      #preview-container [class*="chatbot"],
      #preview-container [id*="chatbot"] {
        display: block !important;
        position: static !important;
        transform: none !important;
      }
    `
    document.head.appendChild(styleElement)

    // Cleanup when component unmounts
    return () => {
      if (document.getElementById('chatbot-containment-style')) {
        document.getElementById('chatbot-containment-style')?.remove()
      }
      // Ensure we clean up any chatbot elements when the component unmounts
      cleanupChatbot()
    }
  }, [])

  // Function to clean up any chatbot elements
  const cleanupChatbot = () => {
    // Remove the script
    const existingScript = document.getElementById('chatbot-preview-script')
    if (existingScript && existingScript.parentNode) {
      existingScript.parentNode.removeChild(existingScript)
    }
    
    // Remove any chatbot widget elements that might have been created
    const chatbotElements = document.querySelectorAll(
      '[data-growbro-widget], [id*="growbro"], [class*="growbro"], [id*="chatbot"], [class*="chatbot"]'
    )
    chatbotElements.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element)
      }
    })
  }

  // Effect to handle script injection and cleanup for preview
  useEffect(() => {
    if (!previewOpen || !selectedAI || !previewContainerRef.current) {
      // Clean up any existing chatbot elements when closing
      if (!previewOpen) {
        cleanupChatbot()
      }
      return
    }
    
    // Clean up any existing chatbot first
    cleanupChatbot()
    
    // Find the preview-container div and prepare it
    const previewContainer = document.getElementById('preview-container')
    if (previewContainer) {
      // Show loading indicator
      previewContainer.innerHTML = `
        <div class="flex justify-center items-center h-full">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700"></div>
        </div>
      `
    }

    // Create a script element for the chatbot
    const script = document.createElement('script')
    script.defer = true
    script.src = "https://growbro-chatbox-widget.vercel.app/assets/index-DAUQoV-Y.js"
    script.setAttribute('data-ai-id', selectedAI)
    script.id = 'chatbot-preview-script'
    
    // Add to document body (required for the script to work properly)
    document.body.appendChild(script)
    
    // Set up a mutation observer to watch for chatbot elements
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          // Look for chatbot elements
          const chatbotElements = document.querySelectorAll(
            'body > [data-growbro-widget], body > div[class*="growbro"], body > div[id*="growbro"]'
          )
          
          if (chatbotElements.length > 0 && previewContainer) {
            // Clear loading indicator
            previewContainer.innerHTML = ''
            
            // Move each chatbot element to our preview container
            chatbotElements.forEach(element => {
              // Clone the element to our container (since moving may break functionality)
              const clone = element.cloneNode(true)
              previewContainer.appendChild(clone)
              
              // Hide the original
              if (element.parentNode && element instanceof HTMLElement) {
                element.style.display = 'none'
              }
            })
            
            // Stop observing once we've found chatbot elements
            observer.disconnect()
          }
        }
      }
    })
    
    // Start observing changes to the body
    observer.observe(document.body, { childList: true, subtree: true })
    
    // Ensure cleanup when preview is closed or component unmounts
    return () => {
      observer.disconnect()
      cleanupChatbot()
    }
  }, [previewOpen, selectedAI])

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
          className={`relative overflow-hidden transition-all duration-300 rounded-lg border ${previewOpen ? 'h-[500px]' : 'h-64'}`}
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={togglePreview}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden" id="preview-container">
                {/* The chatbot script will insert elements here */}
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700"></div>
                </div>
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
