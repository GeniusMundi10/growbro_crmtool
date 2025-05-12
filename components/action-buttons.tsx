"use client"

import { Button } from "@/components/ui/button"

interface ActionButtonsProps {
  showSave?: boolean
  showCustomize?: boolean
  showTest?: boolean
  onSave?: () => void
  onCustomize?: () => void
  onTest?: () => void
}

export default function ActionButtons({
  showSave = true,
  showCustomize = true,
  showTest = true,
  onSave,
  onCustomize,
  onTest,
}: ActionButtonsProps) {
  return (
    <div className="flex justify-end mt-8 space-x-4">
      {showSave && (
        <Button onClick={onSave} className="bg-green-600 hover:bg-green-700 text-white">
          Save Changes
        </Button>
      )}
      {showCustomize && (
        <Button onClick={onCustomize} className="bg-green-700 text-white hover:bg-green-800">
          Customize Chat
        </Button>
      )}
      {showTest && (
        <Button onClick={onTest} className="bg-blue-500 text-white hover:bg-blue-600">
          Test AI
        </Button>
      )}
    </div>
  )
}
