"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { getAIFiles, uploadAIFileToStorage, upsertAIFile, deleteAIFile, AIFile } from "@/lib/supabase";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import HelpButton from "@/components/help-button";
import ActionButtons from "@/components/action-buttons";
import { Upload, Trash2 } from "lucide-react";

export default function FilesForm() {
  const searchParams = useSearchParams();
  const aiId = searchParams.get("aiId");
  const { user } = useUser();
  const [files, setFiles] = useState<AIFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (aiId) {
      loadFiles();
    }
    // eslint-disable-next-line
  }, [aiId]);

  async function loadFiles() {
    setLoading(true);
    const data = await getAIFiles(aiId!);
    setFiles(data);
    setLoading(false);
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList || !aiId || !user?.id) return;
    setUploading(true);
    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const uploadResult = await uploadAIFileToStorage(aiId, file);
      if (!uploadResult) {
        toast.error(`Failed to upload file: ${file.name}`);
        continue;
      }
      const dbResult = await upsertAIFile(aiId, user.id, {
        url: uploadResult.url,
        file_path: uploadResult.file_path,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      });
      if (!dbResult) {
        toast.error(`Failed to save file info: ${file.name}`);
      } else {
        toast.success(`Uploaded: ${file.name}`);
      }
    }
    await loadFiles();
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!aiId || !user?.id) return;
    const filesList = e.dataTransfer.files;
    setUploading(true);
    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const uploadResult = await uploadAIFileToStorage(aiId, file);
      if (!uploadResult) {
        toast.error(`Failed to upload file: ${file.name}`);
        continue;
      }
      const dbResult = await upsertAIFile(aiId, user.id, {
        url: uploadResult.url,
        file_path: uploadResult.file_path,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      });
      if (!dbResult) {
        toast.error(`Failed to save file info: ${file.name}`);
      } else {
        toast.success(`Uploaded: ${file.name}`);
      }
    }
    await loadFiles();
    setUploading(false);
  };

  const handleDelete = async (file: AIFile) => {
    setUploading(true);
    const ok = await deleteAIFile(file.id, file.file_path);
    if (ok) {
      toast.success("File deleted.");
      await loadFiles();
    } else {
      toast.error("Failed to delete file.");
    }
    setUploading(false);
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">6. Upload Your Files</h2>
        <HelpButton />
      </div>
      <div className="mb-6">
        <p className="text-gray-700">
          The files you add here will train your AI agent, so include as many as you possibly can about your business. You can always come back and add more files whenever you want.
        </p>
      </div>
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-8 min-h-[180px] flex flex-col items-center justify-center cursor-pointer hover:border-purple-400"
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        style={{ background: uploading ? '#f3f4f6' : undefined }}
      >
        <Upload className="h-10 w-10 text-gray-400 mb-3" />
        <p className="text-gray-600">Drag and drop or select files to train your AI</p>
        <p className="text-xs text-gray-400 mt-1">Supported: DOC, TXT, XLS, PDF, etc. (max 5 at a time)</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
          accept=".doc,.docx,.txt,.xls,.xlsx,.pdf,.csv,.md,.rtf,.ppt,.pptx,.json,.xml"
        />
      </div>
      {loading ? (
        <div className="text-center text-gray-500">Loading files...</div>
      ) : files.length === 0 ? (
        <div className="text-center text-gray-400">No files uploaded yet.</div>
      ) : (
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between border rounded p-3 bg-gray-50">
                <div className="truncate max-w-[70%]">
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                    {file.file_name}
                  </a>
                  <div className="text-xs text-gray-500">{file.file_type || 'Unknown type'} • {(file.file_size ? (file.file_size/1024).toFixed(1) : '?')} KB</div>
                </div>
                <Button size="icon" variant="destructive" onClick={() => handleDelete(file)} disabled={uploading}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      <ActionButtons 
  showCustomize={true}
  onCustomize={() => {
    if (aiId) window.location.href = `/customize?aiId=${aiId}`;
  }}
showSave={false} saving={uploading} />
    </div>
  );
}
