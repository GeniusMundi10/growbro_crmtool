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
import ActionButtons from "@/components/action-buttons";

export default function PhotoForm() {
  const searchParams = useSearchParams();
  const aiId = searchParams.get("aiId");
  const { user } = useUser();
  const [photos, setPhotos] = useState<AIPhoto[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [pendingSelectedPhotoId, setPendingSelectedPhotoId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
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
    setPendingSelectedPhotoId(selected ? selected.id : null);
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

  const handleSelect = (photoId: string) => {
    setPendingSelectedPhotoId(photoId);
  };

  const handleSave = async () => {
    if (!aiId || !pendingSelectedPhotoId || pendingSelectedPhotoId === selectedPhotoId) return;
    setSaving(true);
    const ok = await selectAIPhoto(pendingSelectedPhotoId, aiId);
    if (ok) {
      setSelectedPhotoId(pendingSelectedPhotoId);
      toast.success("Selected photo updated.");
      await loadPhotos();
    } else {
      toast.error("Failed to select photo.");
    }
    setSaving(false);
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
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">3. Give Your AI a Face</h2>
        <HelpButton />
      </div>
      <div className="mb-8">
        <p className="text-gray-700">
          Upload one or more profile photos for your AI assistant. Select one to be the active avatar in the chat widget.
        </p>
      </div>
      <div
        className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 mb-8 cursor-pointer hover:bg-gray-50"
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        style={{ minHeight: 180 }}
      >
        <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5M16 10a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <p className="text-gray-500">Select or drag and drop</p>
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
          <div className="text-center font-medium mb-3">Previously uploaded:</div>
          <div className="flex flex-row flex-wrap gap-8 justify-center mb-8">
            {photos.map(photo => (
              <div key={photo.id} className="flex flex-col items-center">
                <img
                  src={photo.url}
                  alt="AI Avatar"
                  className="h-24 w-24 object-cover rounded-full mb-2 border-2"
                  style={{ borderColor: photo.selected ? '#10b981' : '#e5e7eb' }}
                />
                <input
                  type="checkbox"
                  checked={pendingSelectedPhotoId === photo.id}
                  onChange={() => handleSelect(photo.id)}
                  disabled={uploading || saving}
                  className="mb-1"
                />
                <button
                  className="text-xs text-red-600 underline"
                  onClick={() => handleDelete(photo.id)}
                  disabled={uploading}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="flex flex-col items-center">
        <button
          className={`mt-2 px-6 py-2 rounded-md text-white font-semibold ${
            pendingSelectedPhotoId !== selectedPhotoId && !saving
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
          disabled={pendingSelectedPhotoId === selectedPhotoId || saving}
          onClick={handleSave}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      <ActionButtons
        showSave={false}
        showCustomize={true}
        showTest={true}
        onCustomize={() => {
          if (aiId) window.location.href = `/customize?aiId=${aiId}`;
        }}
      />
    </div>
  );
}

