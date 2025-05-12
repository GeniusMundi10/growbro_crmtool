"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import HelpButton from "@/components/help-button"
import ActionButtons from "@/components/action-buttons"

export default function VoiceSettingsForm() {
  const [voiceSettings, setVoiceSettings] = useState({
    gender: "male",
    language: "english",
    enabled: false,
  })

  const handleGenderChange = (value: string) => {
    setVoiceSettings((prev) => ({ ...prev, gender: value }))
  }

  const handleLanguageChange = (value: string) => {
    setVoiceSettings((prev) => ({ ...prev, language: value }))
  }

  const handleEnabledChange = (checked: boolean) => {
    setVoiceSettings((prev) => ({ ...prev, enabled: checked }))
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">4. Choose a Voice</h2>
        <HelpButton />
      </div>

      <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-8">
        <div className="w-full md:w-1/3">
          <Label htmlFor="gender-select">Voice Gender</Label>
          <Select value={voiceSettings.gender} onValueChange={handleGenderChange}>
            <SelectTrigger id="gender-select" className="mt-1">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-1/3">
          <Label htmlFor="language-select">Language</Label>
          <Select value={voiceSettings.language} onValueChange={handleLanguageChange}>
            <SelectTrigger id="language-select" className="mt-1">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="spanish">Spanish</SelectItem>
              <SelectItem value="french">French</SelectItem>
              <SelectItem value="german">German</SelectItem>
              <SelectItem value="italian">Italian</SelectItem>
              <SelectItem value="portuguese">Portuguese</SelectItem>
              <SelectItem value="dutch">Dutch</SelectItem>
              <SelectItem value="hindi">Hindi</SelectItem>
              <SelectItem value="japanese">Japanese</SelectItem>
              <SelectItem value="chinese">Chinese</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-1/3 flex items-center space-x-2">
          <Switch id="voice-enabled" checked={voiceSettings.enabled} onCheckedChange={handleEnabledChange} />
          <Label htmlFor="voice-enabled">Enable Voice</Label>
        </div>
      </div>

      <ActionButtons />
    </div>
  )
}
