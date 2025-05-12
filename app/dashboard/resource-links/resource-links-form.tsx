"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Plus } from "lucide-react"
import HelpButton from "@/components/help-button"
import ActionButtons from "@/components/action-buttons"

export default function ResourceLinksForm() {
  const [isDragging, setIsDragging] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.name.endsWith(".csv")) {
        setCsvFile(file)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0])
    }
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">7. Add Resource Links</h2>
        <HelpButton />
      </div>

      <div className="mb-6">
        <p className="text-gray-700">
          You can either add links manually with the button below, or upload our CSV template filled with links. But you
          have to choose one or the other. These links will be provided by your AI agent to website visitors as
          resources. For example, if someone asks about filmmaking, the AI would use that "category" to say: You might
          want to check out my film production company Delphia Films at this link: https://delphiafilms.com
        </p>
      </div>

      <div className="flex justify-end mb-4">
        <Button variant="outline" className="text-purple-600 border-purple-600 hover:bg-purple-50">
          Download Sample CSV File
        </Button>
      </div>

      <div className="flex justify-center mb-8">
        <div
          className={`border-2 border-dashed rounded-lg p-8 w-full max-w-xl h-48 flex flex-col items-center justify-center cursor-pointer ${
            isDragging ? "border-purple-500 bg-purple-50" : "border-gray-300"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("csv-upload")?.click()}
        >
          <Upload className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-center">Select or drag and drop a CSV file</p>
          <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      {csvFile && (
        <div className="mb-8">
          <p className="text-sm text-gray-600">
            Selected file: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
          </p>
        </div>
      )}

      <div className="flex justify-center mb-8">
        <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50">
          <Plus className="h-4 w-4 mr-2" />
          Add Resources
        </Button>
      </div>

      <ActionButtons />
    </div>
  )
}
