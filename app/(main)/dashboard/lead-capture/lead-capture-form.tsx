"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import HelpButton from "@/components/help-button"
import ActionButtons from "@/components/action-buttons"
import { useUser } from "@/context/UserContext"
import { getLeadCapture, createLeadCapture, updateLeadCapture } from "@/lib/supabase"
import { toast } from "sonner"

export default function LeadCaptureForm() {
  const searchParams = useSearchParams();
  const aiId = searchParams.get('aiId');
  const { user } = useUser();
  const [captureSettings, setCaptureSettings] = useState({
    name: true,
    email: true,
    phone: true,
  });
  const [leadCaptureId, setLeadCaptureId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!aiId) {
      setLoading(false);
      setError("No AI selected. Please select an AI from the sidebar.");
      return;
    }
    if (user && aiId) {
      loadLeadCaptureSettings();
    }
    // eslint-disable-next-line
  }, [user, aiId]);

  const loadLeadCaptureSettings = async () => {
    if (!aiId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getLeadCapture(aiId);
      if (data) {
        setLeadCaptureId(data.id);
        setCaptureSettings(data.form_config || {
          name: true,
          email: true,
          phone: true,
        });
      } else {
        setLeadCaptureId(null);
        setCaptureSettings({
          name: true,
          email: true,
          phone: true,
        });
      }
    } catch (err) {
      setError("Failed to load lead capture settings. Please try again or contact support.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setCaptureSettings((prev) => ({
      ...prev,
      [field]: checked,
    }));
  };

  const saveSettings = async () => {
    if (!aiId) {
      toast.error("AI not identified");
      return;
    }
    setSaving(true);
    try {
      let success = false;
      if (leadCaptureId) {
        // Update existing record
        success = await updateLeadCapture({
          id: leadCaptureId,
          form_config: captureSettings
        });
      } else {
        // Create new record
        if (!user?.id) {
          toast.error("User not identified. Please log in again.");
          setSaving(false);
          return;
        }
        const result = await createLeadCapture(aiId, {
          user_id: user.id,
          form_config: captureSettings
        });
        success = !!result;
        if (result) {
          setLeadCaptureId(result.id);
        }
      }
      if (success) {
        toast.success("Lead capture settings saved successfully");
      } else {
        toast.error("Failed to save lead capture settings");
      }
    } catch (error) {
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading lead capture settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 text-center border border-red-200">
        <p className="text-red-600 font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Step 2 of 3</p>
          <h2 className="text-xl font-bold">Customize Lead Capture</h2>
        </div>
        <h2 className="text-xl font-bold">2. Customize Lead Capture Settings</h2>
        <HelpButton />
      </div>

      <div className="mb-8">
        <p className="text-gray-700">
          Control what information your AI agent collects from website visitors. Choose whether to capture their name,
          email, and phone number, only some of this information, or none at all. Adjust these settings based on your
          business needs and lead generation strategy.
        </p>
      </div>

      <div className="space-y-6 mb-8">
        {[
          { key: "name", label: "Name", help: "Collect the visitor's name so you can personalise follow-ups." },
          { key: "email", label: "Email", help: "Capture an email address for direct outreach." },
          { key: "phone", label: "Phone Number", help: "Optionally gather a phone number for quick contact." },
        ].map(opt => (
          <div key={opt.key} className="flex items-start justify-between gap-4 p-4 rounded-lg border hover:bg-gray-50">
            <div>
              <p className="font-medium">{opt.label}</p>
              <p className="text-sm text-gray-500 leading-snug">{opt.help}</p>
            </div>
            <Switch
              checked={captureSettings[opt.key as keyof typeof captureSettings]}
              onCheckedChange={(checked) => handleCheckboxChange(opt.key, checked as boolean)}
            />
          </div>
        ))}
      </div>

      <Alert className="mb-8" variant="default">
        <AlertTriangle className="h-4 w-4" />
        <div>
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>
            Reducing the amount of information you capture may lower your lead count. Visitors will still consume chat minutes, but you’ll have fewer details for follow-up.
          </AlertDescription>
        </div>
      </Alert>

      <ActionButtons
        showSave={true}
        onSave={saveSettings}
        saving={saving}
        showCustomize={true}
        onCustomize={() => {
          if (aiId) window.location.href = `/customize?aiId=${aiId}`;
        }}
      />
    </div>
  );
}
