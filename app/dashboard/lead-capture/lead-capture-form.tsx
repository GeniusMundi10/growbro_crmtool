"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import HelpButton from "@/components/help-button"
import ActionButtons from "@/components/action-buttons"

export default function LeadCaptureForm() {
  const [captureSettings, setCaptureSettings] = useState({
    name: true,
    email: true,
    phone: true,
  })

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setCaptureSettings((prev) => ({
      ...prev,
      [field]: checked,
    }))
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">2. Customize Lead Capture Settings</h2>
        <HelpButton />
      </div>

      <div className="mb-8">
        <p className="text-gray-700">
          Control what information your AI agent collects from website visitors. Choose whether to capture their name,
          email, and phone number, only some of this information, or none at all. Adjust these settings based on your
          business needs and lead generation strategy.
        </p>
      </div>

      <div className="flex justify-center space-x-16 mb-8">
        <div className="flex flex-col items-center">
          <span className="mb-2">Name</span>
          <Checkbox
            id="name"
            checked={captureSettings.name}
            onCheckedChange={(checked) => handleCheckboxChange("name", checked as boolean)}
          />
        </div>
        <div className="flex flex-col items-center">
          <span className="mb-2">Email</span>
          <Checkbox
            id="email"
            checked={captureSettings.email}
            onCheckedChange={(checked) => handleCheckboxChange("email", checked as boolean)}
          />
        </div>
        <div className="flex flex-col items-center">
          <span className="mb-2">Phone Number</span>
          <Checkbox
            id="phone"
            checked={captureSettings.phone}
            onCheckedChange={(checked) => handleCheckboxChange("phone", checked as boolean)}
          />
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-8">
        <p className="text-yellow-800 text-center text-sm">
          <strong>Warning:</strong> Modifying these settings may result in fewer captured sales leads. Visitors will
          still use your chat and voice minutes, but without collecting contact details, you may miss opportunities to
          follow up and convert them into customers.
        </p>
      </div>

      <ActionButtons />
    </div>
  )
}
