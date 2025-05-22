"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useUser } from "@/context/UserContext"
import { getResourceLinkCSV, uploadResourceLinkCSVToStorage, upsertResourceLinkCSV, deleteResourceLinkCSV, AIResourceLinkCSV } from "@/lib/supabase"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Upload, Trash2 } from "lucide-react"
import HelpButton from "@/components/help-button"
import ActionButtons from "@/components/action-buttons"

export default function ResourceLinksForm() {
  const searchParams = useSearchParams();
  const aiId = searchParams.get("aiId");
  const { user } = useUser();
  const [isDragging, setIsDragging] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [currentCSV, setCurrentCSV] = useState<AIResourceLinkCSV | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (aiId && user?.id) {
      loadCurrentCSV();
    }
    // eslint-disable-next-line
  }, [aiId, user?.id]);

  async function loadCurrentCSV() {
    setLoading(true);
    const data = await getResourceLinkCSV(aiId!, user!.id);
    setCurrentCSV(data);
    setLoading(false);
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!aiId || !user?.id) return;
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith(".csv")) {
      await handleUpload(file);
    } else {
      toast.error("Please upload a .csv file");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith(".csv")) {
      await handleUpload(file);
    } else {
      toast.error("Please upload a .csv file");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async (file: File) => {
    if (!aiId || !user?.id) return;
    setUploading(true);
    // Remove previous CSV if exists
    if (currentCSV) {
      await deleteResourceLinkCSV(currentCSV.id, currentCSV.file_path);
    }
    const uploadResult = await uploadResourceLinkCSVToStorage(aiId, user.id, file);
    if (!uploadResult) {
      toast.error("Failed to upload CSV file");
      setUploading(false);
      return;
    }
    const dbResult = await upsertResourceLinkCSV(aiId, user.id, {
      url: uploadResult.url,
      file_path: uploadResult.file_path,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
    });
    if (!dbResult) {
      toast.error("Failed to save CSV info");
    } else {
      toast.success("CSV uploaded and saved");
      setCurrentCSV(dbResult);
    }
    setUploading(false);
  };

  const handleDelete = async () => {
    if (!currentCSV) return;
    setUploading(true);
    const ok = await deleteResourceLinkCSV(currentCSV.id, currentCSV.file_path);
    if (ok) {
      toast.success("CSV deleted");
      setCurrentCSV(null);
    } else {
      toast.error("Failed to delete CSV");
    }
    setUploading(false);
  };

  // Download sample CSV from public-assets bucket
  const sampleCSVUrl = "https://ksoldxvgeqtkatezdwnv.supabase.co/storage/v1/object/public/public-assets//sample-csv-file-format.csv";

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">7. Add Resource Links</h2>
        <HelpButton />
      </div>
      <div className="mb-6">
        <p className="text-gray-700">
          You can either add links manually with the button below, or upload our CSV template filled with links. But you have to choose one or the other. These links will be provided by your AI agent to website visitors as resources. For example, if someone asks about filmmaking, the AI would use that "category" to say: You might want to check out my film production company Delphia Films at this link: https://delphiafilms.com
        </p>
      </div>
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          className="text-purple-600 border-purple-600 hover:bg-purple-50"
          asChild
        >
          <a href={sampleCSVUrl} download target="_blank" rel="noopener noreferrer">
            Download Sample CSV File
          </a>
        </Button>
      </div>
      <div className="flex justify-center mb-8">
        <div
          className={`border-2 border-dashed rounded-lg p-8 w-full max-w-xl h-48 flex flex-col items-center justify-center cursor-pointer ${isDragging ? "border-purple-500 bg-purple-50" : "border-gray-300"}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{ background: uploading ? '#f3f4f6' : undefined }}
        >
          <Upload className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-center">Select or drag and drop a CSV file</p>
          <input ref={fileInputRef} id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
        </div>
      </div>
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : currentCSV ? (
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between border rounded p-3 bg-gray-50">
          <div>
            <span className="text-sm text-gray-700">Current CSV: </span>
            <a href={currentCSV.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {currentCSV.file_name}
            </a>
            <span className="ml-2 text-xs text-gray-500">({(currentCSV.file_size ? (currentCSV.file_size/1024).toFixed(1) : '?')} KB)</span>
          </div>
          <div className="flex gap-2 mt-2 md:mt-0">
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={uploading}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      ) : null}
      <ActionButtons 
  showCustomize={true}
  onCustomize={() => {
    if (aiId) window.location.href = `/customize?aiId=${aiId}`;
  }}
showSave={false} saving={uploading} />
    </div>
  );
}
