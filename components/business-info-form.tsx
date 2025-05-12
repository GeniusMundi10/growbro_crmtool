"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle } from "lucide-react"

export default function BusinessInfoForm() {
  const [formData, setFormData] = useState({
    aiName: "John Doe",
    companyName: "Genius Mundi",
    website: "growbro.ai",
    email: "mundigenius@gmail.com",
    calendarLink: "",
    phoneNumber: "9898567160",
    agentType: "information-education",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically save the data to Supabase
    console.log("Form submitted:", formData)
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">1. Business Info</h2>
        <div className="flex items-center text-green-500">
          <HelpCircle className="h-5 w-5 mr-1" />
          <span>Help</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="aiName">AI Name:</Label>
            <Input id="aiName" name="aiName" value={formData.aiName} onChange={handleChange} className="mt-1" />
          </div>

          <div>
            <Label htmlFor="companyName">Company Name:</Label>
            <Input
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="website">Website:</Label>
            <div className="flex items-center mt-1">
              <Input id="website" name="website" value={formData.website} onChange={handleChange} className="flex-1" />
              <Button type="button" variant="outline" className="ml-2 bg-purple-600 text-white hover:bg-purple-700">
                Retrain
              </Button>
              <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 text-xs rounded">In Progress</span>
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email to receive conversation summaries:</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="calendarLink">Calendar Link:</Label>
            <Input
              id="calendarLink"
              name="calendarLink"
              value={formData.calendarLink}
              onChange={handleChange}
              placeholder="Calendar Link"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="phoneNumber">Phone Number:</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="mt-1"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="agentType">Agent Type:</Label>
            <Select value={formData.agentType} onValueChange={(value) => handleSelectChange("agentType", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select agent type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="information-education">Information & Education</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="lead-generation">Lead Generation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end mt-8 space-x-4">
          <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
            Save Changes
          </Button>
          <Button type="button" variant="outline" className="bg-purple-700 text-white hover:bg-purple-800">
            Customize Chat
          </Button>
          <Button type="button" variant="outline" className="bg-blue-500 text-white hover:bg-blue-600">
            Test AI
          </Button>
        </div>
      </form>
    </div>
  )
}
