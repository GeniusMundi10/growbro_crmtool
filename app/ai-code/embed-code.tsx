"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy } from "lucide-react"

export default function EmbedCode() {
  const [selectedAI, setSelectedAI] = useState("")
  const [copiedHtml, setCopiedHtml] = useState(false)
  const [copiedFrame, setCopiedFrame] = useState(false)

  const htmlCode = `<script defer src="https://chat.vengoai.app/vengoai-chatbot-bundle.js" data-id=""></script>`
  const iframeCode = `<iframe src="https://chat.vengoai.app/?agentId=" width="450px" height="650px"></iframe>`

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
        <Select value={selectedAI} onValueChange={setSelectedAI}>
          <SelectTrigger>
            <SelectValue placeholder="Select AI" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ai1">AI Assistant 1</SelectItem>
            <SelectItem value="ai2">AI Assistant 2</SelectItem>
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
