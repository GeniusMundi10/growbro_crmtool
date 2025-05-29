"use client"

import type React from "react"

import { useState } from "react"
import { Upload } from "lucide-react"
import HelpButton from "@/components/help-button"
import ActionButtons from "@/components/action-buttons"

export default function FilesUploadForm() {
  const [files, setFiles] = useState<File[]>([])
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files)
      setFiles((prevFiles) => [...prevFiles, ...newFiles])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setFiles((prevFiles) => [...prevFiles, ...newFiles])
    }
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">6. Upload Your Files</h2>
        <HelpButton />
      </div>

      <div className="mb-6">
        <p className="text-gray-700">
          The files you add here will train your AI agent, so include as many as you possibly can about your business.
          You can always come back and add more files whenever you want.
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <div
          className={`border-2 border-dashed rounded-lg p-8 w-full max-w-xl h-64 flex flex-col items-center justify-center cursor-pointer ${
            isDragging ? "border-purple-500 bg-purple-50" : "border-gray-300"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-upload")?.click()}
        >
          <Upload className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-center mb-2">Drag and drop or select 5 files at a time to train your AI</p>
          <p className="text-gray-400 text-sm text-center">
            Supported files are DOC, TXT, XLS, PDF. You can come back to this section and upload as many files as you'd
            like to boost your AI's knowledge base, or update it as you get new information.
          </p>
          <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      {files.length > 0 && (
        <div className="mb-8">
          <h3 className="font-medium mb-2">Uploaded Files:</h3>
          <ul className="space-y-1">
            {files.map((file, index) => (
              <li key={index} className="text-sm text-gray-600">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </li>
            ))}
          </ul>
        </div>
      )}

      <ActionButtons />
    </div>
  )
}
