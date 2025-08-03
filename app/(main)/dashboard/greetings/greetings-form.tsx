"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useUser } from "@/context/UserContext"
import { getAIGreetings, upsertAIGreetings, deleteAIGreetingByLabel, AIGreeting } from "@/lib/supabase"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import HelpButton from "@/components/help-button"
import ActionButtons from "@/components/action-buttons"

const DEFAULT_LABELS = [
  "First Greeting",
  "Second Greeting",
  "Third Greeting",
  "Fourth Greeting",
  "Fifth Greeting"
];

interface GreetingSlot {
  id: string;
  label: string;
  message: string;
  isCustom?: boolean;
}

export default function GreetingsForm() {
  const searchParams = useSearchParams();
  const aiId = searchParams.get("aiId");
  const { user } = useUser();
  const [greetings, setGreetings] = useState<GreetingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Skip first render for autosave
  const firstRenderRef = useRef(true);

  useEffect(() => {
    if (aiId && user?.id) {
      loadGreetings();
    }
    // eslint-disable-next-line
  }, [aiId, user?.id]);

  async function loadGreetings() {
    setLoading(true);
    const data = await getAIGreetings(aiId!);
    // Merge backend data into defaults by label
    let merged: GreetingSlot[] = DEFAULT_LABELS.map((label, i) => {
      const found = data?.find(g => g.label === label);
      return found
        ? { id: found.id || (i + 1).toString(), label, message: found.message, isCustom: false }
        : { id: (i + 1).toString(), label, message: '', isCustom: false };
    });
    // Add any custom greetings
    if (data) {
      let customId = 6;
      for (const g of data) {
        if (!DEFAULT_LABELS.includes(g.label)) {
          merged.push({ id: g.id || String(customId++), label: g.label, message: g.message, isCustom: true });
        }
      }
    }
    setGreetings(merged);
    setLoading(false);
  }

  const handleGreetingChange = (id: string, value: string) => {
    const idx = greetings.findIndex(g => g.id === id);
    if (idx === -1) return;
    const updated = greetings.map((g, i) => i === idx ? { ...g, message: value } : g);
    setGreetings(updated);
  };

  // Save all greetings (non-empty) in bulk
  const handleSave = async () => {
    if (!aiId || !user?.id) return;
    setSaving(true);
    const toSave = greetings.filter(g => g.message.trim() !== "").map(g => ({ label: g.label, message: g.message }));
    // Delete cleared greetings from backend
    const toDelete = greetings.filter(g => g.message.trim() === "");
    let deleteSuccess = true;
    for (const g of toDelete) {
      const ok = await deleteAIGreetingByLabel(user.id, aiId, g.label);
      if (!ok) deleteSuccess = false;
    }
    if (toSave.length > 0) {
      const ok = await upsertAIGreetings(aiId, user.id, toSave);
      if (ok) {
        toast.success("Greetings saved!");
      } else {
        toast.error("Failed to save greetings");
      }
    } else if (deleteSuccess) {
      toast.success("Greetings updated!");
    }
    setSaving(false);
    await loadGreetings();
    // Reset first-render flag so autosave waits for next user change
    firstRenderRef.current = true;
  };


  const handleAddGreeting = () => {
    // Add a new custom slot with unique label
    const customCount = greetings.filter(g => g.label.startsWith("Custom Greeting")).length + 1;
    const newId = (Math.max(0, ...greetings.map(g => Number(g.id)).filter(n => !isNaN(n))) + 1).toString();
    setGreetings([
      ...greetings,
      { id: newId, label: `Custom Greeting ${customCount}`, message: '', isCustom: true }
    ]);
  };

  const handleRemoveGreeting = async (idx: number) => {
    const g = greetings[idx];
    if (!g) return;
    if (aiId && user?.id) {
      const deleted = await deleteAIGreetingByLabel(user.id, aiId, g.label);
      if (deleted) {
        setGreetings(greetings.filter((_, i) => i !== idx));
        toast.success("Greeting deleted");
      } else {
        toast.error("Failed to delete greeting");
      }
    } else {
      setGreetings(greetings.filter((_, i) => i !== idx));
    }
  };

  // Autosave greetings when they change (debounced 1000ms)
  useEffect(() => {
    if (loading || saving) return;
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    const t = setTimeout(() => {
      handleSave();
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [greetings]);

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">8. Add Your Customer Greetings</h2>
        <HelpButton />
      </div>
      <div className="space-y-4 mb-8">
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : greetings.map((greeting, index) => (
          <div key={greeting.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            <div className="md:col-span-1">
              <span className="text-gray-700">{greeting.label}</span>
            </div>
            <div className="md:col-span-3">
              <Input
                value={greeting.message}
                onChange={async (e) => await handleGreetingChange(greeting.id, e.target.value)}
                placeholder="Enter greeting message"
              />
            </div>
            <div className="md:col-span-1 flex justify-end">
              {greeting.isCustom && (
                <Button size="sm" variant="destructive" className="ml-2 px-2 py-0 text-xs" onClick={async () => await handleRemoveGreeting(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
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
      <ActionButtons 
        showCustomize={true}
        onCustomize={() => {
          if (aiId) window.location.href = `/customize?aiId=${aiId}`;
        }}
        showSave={false} saving={saving} 
      />
    </div>
  );
}
