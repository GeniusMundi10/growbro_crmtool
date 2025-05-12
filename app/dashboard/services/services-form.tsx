"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import HelpButton from "@/components/help-button"
import ActionButtons from "@/components/action-buttons"

export default function ServicesForm() {
  const [formData, setFormData] = useState({
    services: "",
    differentiation: "",
    profitableItems: "",
    salesLines: "",
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSpeakAnswer = (field: string) => {
    // This would typically trigger AI to generate content
    console.log(`Generate content for ${field}`)
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">9. Your Business Services</h2>
        <HelpButton />
      </div>

      <div className="space-y-8 mb-8">
        <div>
          <h3 className="font-medium mb-2">What services or products does your business provide?</h3>
          <Textarea
            value={formData.services}
            onChange={(e) => handleChange("services", e.target.value)}
            placeholder="Describe the services or products your business offers"
            className="min-h-[100px]"
          />
          <div className="flex justify-end mt-1">
            <button
              type="button"
              onClick={() => handleSpeakAnswer("services")}
              className="text-blue-500 text-sm hover:underline"
            >
              🎙️ Speak your answer
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">How are you different from your competitors?</h3>
          <Textarea
            value={formData.differentiation}
            onChange={(e) => handleChange("differentiation", e.target.value)}
            placeholder="Explain what sets your business apart from competitors"
            className="min-h-[100px]"
          />
          <div className="flex justify-end mt-1">
            <button
              type="button"
              onClick={() => handleSpeakAnswer("differentiation")}
              className="text-blue-500 text-sm hover:underline"
            >
              🎙️ Speak your answer
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">What are your most profitable line items?</h3>
          <Textarea
            value={formData.profitableItems}
            onChange={(e) => handleChange("profitableItems", e.target.value)}
            placeholder="List the most profitable products or services your business offers"
            className="min-h-[100px]"
          />
          <div className="flex justify-end mt-1">
            <button
              type="button"
              onClick={() => handleSpeakAnswer("profitableItems")}
              className="text-blue-500 text-sm hover:underline"
            >
              🎙️ Speak your answer
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">What are your 5 best sales lines to close a deal?</h3>
          <Textarea
            value={formData.salesLines}
            onChange={(e) => handleChange("salesLines", e.target.value)}
            placeholder="Share your top sales lines that help close deals"
            className="min-h-[100px]"
          />
          <div className="flex justify-end mt-1">
            <button
              type="button"
              onClick={() => handleSpeakAnswer("salesLines")}
              className="text-blue-500 text-sm hover:underline"
            >
              🎙️ Speak your answer
            </button>
          </div>
        </div>
      </div>

      <ActionButtons />
    </div>
  )
}
