"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import {
  getAIPhotos,
  upsertAIPhoto,
  deleteAIPhoto,
  uploadAIPhotoToStorage,
  selectAIPhoto,
  AIPhoto
} from "@/lib/supabase";
import { toast } from "sonner";
import HelpButton from "@/components/help-button";
import { Upload, Trash2, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ActionButtons from "@/components/action-buttons";

export default function PhotoForm() {
  const searchParams = useSearchParams();
  const aiId = searchParams.get("aiId");
  const { user } = useUser();
  const [photos, setPhotos] = useState<AIPhoto[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (aiId) {
      loadPhotos();
    }
    // eslint-disable-next-line
  }, [aiId]);

  const loadPhotos = async () => {
    setLoading(true);
    const data = await getAIPhotos(aiId!);
    setPhotos(data);
    const selected = data.find(p => p.selected);
    setSelectedPhotoId(selected ? selected.id : null);
    setLoading(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !aiId || !user?.id) return;
    setUploading(true);
    const uploadResult = await uploadAIPhotoToStorage(aiId, file);
    if (!uploadResult) {
      toast.error("Failed to upload photo.");
      setUploading(false);
      return;
    }
    const dbResult = await upsertAIPhoto(aiId, user.id, uploadResult.url, uploadResult.file_path);
    if (!dbResult) {
      toast.error("Failed to save photo info.");
    } else {
      toast.success("Photo uploaded!");
      await loadPhotos();
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && fileInputRef.current) {
      fileInputRef.current.files = e.dataTransfer.files;
      handleFileChange({ target: fileInputRef.current } as any);
    }
  };

  const handleDelete = async (photoId: string) => {
    setUploading(true);
    const ok = await deleteAIPhoto(photoId);
    if (ok) {
      toast.success("Photo deleted.");
      await loadPhotos();
    } else {
      toast.error("Failed to delete photo.");
    }
    setUploading(false);
  };

  const handleSelect = async (photoId: string) => {
    if (!aiId || photoId === selectedPhotoId) return;
    const ok = await selectAIPhoto(photoId, aiId);
    if (ok) {
      setSelectedPhotoId(photoId);
      toast.success("Active photo updated.");
      await loadPhotos();
    } else {
      toast.error("Failed to select photo.");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading photos...</p>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-none shadow-md">
      <CardHeader className="bg-gradient-to-r from-emerald-900 to-green-800 text-white">
        <CardTitle className="flex items-center text-2xl">
          <ImageIcon className="mr-2 h-5 w-5" />
          AI Photos
        </CardTitle>
        <CardDescription className="text-emerald-100">
          Upload photos and choose one as your assistant's avatar. Changes save automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-800">Give Your AI a Face</h2>
          <HelpButton />
        </div>
        <div className="mb-8">
          <p className="text-slate-600">
            Upload photos for your AI assistant and click one to make it the active chat avatar. All changes save automatically.
          </p>
        </div>
        <div
          className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-10 mb-8 cursor-pointer transition-colors hover:border-green-400 hover:bg-green-50/40"
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          style={{ minHeight: 180 }}
        >
          <Upload className="w-12 h-12 text-gray-400 mb-2" strokeWidth={1.5} />
          <p className="text-gray-600 font-medium">Upload or drag & drop</p>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>
        {photos.length > 0 && (
          <>
            <div className="text-center font-medium mb-3">Your photos:</div>
            <div className="flex flex-wrap gap-2 mb-8">
              {photos.map(photo => (
                <div key={photo.id} className="group relative cursor-pointer" onClick={() => handleSelect(photo.id)}>
                  <img
                    src={photo.url}
                    alt="AI Avatar"
                    className={`h-24 w-24 object-cover rounded-full border-4 transition-transform duration-200 ${photo.selected ? 'border-green-500' : 'border-transparent'} group-hover:scale-105`}
                  />
                  {photo.selected && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-green-500 text-white text-[10px] flex items-center justify-center rounded-full">✓</span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                    disabled={uploading}
                    className="absolute bottom-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
        <ActionButtons
          showSave={false}
          showCustomize={true}
          showTest={true}
          onCustomize={() => {
            if (aiId) window.location.href = `/customize?aiId=${aiId}`;
          }}
        />
      </CardContent>
    </Card>
  );
}

