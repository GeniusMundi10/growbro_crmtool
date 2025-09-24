"use client";

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { getBusinessInfo, updateBusinessInfo, getUserAIs } from "@/lib/supabase"
import type { BusinessInfo } from "@/lib/supabase"
import { useUser } from "@/context/UserContext"
import { motion } from "framer-motion"
import { Palette, Eye, Settings, Zap, MessageCircle, Users, Paintbrush2 } from "lucide-react"

export default function ChatWidgetSettings() {
  const { user } = useUser()
  const searchParams = useSearchParams()
  const aiId = searchParams.get('aiId')
  const [selectedAI, setSelectedAI] = useState(aiId || "")
  const [aiOptions, setAIOptions] = useState<{ value: string, label: string }[]>([])
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
  const [saving, setSaving] = useState(false)
  const [currentAI, setCurrentAI] = useState<BusinessInfo | null>(null)

  useEffect(() => {
    if (user) {
      loadUserAIs()
      if (aiId) {
        loadAISettings(aiId)
      }
    }
  }, [user, aiId])

  const loadUserAIs = async () => {
    try {
      const ais = await getUserAIs(user?.id || "")
      if (ais && ais.length > 0) {
        const options = ais.map(ai => ({
          value: ai.id,
          label: ai.ai_name
        }))
        setAIOptions(options)
        // Auto-select first AI if none selected
        if (!selectedAI && options.length > 0) {
          setSelectedAI(options[0].value)
          loadAISettings(options[0].value)
        }
      }
    } catch (error) {
      console.error("Error loading user AIs:", error)
    }
  }

  const loadAISettings = async (id: string) => {
    try {
      const ai: BusinessInfo | null = await getBusinessInfo(id)
      if (ai) {
        setCurrentAI(ai)
        setSelectedAI(ai.id)
        // Load saved branding settings if they exist
        setWidgetSettings({
          headingTitleColor: ai.heading_title_color || "#FFFFFF",
          headingBackgroundColor: ai.heading_background_color || "#4285F4",
          aiMessageColor: ai.ai_message_color || "#000000",
          aiMessageBackgroundColor: ai.ai_message_background_color || "#F1F1F1",
          userMessageColor: ai.user_message_color || "#FFFFFF",
          userMessageBackgroundColor: ai.user_message_background_color || "#4285F4",
          widgetColor: ai.widget_color || "#4285F4",
          sendButtonColor: ai.send_button_color || "#4285F4",
          startMinimized: ai.start_minimized || false,
        })
      }
    } catch (error) {
      console.error("Error loading AI settings:", error)
    }
  }

  const handleAIChange = (value: string) => {
    setSelectedAI(value)
    if (value) {
      loadAISettings(value)
    }
  }

  const handleColorChange = (setting: string, value: string) => {
    setWidgetSettings((prev) => ({ ...prev, [setting]: value }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setWidgetSettings((prev) => ({ ...prev, startMinimized: checked }))
  }

  const handleSaveSettings = async () => {
    if (!selectedAI || !currentAI) {
      toast.error("Please select an AI first")
      return
    }

    setSaving(true)
    try {
      // Map the local state to the database field names
      const brandingData = {
        id: selectedAI,
        heading_title_color: widgetSettings.headingTitleColor,
        heading_background_color: widgetSettings.headingBackgroundColor,
        ai_message_color: widgetSettings.aiMessageColor,
        ai_message_background_color: widgetSettings.aiMessageBackgroundColor,
        user_message_color: widgetSettings.userMessageColor,
        user_message_background_color: widgetSettings.userMessageBackgroundColor,
        widget_color: widgetSettings.widgetColor,
        send_button_color: widgetSettings.sendButtonColor,
        start_minimized: widgetSettings.startMinimized,
      }

      const success = await updateBusinessInfo(brandingData)
      if (success) {
        toast.success("Widget settings saved successfully")
      } else {
        toast.error("Failed to save widget settings")
      }
    } catch (error) {
      console.error("Error saving widget settings:", error)
      toast.error("An error occurred while saving")
    } finally {
      setSaving(false)
    }
  }

  // Color palette suggestions
  const colorPalettes = [
    {
      name: "Professional Blue",
      colors: {
        headingBackgroundColor: "#2563EB",
        headingTitleColor: "#FFFFFF",
        widgetColor: "#2563EB",
        sendButtonColor: "#2563EB",
        aiMessageBackgroundColor: "#F1F5F9",
        aiMessageColor: "#1E293B",
        userMessageBackgroundColor: "#2563EB",
        userMessageColor: "#FFFFFF"
      }
    },
    {
      name: "Nature Green",
      colors: {
        headingBackgroundColor: "#059669",
        headingTitleColor: "#FFFFFF",
        widgetColor: "#059669",
        sendButtonColor: "#059669",
        aiMessageBackgroundColor: "#ECFDF5",
        aiMessageColor: "#065F46",
        userMessageBackgroundColor: "#059669",
        userMessageColor: "#FFFFFF"
      }
    },
    {
      name: "Elegant Purple",
      colors: {
        headingBackgroundColor: "#7C3AED",
        headingTitleColor: "#FFFFFF",
        widgetColor: "#7C3AED",
        sendButtonColor: "#7C3AED",
        aiMessageBackgroundColor: "#F3F4F6",
        aiMessageColor: "#374151",
        userMessageBackgroundColor: "#7C3AED",
        userMessageColor: "#FFFFFF"
      }
    },
    {
      name: "Warm Orange",
      colors: {
        headingBackgroundColor: "#EA580C",
        headingTitleColor: "#FFFFFF",
        widgetColor: "#EA580C",
        sendButtonColor: "#EA580C",
        aiMessageBackgroundColor: "#FEF3E2",
        aiMessageColor: "#9A3412",
        userMessageBackgroundColor: "#EA580C",
        userMessageColor: "#FFFFFF"
      }
    }
  ];

  const applyPalette = (palette: typeof colorPalettes[0]) => {
    setWidgetSettings(prev => ({
      ...prev,
      ...palette.colors
    }));
  };

  // Popular color presets for easy selection
  const colorPresets = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#FF7675', '#74B9FF', '#A29BFE', '#FD79A8', '#FDCB6E', '#6C5CE7', '#00B894', '#E17055',
    '#2D3436', '#636E72', '#B2BEC3', '#DDD', '#000000', '#FFFFFF', '#FF0000', '#00FF00'
  ];

  const ColorPicker = ({ label, value, onChange, icon }: { label: string, value: string, onChange: (value: string) => void, icon?: React.ReactNode }) => {
    const [showPresets, setShowPresets] = useState(false);
    
    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
          {icon}
          {label}
        </Label>
        
        {/* Main Color Display & Picker */}
        <div className="flex gap-3 items-center">
          <div className="relative">
            <Input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-16 h-16 p-2 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-colors shadow-sm"
            />
            <div 
              className="absolute inset-2 rounded-lg shadow-inner border border-white/30" 
              style={{ backgroundColor: value }}
            />
          </div>
          
          <div className="flex-1 space-y-2">
            <Input
              type="text"
              value={value.toUpperCase()}
              onChange={(e) => onChange(e.target.value)}
              className="font-mono text-sm"
              placeholder="#000000"
            />
            <button
              type="button"
              onClick={() => setShowPresets(!showPresets)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              {showPresets ? '← Hide Presets' : '🎨 Show Color Presets'}
            </button>
          </div>
        </div>

        {/* Color Presets */}
        {showPresets && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-8 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200"
          >
            {colorPresets.map((color, index) => (
              <motion.button
                key={index}
                type="button"
                onClick={() => onChange(color)}
                className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 hover:shadow-lg ${
                  value.toLowerCase() === color.toLowerCase() 
                    ? 'border-slate-800 ring-2 ring-blue-500' 
                    : 'border-white shadow-sm hover:border-slate-300'
                }`}
                style={{ backgroundColor: color }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title={color}
              />
            ))}
          </motion.div>
        )}
        
        {/* Color Name Display */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div 
            className="w-4 h-4 rounded border border-slate-200" 
            style={{ backgroundColor: value }}
          />
          <span>Current: {value.toUpperCase()}</span>
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* AI Selection */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Settings className="h-5 w-5 text-blue-500" />
            AI Assistant Selection
          </CardTitle>
          <CardDescription>Choose which AI assistant to customize</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="select-ai" className="text-sm font-medium text-slate-700">
              Select AI Assistant
            </Label>
            <Select value={selectedAI} onValueChange={handleAIChange}>
              <SelectTrigger id="select-ai" className="w-full">
                <SelectValue placeholder="Choose an AI assistant" />
              </SelectTrigger>
              <SelectContent>
                {aiOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Customization Panel */}
        <div className="space-y-6">
          {/* Color Palettes */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Palette className="h-5 w-5 text-purple-500" />
                Quick Color Themes
              </CardTitle>
              <CardDescription>Apply pre-designed color schemes instantly</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {colorPalettes.map((palette, index) => (
                  <motion.button
                    key={index}
                    onClick={() => applyPalette(palette)}
                    className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-all duration-200 text-left group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: palette.colors.headingBackgroundColor }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: palette.colors.userMessageBackgroundColor }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: palette.colors.aiMessageBackgroundColor }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                      {palette.name}
                    </span>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Header Colors */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <MessageCircle className="h-5 w-5 text-green-500" />
                Header Styling
              </CardTitle>
              <CardDescription>Customize the chat widget header appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ColorPicker
                label="Header Background"
                value={widgetSettings.headingBackgroundColor}
                onChange={(value) => handleColorChange("headingBackgroundColor", value)}
                icon={<div className="w-3 h-3 rounded bg-gradient-to-r from-blue-400 to-blue-600" />}
              />
              <ColorPicker
                label="Header Text"
                value={widgetSettings.headingTitleColor}
                onChange={(value) => handleColorChange("headingTitleColor", value)}
                icon={<div className="w-3 h-3 rounded bg-slate-700" />}
              />
            </CardContent>
          </Card>

          {/* Message Colors */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Users className="h-5 w-5 text-indigo-500" />
                Message Styling
              </CardTitle>
              <CardDescription>Customize how messages appear in the chat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-1">
                    🤖 AI Messages
                  </h4>
                  <div className="space-y-3 pl-4 border-l-2 border-slate-100">
                    <ColorPicker
                      label="Background"
                      value={widgetSettings.aiMessageBackgroundColor}
                      onChange={(value) => handleColorChange("aiMessageBackgroundColor", value)}
                    />
                    <ColorPicker
                      label="Text Color"
                      value={widgetSettings.aiMessageColor}
                      onChange={(value) => handleColorChange("aiMessageColor", value)}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-1">
                    👤 User Messages
                  </h4>
                  <div className="space-y-3 pl-4 border-l-2 border-slate-100">
                    <ColorPicker
                      label="Background"
                      value={widgetSettings.userMessageBackgroundColor}
                      onChange={(value) => handleColorChange("userMessageBackgroundColor", value)}
                    />
                    <ColorPicker
                      label="Text Color"
                      value={widgetSettings.userMessageColor}
                      onChange={(value) => handleColorChange("userMessageColor", value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Widget & Button Colors */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Paintbrush2 className="h-5 w-5 text-orange-500" />
                Widget & Actions
              </CardTitle>
              <CardDescription>Customize widget background and interactive elements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ColorPicker
                label="Widget Background"
                value={widgetSettings.widgetColor}
                onChange={(value) => handleColorChange("widgetColor", value)}
                icon={<div className="w-3 h-3 rounded bg-gradient-to-br from-slate-200 to-slate-300" />}
              />
              <ColorPicker
                label="Send Button"
                value={widgetSettings.sendButtonColor}
                onChange={(value) => handleColorChange("sendButtonColor", value)}
                icon={<Zap className="w-3 h-3 text-yellow-500" />}
              />
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Settings className="h-5 w-5 text-slate-500" />
                Widget Behavior
              </CardTitle>
              <CardDescription>Configure how the widget behaves for visitors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="start-minimized" className="text-sm font-medium">
                    Start Minimized
                  </Label>
                  <p className="text-xs text-slate-600">
                    Widget will appear as a small bubble initially
                  </p>
                </div>
                <Checkbox
                  id="start-minimized"
                  checked={widgetSettings.startMinimized}
                  onCheckedChange={handleCheckboxChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              onClick={handleSaveSettings}
              disabled={saving || !selectedAI}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 text-base shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Save Widget Settings
                </>
              )}
            </Button>
          </motion.div>
        </div>

        {/* Enhanced Preview Panel */}
        <div className="sticky top-8">
          <Card className="shadow-lg border-slate-200 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Eye className="h-5 w-5 text-blue-500" />
                Live Preview
              </CardTitle>
              <CardDescription>See how your chatbox will look to visitors</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {/* Desktop Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="secondary" className="text-xs">Desktop View</Badge>
                  {selectedAI && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                      ✓ AI Selected
                    </Badge>
                  )}
                </div>
                
                <motion.div 
                  className="w-full max-w-sm mx-auto rounded-2xl shadow-xl overflow-hidden border border-slate-200"
                  style={{ backgroundColor: widgetSettings.widgetColor || '#ffffff' }}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Widget Header */}
                  <div
                    className="px-4 py-3 flex items-center justify-between font-medium transition-all duration-300"
                    style={{
                      backgroundColor: widgetSettings.headingBackgroundColor,
                      color: widgetSettings.headingTitleColor,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-lg">
                        🤖
                      </div>
                      <div>
                        <div className="text-sm font-semibold">
                          {currentAI?.ai_name || "Your AI Assistant"}
                        </div>
                        <div className="text-xs opacity-90">
                          {currentAI?.company_name || "Your Business"}
                        </div>
                      </div>
                    </div>
                    <button className="text-sm opacity-75 hover:opacity-100 transition-opacity">
                      ✕
                    </button>
                  </div>

                  {/* Chat Messages */}
                  <div 
                    className="p-4 h-64 overflow-y-auto space-y-3"
                  >
                    {/* AI Message */}
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs shadow-sm">
                        🤖
                      </div>
                      <motion.div
                        className="max-w-[75%] px-3 py-2 rounded-lg text-sm shadow-sm transition-all duration-300"
                        style={{
                          backgroundColor: widgetSettings.aiMessageBackgroundColor,
                          color: widgetSettings.aiMessageColor,
                        }}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        Hello! 👋 I'm {currentAI?.ai_name || 'your AI assistant'}. How can I help you today?
                      </motion.div>
                    </div>

                    {/* User Message */}
                    <div className="flex justify-end">
                      <motion.div
                        className="max-w-[75%] px-3 py-2 rounded-lg text-sm shadow-sm transition-all duration-300"
                        style={{
                          backgroundColor: widgetSettings.userMessageBackgroundColor,
                          color: widgetSettings.userMessageColor,
                        }}
                        initial={{ x: 10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                      >
                        I'd love to learn more about your services!
                      </motion.div>
                    </div>

                    {/* AI Response */}
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs shadow-sm">
                        🤖
                      </div>
                      <motion.div
                        className="max-w-[75%] px-3 py-2 rounded-lg text-sm shadow-sm transition-all duration-300"
                        style={{
                          backgroundColor: widgetSettings.aiMessageBackgroundColor,
                          color: widgetSettings.aiMessageColor,
                        }}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 1.1 }}
                      >
                        Perfect! I'd be happy to help. What specific information are you looking for?
                      </motion.div>
                    </div>
                  </div>

                  {/* Input Area */}
                  <div 
                    className="p-3 border-t border-slate-100"
                    style={{ backgroundColor: widgetSettings.widgetColor || '#ffffff' }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-500">
                        Type your message...
                      </div>
                      <motion.button
                        className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-300 shadow-sm hover:shadow-md"
                        style={{
                          backgroundColor: widgetSettings.sendButtonColor,
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Send
                      </motion.button>
                    </div>
                  </div>
                </motion.div>

                {/* Mobile Preview Note */}
                <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-700">
                      <p className="font-medium mb-1">Responsive Design</p>
                      <p>Your chatbox automatically adapts to mobile devices with optimized spacing and touch-friendly controls.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
