"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ChatWidgetSettings() {
  const [selectedAI, setSelectedAI] = useState("")
  const [widgetSettings, setWidgetSettings] = useState({
    headingTitleColor: "#FFFFFF",
    headingBackgroundColor: "#4285F4",
    aiMessageColor: "#000000",
    aiMessageBackgroundColor: "#F1F1F1",
    userMessageColor: "#FFFFFF",
    userMessageBackgroundColor: "#4285F4",
    widgetColor: "#4285F4",
    sendButtonColor: "#4285F4",
    startMinimized: false,
  })

  const handleColorChange = (setting: string, value: string) => {
    setWidgetSettings((prev) => ({ ...prev, [setting]: value }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setWidgetSettings((prev) => ({ ...prev, startMinimized: checked }))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h2 className="text-xl font-bold mb-6">Chat Widget Settings</h2>

        <div className="mb-6">
          <Label htmlFor="select-ai">Select AI:</Label>
          <Select value={selectedAI} onValueChange={setSelectedAI}>
            <SelectTrigger id="select-ai" className="mt-1">
              <SelectValue placeholder="Select AI" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ai1">AI Assistant 1</SelectItem>
              <SelectItem value="ai2">AI Assistant 2</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="heading-title-color">Heading Title Color:</Label>
            <div className="flex gap-2">
              <Input
                id="heading-title-color"
                type="color"
                value={widgetSettings.headingTitleColor}
                onChange={(e) => handleColorChange("headingTitleColor", e.target.value)}
                className="w-16 h-10 p-1"
              />
              <Input
                type="text"
                value={widgetSettings.headingTitleColor}
                onChange={(e) => handleColorChange("headingTitleColor", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="heading-bg-color">Heading Background Color:</Label>
            <div className="flex gap-2">
              <Input
                id="heading-bg-color"
                type="color"
                value={widgetSettings.headingBackgroundColor}
                onChange={(e) => handleColorChange("headingBackgroundColor", e.target.value)}
                className="w-16 h-10 p-1"
              />
              <Input
                type="text"
                value={widgetSettings.headingBackgroundColor}
                onChange={(e) => handleColorChange("headingBackgroundColor", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="ai-message-color">AI Message Color:</Label>
            <div className="flex gap-2">
              <Input
                id="ai-message-color"
                type="color"
                value={widgetSettings.aiMessageColor}
                onChange={(e) => handleColorChange("aiMessageColor", e.target.value)}
                className="w-16 h-10 p-1"
              />
              <Input
                type="text"
                value={widgetSettings.aiMessageColor}
                onChange={(e) => handleColorChange("aiMessageColor", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="ai-message-bg-color">AI Message Background Color:</Label>
            <div className="flex gap-2">
              <Input
                id="ai-message-bg-color"
                type="color"
                value={widgetSettings.aiMessageBackgroundColor}
                onChange={(e) => handleColorChange("aiMessageBackgroundColor", e.target.value)}
                className="w-16 h-10 p-1"
              />
              <Input
                type="text"
                value={widgetSettings.aiMessageBackgroundColor}
                onChange={(e) => handleColorChange("aiMessageBackgroundColor", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="user-message-color">User Message Color:</Label>
            <div className="flex gap-2">
              <Input
                id="user-message-color"
                type="color"
                value={widgetSettings.userMessageColor}
                onChange={(e) => handleColorChange("userMessageColor", e.target.value)}
                className="w-16 h-10 p-1"
              />
              <Input
                type="text"
                value={widgetSettings.userMessageColor}
                onChange={(e) => handleColorChange("userMessageColor", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="user-message-bg-color">User Message Background Color:</Label>
            <div className="flex gap-2">
              <Input
                id="user-message-bg-color"
                type="color"
                value={widgetSettings.userMessageBackgroundColor}
                onChange={(e) => handleColorChange("userMessageBackgroundColor", e.target.value)}
                className="w-16 h-10 p-1"
              />
              <Input
                type="text"
                value={widgetSettings.userMessageBackgroundColor}
                onChange={(e) => handleColorChange("userMessageBackgroundColor", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="widget-color">Widget Color:</Label>
            <div className="flex gap-2">
              <Input
                id="widget-color"
                type="color"
                value={widgetSettings.widgetColor}
                onChange={(e) => handleColorChange("widgetColor", e.target.value)}
                className="w-16 h-10 p-1"
              />
              <Input
                type="text"
                value={widgetSettings.widgetColor}
                onChange={(e) => handleColorChange("widgetColor", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="send-button-color">Send Button Color:</Label>
            <div className="flex gap-2">
              <Input
                id="send-button-color"
                type="color"
                value={widgetSettings.sendButtonColor}
                onChange={(e) => handleColorChange("sendButtonColor", e.target.value)}
                className="w-16 h-10 p-1"
              />
              <Input
                type="text"
                value={widgetSettings.sendButtonColor}
                onChange={(e) => handleColorChange("sendButtonColor", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="start-minimized">Start Chat Widget Minimized:</Label>
            <Checkbox
              id="start-minimized"
              checked={widgetSettings.startMinimized}
              onCheckedChange={handleCheckboxChange}
            />
          </div>
        </div>

        <div className="mt-8">
          <Button className="bg-green-600 hover:bg-green-700 text-white">Update Widget</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h2 className="text-xl font-bold mb-6">Chat Widget Preview</h2>

        <div className="border rounded-lg overflow-hidden shadow-md">
          <div
            className="p-4 text-center font-medium"
            style={{
              backgroundColor: widgetSettings.headingBackgroundColor,
              color: widgetSettings.headingTitleColor,
            }}
          >
            Business Name
          </div>

          <div className="p-4 bg-gray-50 h-80">
            <div
              className="inline-block px-4 py-2 rounded-lg mb-4 max-w-[80%]"
              style={{
                backgroundColor: widgetSettings.aiMessageBackgroundColor,
                color: widgetSettings.aiMessageColor,
              }}
            >
              Hello! 👋 How can I help you today?
            </div>

            <div className="flex justify-end">
              <div
                className="inline-block px-4 py-2 rounded-lg mb-4 max-w-[80%]"
                style={{
                  backgroundColor: widgetSettings.userMessageBackgroundColor,
                  color: widgetSettings.userMessageColor,
                }}
              >
                I'd like to book a meeting with you please!
              </div>
            </div>
          </div>

          <div className="p-2 border-t">
            <div className="flex items-center">
              <Input placeholder="Enter your message..." className="flex-1 mr-2" />
              <Button
                style={{
                  backgroundColor: widgetSettings.sendButtonColor,
                  color: "#FFFFFF",
                }}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
