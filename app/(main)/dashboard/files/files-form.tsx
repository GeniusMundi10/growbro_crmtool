"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { getAIFiles, uploadAIFileToStorage, upsertAIFile, deleteAIFile, AIFile, supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Files as FilesIcon } from "lucide-react";
import HelpButton from "@/components/help-button";
import ActionButtons from "@/components/action-buttons";
import { Upload, Trash2 } from "lucide-react";

// Define the worker API endpoint for incremental file addition
const WORKER_API_URL = process.env.NEXT_PUBLIC_WORKER_API_URL || "https://growbro-vectorstore-worker.fly.dev";

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
    
    // Track files that were successfully uploaded to storage
    const uploadedFiles = [];
    
    // Step 1: Upload all files to storage first
    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const uploadResult = await uploadAIFileToStorage(aiId, file);
      if (!uploadResult) {
        toast.error(`Failed to upload file: ${file.name}`);
        continue;
      }
      
      // Store file info for later DB insertion (after vectorstore processing)
      uploadedFiles.push({
        file,
        uploadResult,
        fileInfo: {
          url: uploadResult.url,
          file_path: uploadResult.file_path,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
        }
      });
      
      toast.success(`Uploaded to storage: ${file.name}`);
    }
    
    // Step 2: Process files with the vectorstore before adding to DB
    if (aiId && uploadedFiles.length > 0) {
      try {
        // Show processing toast
        const processingToast = toast.loading("Processing files for your AI knowledge base...");
        
        // Extract just the URLs for the API call
        const uploadedFileUrls = uploadedFiles.map(f => f.uploadResult.url);
        
        const response = await fetch(`${WORKER_API_URL}/add-files`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ai_id: aiId,
            file_urls: uploadedFileUrls
          })
        });
        
        const result = await response.json();
        
        // Dismiss processing toast
        toast.dismiss(processingToast);
        
        if (response.ok) {
          // Step 3: Only NOW add the files to the ai_files table AFTER successful vectorstore processing
          let successCount = 0;
          
          for (const uploadedFile of uploadedFiles) {
            const dbResult = await upsertAIFile(aiId, user.id, uploadedFile.fileInfo);
            if (dbResult) {
              successCount++;
            } else {
              toast.error(`Failed to save file info for: ${uploadedFile.file.name}`);
            }
          }
          
          // Show success message
          toast.success(`Successfully processed ${result.analytics?.successfully_processed || 0} files and saved ${successCount} to database`);
          // Refresh the file list
          loadFiles();
        } else {
          toast.error(`Error processing files: ${result.message || 'Unknown error'}`);
          
          // Notify user that files were uploaded to storage but not processed
          toast.error('Files were uploaded to storage but not added to the knowledge base');
        }
      } catch (error) {
        console.error('Error calling /add-files API:', error);
        toast.error('Failed to process files for AI knowledge base');
      }
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setUploading(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!aiId || !user?.id) return;
    const filesList = e.dataTransfer.files;
    setUploading(true);
    
    // Keep track of all uploaded file URLs to send to the /add-files endpoint
    const uploadedFileUrls = [];
    
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
        // Add the URL to our list for vectorstore processing
        uploadedFileUrls.push(uploadResult.url);
      }
    }
    
    // Use the incremental /add-files endpoint instead of triggering a full rebuild
    if (aiId && uploadedFileUrls.length > 0) {
      try {
        // Show processing toast
        const processingToast = toast.loading("Processing files for your AI knowledge base...");
        
        const response = await fetch(`${WORKER_API_URL}/add-files`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ai_id: aiId,
            file_urls: uploadedFileUrls
          })
        });
        
        const result = await response.json();
        
        // Dismiss processing toast
        toast.dismiss(processingToast);
        
        if (result.status === "success") {
          toast.success(`Added ${result.added_count} file(s) to your knowledge base`);
        } else {
          toast.error(`Failed to process files: ${result.message || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Error adding files to vectorstore:", error);
        toast.error("Failed to process files. Please try again later.");
      }
    }
    
    await loadFiles();
    setUploading(false);
  };

  const handleDelete = async (file: AIFile) => {
    setUploading(true);
    
    // First delete the file from storage and database
    const ok = await deleteAIFile(file.id, file.file_path);
    if (!ok) {
      toast.error("Failed to delete file from storage.");
      setUploading(false);
      return;
    }
    
    // Then call the /remove-files endpoint to update the vectorstore
    try {
      const response = await fetch(`${WORKER_API_URL}/remove-files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ai_id: aiId,
          file_urls: [file.url] // Send the file URL to be removed from vectorstore
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.status === 'success') {
        toast.success(`File deleted and removed from AI knowledge base. ${result.deleted_count} chunks removed.`);
      } else {
        console.error("Error removing file from vectorstore:", result);
        toast.error("File deleted from storage but may still appear in AI responses.");
      }
      
      await loadFiles();
    } catch (error) {
      console.error("Error calling /remove-files endpoint:", error);
      toast.error("File deleted from storage but may still appear in AI responses.");
      await loadFiles();
    }
    
    setUploading(false);
  };

  return (
    <Card className="overflow-hidden border-none shadow-md">
      <CardHeader className="bg-gradient-to-r from-emerald-900 to-green-800 text-white">
        <CardTitle className="flex items-center text-2xl">
          <FilesIcon className="mr-2 h-5 w-5" />
          Upload Your Files
        </CardTitle>
        <CardDescription className="text-emerald-100">
          Add documents that train your AI assistant. Changes and processing run automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-800">6. Upload Your Files</h2>
          <HelpButton />
        </div>
        <div className="mb-6">
          <p className="text-slate-600">
            The files you add here will train your AI agent, so include as many as you possibly can about your business.
            You can always come back and add more files whenever you want.
          </p>
        </div>
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-8 min-h-[180px] flex flex-col items-center justify-center cursor-pointer hover:border-green-400 hover:bg-green-50/40"
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
      </CardContent>
    </Card>
  );
}
