"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"

interface ActionButtonsProps {
  showSave?: boolean
  showCustomize?: boolean
  showTest?: boolean
  onSave?: () => void
  onCustomize?: () => void
  onTest?: () => void
  saving?: boolean
  aiIdOverride?: string  // Optional override for aiId if not using the URL param
}

export default function ActionButtons({
  showSave = true,
  showCustomize = true,
  showTest = true,
  onSave,
  onCustomize,
  onTest,
  saving = false,
  aiIdOverride,
}: ActionButtonsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlAiId = searchParams.get('aiId')
  
  // Use override if provided, otherwise use URL param
  const currentAiId = aiIdOverride || urlAiId
  
  // Handle redirecting to AI Code page with correct aiId
  const handleTestAI = () => {
    if (onTest) {
      // Use custom handler if provided
      onTest()
    } else if (currentAiId) {
      // Otherwise redirect to AI Code page with aiId
      router.push(`/ai-code?aiId=${currentAiId}`)
    } else {
      console.error("No AI ID available for Test AI button")
    }
  }
  return (
    <div className="flex justify-end mt-8 space-x-4">
      {showSave && (
        <Button onClick={onSave} className="bg-green-600 hover:bg-green-700 text-white" disabled={saving}>
          {saving ? (
            <span>
              <svg className="inline mr-2 w-4 h-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            "Save Changes"
          )}
        </Button>
      )}
      {showCustomize && (
        <Button onClick={onCustomize} className="bg-green-700 text-white hover:bg-green-800">
          Customize Chat
        </Button>
      )}
      {showTest && (
        <Button 
          onClick={handleTestAI} 
          className="bg-blue-500 text-white hover:bg-blue-600"
          disabled={!currentAiId && !onTest}
        >
          Test AI
        </Button>
      )}
    </div>
  )
}
