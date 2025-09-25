"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Copy, X, RefreshCw, Monitor, Smartphone, ExternalLink, CheckCircle2, Code2 } from "lucide-react"
import { toast } from "sonner"
import { getUserAIs } from "@/lib/supabase"
import { useUser } from "@/context/UserContext"
import { Skeleton } from "@/components/ui/skeleton"

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
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop")
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Generate code snippets with the selected AI ID
  const htmlCode = `<script defer src="https://chatbox.growbro.ai/assets/chatbox-widget-bundle.js" data-ai-id="${selectedAI}"></script>`
  const iframeCode = `<iframe src="https://chatbox.growbro.ai/iframe.html?agentId=${selectedAI}" width="450" height="650" style="border:0; border-radius:12px; box-shadow:0 8px 30px rgba(2,6,23,0.08)"></iframe>`
  
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

  const openPreviewInNewTab = () => {
    try {
      const html = createChatbotHtml(selectedAI)
      const win = window.open('', '_blank')
      if (win) {
        win.document.open()
        win.document.write(html)
        win.document.close()
      }
    } catch (e) {
      toast.error('Could not open preview in a new tab')
    }
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
          <script defer src="https://chatbox.growbro.ai/assets/chatbox-widget-bundle.js" data-ai-id="${aiId}"></script>
        </div>
      </body>
      </html>
    `
  }

  return (
    <TooltipProvider>
      <div className="relative rounded-2xl border bg-gradient-to-b from-slate-50 to-white p-6 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left column - Selection & Code */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-emerald-200/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Choose your AI assistant</CardTitle>
                <CardDescription>Select which assistant to embed on your site</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
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
                  {!!selectedAI && (
                    <div className="text-xs text-muted-foreground">
                      Agent ID: <Badge variant="outline" className="align-middle ml-1">{selectedAI}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-200/60 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Install on your website</CardTitle>
                    <CardDescription>Copy the code and paste before the closing body tag</CardDescription>
                  </div>
                  <Code2 className="h-5 w-5 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="script" className="w-full">
                  <TabsList className="mb-3">
                    <TabsTrigger value="script">Floating widget</TabsTrigger>
                    <TabsTrigger value="iframe">Inline iframe</TabsTrigger>
                  </TabsList>
                  <TabsContent value="script" className="space-y-2">
                    <div className="relative rounded-lg bg-slate-950 text-slate-50 p-3 font-mono text-xs">
                      <pre className="whitespace-pre-wrap break-all">{selectedAI ? htmlCode : "Please select an AI first"}</pre>
                      <div className="absolute top-2 right-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" variant="secondary" className="h-8" onClick={handleCopyHtml} disabled={!selectedAI}>
                              <Copy className="h-4 w-4 mr-1" /> {copiedHtml ? "Copied" : "Copy"}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy HTML snippet</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Add just before <code className="px-1 rounded bg-slate-100">&lt;/body&gt;</code> on pages where you want the chat bubble.
                    </p>
                  </TabsContent>
                  <TabsContent value="iframe" className="space-y-2">
                    <div className="relative rounded-lg bg-slate-950 text-slate-50 p-3 font-mono text-xs">
                      <pre className="whitespace-pre-wrap break-all">{selectedAI ? iframeCode : "Please select an AI first"}</pre>
                      <div className="absolute top-2 right-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" variant="secondary" className="h-8" onClick={handleCopyFrame} disabled={!selectedAI}>
                              <Copy className="h-4 w-4 mr-1" /> {copiedFrame ? "Copied" : "Copy"}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy iframe snippet</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Place inside any section to show the assistant inline.
                    </p>
                  </TabsContent>
                </Tabs>
                <Separator className="my-4" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Script loads from <span className="font-mono">chatbox.growbro.ai</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> No code changes needed after updates</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Works with all site builders</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Preview */}
          <div className="lg:col-span-7">
            <Card className="overflow-hidden border-emerald-200/60 shadow-sm">
              <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-50 to-emerald-50/60 border-b">
                <div className="text-sm font-medium">AI Chatbot Preview</div>
                <div className="flex items-center gap-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant={viewport === 'desktop' ? 'secondary' : 'ghost'} size="sm" className="h-8 px-2" onClick={() => setViewport('desktop')}>
                        <Monitor className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Desktop viewport</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant={viewport === 'mobile' ? 'secondary' : 'ghost'} size="sm" className="h-8 px-2" onClick={() => setViewport('mobile')}>
                        <Smartphone className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Mobile viewport</TooltipContent>
                  </Tooltip>
                  <Separator orientation="vertical" className="mx-1 h-6" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={refreshPreview} title="Refresh preview">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={openPreviewInNewTab} title="Open in new tab">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Open in new tab</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={togglePreview} title="Close preview">
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Close</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <CardContent className="p-0">
                <div className="w-full h-[650px] relative bg-gray-50/60 flex items-center justify-center">
                  {!selectedAI ? (
                    <div className="text-center p-6">
                      <p className="text-gray-500">Please select an AI agent to preview.</p>
                    </div>
                  ) : !previewOpen ? (
                    <div className="text-center p-6">
                      <p className="text-gray-500 mb-4">Preview your chatbot here</p>
                      <Button 
                        variant="default" 
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={togglePreview}
                      >
                        Open Preview
                      </Button>
                    </div>
                  ) : (
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden">
                      <div className={viewport === 'mobile' ? "w-[410px] max-w-full px-2" : "w-full h-full"}>
                        <div className={viewport === 'mobile' ? "mx-auto rounded-[20px] border bg-white shadow-2xl overflow-hidden" : "w-full h-full"}>
                          <div className={viewport === 'mobile' ? "relative w-full h-[700px] bg-gray-50" : "relative w-full h-full"}>
                            <iframe
                              ref={iframeRef}
                              key={previewKey}
                              srcDoc={createChatbotHtml(selectedAI)}
                              style={{ width: '100%', height: '100%', border: 'none' }}
                              title="Chatbot Preview"
                              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground text-center py-2">This preview shows how the chatbot will appear on your site.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

// Main export component with Suspense boundary
export default function EmbedCode() {
  function Shimmer({ className = "" }: { className?: string }) {
    return (
      <div className={`relative overflow-hidden rounded-md bg-muted ${className}`}>
        <div className="absolute inset-0 shimmer-overlay" />
      </div>
    );
  }
  function ShimmerStyles() {
    return (
      <style jsx global>{`
        @keyframes shimmer-sweep { 0% { transform: translateX(-100%);} 100% { transform: translateX(100%);} }
        .shimmer-overlay { background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%); animation: shimmer-sweep 1.6s infinite; transform: translateX(-100%); }
      `}</style>
    )
  }
  return (
    <Suspense fallback={
      <div className="rounded-2xl border bg-gradient-to-b from-slate-50 to-white p-6 shadow-sm">
        <ShimmerStyles />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left column skeleton */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <Shimmer className="h-4 w-40 mb-2" />
                <Shimmer className="h-3 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Shimmer className="h-10 w-full" />
                  <Shimmer className="h-4 w-48" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader>
                <div className="space-y-2">
                  <Shimmer className="h-4 w-48" />
                  <Shimmer className="h-3 w-72" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="rounded-lg bg-slate-100 p-3">
                    <Shimmer className="h-24 w-full" />
                  </div>
                  <div className="rounded-lg bg-slate-100 p-3">
                    <Shimmer className="h-24 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Right column skeleton */}
          <div className="lg:col-span-7">
            <Card className="overflow-hidden shadow-sm">
              <div className="px-4 py-2.5 border-b bg-gradient-to-r from-slate-50 to-emerald-50/60">
                <Shimmer className="h-4 w-40" />
              </div>
              <CardContent className="p-0">
                <div className="w-full h-[650px] bg-gray-50/60 flex items-center justify-center">
                  <Shimmer className="h-[80%] w-[90%]" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    }>
      <EmbedCodeContent />
    </Suspense>
  )
}
