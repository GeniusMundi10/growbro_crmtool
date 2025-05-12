"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import HelpButton from "@/components/help-button"
import ActionButtons from "@/components/action-buttons"

interface Greeting {
  id: string
  text: string
}

export default function GreetingsForm() {
  const [greetings, setGreetings] = useState<Greeting[]>([
    { id: "1", text: "" },
    { id: "2", text: "" },
    { id: "3", text: "" },
    { id: "4", text: "" },
    { id: "5", text: "" },
  ])

  const handleGreetingChange = (id: string, value: string) => {
    setGreetings(greetings.map((greeting) => (greeting.id === id ? { ...greeting, text: value } : greeting)))
  }

  const handleAddGreeting = () => {
    const newId = (Math.max(...greetings.map((g) => Number.parseInt(g.id))) + 1).toString()
    setGreetings([...greetings, { id: newId, text: "" }])
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">8. Add Your Customer Greetings</h2>
        <HelpButton />
      </div>

      <div className="space-y-4 mb-8">
        {greetings.map((greeting, index) => (
          <div key={greeting.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="md:col-span-1">
              <span className="text-gray-700">
                {index === 0
                  ? "First"
                  : index === 1
                    ? "Second"
                    : index === 2
                      ? "Third"
                      : index === 3
                        ? "Fourth"
                        : "Fifth"}{" "}
                Greeting
              </span>
            </div>
            <div className="md:col-span-3">
              <Input
                value={greeting.text}
                onChange={(e) => handleGreetingChange(greeting.id, e.target.value)}
                placeholder="Enter greeting message"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mb-8">
        <Button
          variant="outline"
          className="border-purple-600 text-purple-600 hover:bg-purple-50"
          onClick={handleAddGreeting}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Greeting
        </Button>
      </div>

      <ActionButtons />
    </div>
  )
}
