"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useUser } from "@/context/UserContext"
import { getAIVoice, upsertAIVoice, AIVoice } from "@/lib/supabase"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import HelpButton from "@/components/help-button"
import ActionButtons from "@/components/action-buttons"

export default function VoiceSettingsForm() {
  const searchParams = useSearchParams();
  const aiId = searchParams.get("aiId");
  const { user } = useUser();
  const [voiceSettings, setVoiceSettings] = useState({
    voice_gender: "male",
    language: "english",
    enabled: false,
  });
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (aiId) {
      loadVoiceSettings();
    }
    // eslint-disable-next-line
  }, [aiId]);

  const loadVoiceSettings = async () => {
    setLoading(true);
    const data = await getAIVoice(aiId!);
    if (data) {
      setVoiceId(data.id);
      setVoiceSettings({
        voice_gender: data.voice_gender,
        language: data.language,
        enabled: data.enabled,
      });
    } else {
      setVoiceId(null);
      setVoiceSettings({ voice_gender: "male", language: "english", enabled: false });
    }
    setLoading(false);
  };

  const handleGenderChange = (value: string) => {
    setVoiceSettings((prev) => ({ ...prev, voice_gender: value }));
  };

  const handleLanguageChange = (value: string) => {
    setVoiceSettings((prev) => ({ ...prev, language: value }));
  };

  const handleEnabledChange = (checked: boolean) => {
    setVoiceSettings((prev) => ({ ...prev, enabled: checked }));
  };

  const handleSave = async () => {
    if (!aiId || !user?.id) {
      toast.error("AI or user not identified");
      return;
    }
    setSaving(true);
    const data = await upsertAIVoice(
      aiId,
      user.id,
      voiceSettings.voice_gender,
      voiceSettings.language,
      voiceSettings.enabled
    );
    if (data) {
      setVoiceId(data.id);
      toast.success("Voice settings saved successfully");
    } else {
      toast.error("Failed to save voice settings");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading voice settings...</p>
      </div>
    );
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
          <Select value={voiceSettings.voice_gender} onValueChange={handleGenderChange}>
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

      <ActionButtons
        showSave={true}
        onSave={handleSave}
        saving={saving}
        showCustomize={true}
        onCustomize={() => {
          if (aiId) window.location.href = `/customize?aiId=${aiId}`;
        }}
      />
    </div>
  );
}
