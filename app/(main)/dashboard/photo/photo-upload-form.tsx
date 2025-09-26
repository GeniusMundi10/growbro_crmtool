"use client"

import type React from "react"

import { useState } from "react"
import { Upload } from "lucide-react"
import HelpButton from "@/components/help-button"
import ActionButtons from "@/components/action-buttons"

export default function PhotoUploadForm() {
  const [image, setImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

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
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (event) => {
          if (event.target?.result) {
            setImage(event.target.result as string)
          }
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-end mb-6">
        <HelpButton />
      </div>

      <div className="flex justify-center mb-8">
        <div
          className={`border-2 border-dashed rounded-lg p-8 w-full max-w-xl h-64 flex flex-col items-center justify-center cursor-pointer ${
            isDragging ? "border-purple-500 bg-purple-50" : "border-gray-300"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("photo-upload")?.click()}
        >
          {image ? (
            <img src={image || "/placeholder.svg"} alt="AI Avatar" className="max-h-full max-w-full object-contain" />
          ) : (
            <>
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center">Select or drag and drop</p>
              <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </>
          )}
        </div>
      </div>

      <ActionButtons />
    </div>
  )
}
