"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import HelpButton from "@/components/help-button"
import ActionButtons from "@/components/action-buttons"

interface WebsiteEntry {
  id: string
  label: string
  url: string
}

export default function WebsitesForm() {
  const [websites, setWebsites] = useState<WebsiteEntry[]>([
    { id: "1", label: "A sales meeting transcript", url: "https://example.com" },
    { id: "2", label: "Your company FAQ", url: "https://example.com" },
    { id: "3", label: "A podcast transcript", url: "https://example.com" },
    { id: "4", label: "Your Blog", url: "https://example.com" },
    { id: "5", label: "A news article about you", url: "https://example.com" },
  ])

  const handleUrlChange = (id: string, value: string) => {
    setWebsites(websites.map((website) => (website.id === id ? { ...website, url: value } : website)))
  }

  const handleAddWebsite = () => {
    const newId = (Math.max(...websites.map((w) => Number.parseInt(w.id))) + 1).toString()
    setWebsites([...websites, { id: newId, label: "New Website", url: "" }])
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">5. Add websites for training</h2>
        <HelpButton />
      </div>

      <div className="mb-6">
        <p className="text-gray-700">
          Our system will extract the text from the website links you add to train your AI agent. So make sure the links
          you add are either text based, or transcripts.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {websites.map((website) => (
          <div key={website.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="md:col-span-1">
              <span className="text-gray-700">{website.label}</span>
            </div>
            <div className="md:col-span-3">
              <Input
                value={website.url}
                onChange={(e) => handleUrlChange(website.id, e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mb-8">
        <Button
          variant="outline"
          className="border-purple-600 text-purple-600 hover:bg-purple-50"
          onClick={handleAddWebsite}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add URL
        </Button>
      </div>

      <ActionButtons />
    </div>
  )
}
