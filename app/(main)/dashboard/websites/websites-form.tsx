"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useUser } from "@/context/UserContext"
import { getAIWebsites, upsertAIWebsites, deleteAIWebsiteByLabel, AIWebsite, supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import HelpButton from "@/components/help-button"
import ActionButtons from "@/components/action-buttons"

interface WebsiteEntry {
  id: string;
  label: string;
  url: string;
  isCustom?: boolean;
}

export default function WebsitesForm() {
  const searchParams = useSearchParams();
  const aiId = searchParams.get("aiId");
  const { user } = useUser();
  const DEFAULT_SLOTS: Omit<WebsiteEntry, 'id'>[] = [
    { label: "A sales meeting transcript", url: "" },
    { label: "Your company FAQ", url: "" },
    { label: "A podcast transcript", url: "" },
    { label: "Your Blog", url: "" },
    { label: "A news article about you", url: "" },
  ];
  const DEFAULT_SLOT_IDS = ["1", "2", "3", "4", "5"]; // for consistency
  const [websites, setWebsites] = useState<WebsiteEntry[]>([]);
  const [editingLabelIdx, setEditingLabelIdx] = useState<number | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (aiId) {
      loadWebsites();
    }
    // eslint-disable-next-line
  }, [aiId]);

  const loadWebsites = async () => {
    setLoading(true);
    const data = await getAIWebsites(aiId!);
    console.log("[WebsitesForm] Fetched websites from Supabase:", data); // DEBUG LOG
    // Merge backend data into defaults by label
    let merged = DEFAULT_SLOTS.map((slot, i) => {
      const found = data?.find(w => w.label === slot.label);
      return found
        ? { id: found.id || DEFAULT_SLOT_IDS[i], label: slot.label, url: found.url, isCustom: false }
        : { id: DEFAULT_SLOT_IDS[i], label: slot.label, url: '', isCustom: false };
    });
    // Add any custom slots (not in defaults)
    if (data) {
      let customId = 6;
      for (const w of data) {
        if (!DEFAULT_SLOTS.some(slot => slot.label === w.label)) {
          merged.push({ id: w.id || String(customId++), label: w.label, url: w.url, isCustom: true });
        }
      }
    }
    setWebsites(merged);
    setLoading(false);
  };


  const handleUrlChange = async (id: string, value: string) => {
    const target = websites.find((website) => website.id === id);
    if (!target) return;
    // If value is cleared, delete from backend
    if (value.trim() === "" && aiId && user?.id) {
      const deleted = await deleteAIWebsiteByLabel(user.id, aiId, target.label);
      if (deleted) {
        // Set vectorstore_ready to false after delete
        await supabase
          .from("business_info")
          .update({ vectorstore_ready: false })
          .eq("id", aiId);
        // For custom slots, remove from state; for default, just clear url
        if (target.isCustom) {
          setWebsites(websites.filter((website) => website.id !== id));
        } else {
          setWebsites(websites.map((website) => website.id === id ? { ...website, url: "" } : website));
        }
        toast.success("Website entry deleted");
      } else {
        toast.error("Failed to delete website entry");
      }
    } else {
      setWebsites(websites.map((website) => (website.id === id ? { ...website, url: value } : website)));
    }
  };


  const handleAddWebsite = () => {
    // Add a new custom slot with a unique label and incremented string id
    const ids = websites.map(w => Number(w.id)).filter(n => !isNaN(n));
    const newId = ids.length > 0 ? (Math.max(...ids) + 1).toString() : "6";
    const customCount = websites.filter(w => w.label.startsWith("Custom Website")).length + 1;
    setWebsites([
      ...websites,
      { id: newId, label: `Custom Website ${customCount}`, url: '', isCustom: true }
    ]);
  };



  // Save all website slots (default and custom) for the current user/ai_id
  const handleSave = async () => {
    if (!aiId || !user?.id) {
      toast.error("AI or user not identified");
      return;
    }
    setSaving(true);
    try {
      await upsertAIWebsites(aiId, user.id, websites);
      // Set vectorstore_ready to false after any save
      await supabase
        .from("business_info")
        .update({ vectorstore_ready: false })
        .eq("id", aiId);
      toast.success("Websites saved!");
    } catch (error) {
      toast.error("Failed to save websites");
    }
    setSaving(false);
  };

  const handleLabelEdit = (idx: number, value: string) => {
    setEditingLabelIdx(idx);
    setEditingLabelValue(value);
  };

  const handleLabelChange = (idx: number, value: string) => {
    setEditingLabelValue(value);
    setWebsites(websites.map((w, i) => i === idx ? { ...w, label: value } : w));
  };

  const handleLabelEditDone = () => {
    setEditingLabelIdx(null);
    setEditingLabelValue("");
  };

  const handleRemoveWebsite = async (idx: number) => {
    const website = websites[idx];
    if (!website) return;
    if (aiId && user?.id) {
      const deleted = await deleteAIWebsiteByLabel(user.id, aiId, website.label);
      if (deleted) {
        // Set vectorstore_ready to false after delete
        await supabase
          .from("business_info")
          .update({ vectorstore_ready: false })
          .eq("id", aiId);
        setWebsites(websites.filter((_, i) => i !== idx));
        toast.success("Website entry deleted");
      } else {
        toast.error("Failed to delete website entry");
      }
    } else {
      setWebsites(websites.filter((_, i) => i !== idx));
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading websites...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">5. Add websites for training</h2>
        <HelpButton />
      </div>

      <div className="mb-6">
        <p className="text-gray-700">
          Our system will extract the text from the website links you add to train your AI agent. So make sure the links
          you add are either text based, or transcripts.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {websites.map((website, idx) => (
          <div key={website.id || idx} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            <div className="md:col-span-1 flex items-center gap-2">
              {website.isCustom && editingLabelIdx === idx ? (
                <Input
                  value={editingLabelValue}
                  onChange={e => handleLabelChange(idx, e.target.value)}
                  onBlur={handleLabelEditDone}
                  onKeyDown={e => { if (e.key === 'Enter') handleLabelEditDone(); }}
                  autoFocus
                />
              ) : (
                <span className="text-gray-700">
                  {website.label}
                  {website.isCustom && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-2 px-1 py-0 text-xs"
                      onClick={() => handleLabelEdit(idx, website.label)}
                    >
                      ✏️
                    </Button>
                  )}
                </span>
              )}
            </div>
            <div className="md:col-span-3">
              <Input
                value={website.url}
                onChange={async (e) => await handleUrlChange(website.id, e.target.value) }
                placeholder="https://example.com"
              />
            </div>
            <div className="md:col-span-1 flex justify-end">
              {website.isCustom && (
                <Button size="sm" variant="destructive" className="ml-2 px-2 py-0 text-xs" onClick={async () => await handleRemoveWebsite(idx)}>Delete</Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mb-8">
        <Button
          variant="outline"
          className="border-purple-600 text-purple-600 hover:bg-purple-50"
          onClick={handleAddWebsite}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add URL
        </Button>
      </div>

      <ActionButtons 
  showCustomize={true}
  onCustomize={() => {
    if (aiId) window.location.href = `/customize?aiId=${aiId}`;
  }}
showSave={true} onSave={handleSave} saving={saving} />
    </div>
  );
}