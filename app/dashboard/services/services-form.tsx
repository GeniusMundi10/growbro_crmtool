"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useUser } from "@/context/UserContext"
import { getAIServices, upsertAIServices } from "@/lib/supabase"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import HelpButton from "@/components/help-button"
import ActionButtons from "@/components/action-buttons"
import { Button } from "@/components/ui/button"

export default function ServicesForm() {
  const searchParams = useSearchParams();
  const aiId = searchParams.get("aiId");
  const { user } = useUser();
  const [fields, setFields] = useState({
    business_services: "",
    differentiation: "",
    profitable_line_items: "",
    best_sales_lines: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (aiId && user?.id) {
      loadServices();
    }
    // eslint-disable-next-line
  }, [aiId, user?.id]);

  async function loadServices() {
    setLoading(true);
    const data = await getAIServices(aiId, user.id);
    setFields({
      business_services: data?.business_services || "",
      differentiation: data?.differentiation || "",
      profitable_line_items: data?.profitable_line_items || "",
      best_sales_lines: data?.best_sales_lines || "",
    });
    setLoading(false);
  }

  function handleChange(field: string, value: string) {
    setFields({ ...fields, [field]: value });
  }

  async function handleSave() {
    if (!aiId || !user?.id) return;
    setSaving(true);
    const data = await upsertAIServices(aiId, user.id, fields);
    if (data) {
      toast.success("Services saved!");
    } else {
      toast.error("Failed to save services");
    }
    setSaving(false);
  }

  if (loading) {
    return <div className="text-center text-gray-500 py-10">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">9. Your Business Services</h2>
        <HelpButton />
      </div>
      <div className="space-y-8 mb-8">
        <div>
          <h3 className="font-medium mb-2">What services or products does your business provide?</h3>
          <Textarea
            value={fields.business_services}
            onChange={e => handleChange("business_services", e.target.value)}
            placeholder="Describe the services or products your business offers"
            className="min-h-[100px]"
          />
          <div className="flex justify-end mt-1">
            <button
              type="button"
              // onClick={() => handleSpeakAnswer("business_services")}
              className="text-blue-500 text-sm hover:underline"
            >
              🎙️ Speak your answer
            </button>
          </div>
        </div>
        <div>
          <h3 className="font-medium mb-2">How are you different from your competitors?</h3>
          <Textarea
            value={fields.differentiation}
            onChange={e => handleChange("differentiation", e.target.value)}
            placeholder="Explain what sets your business apart from competitors"
            className="min-h-[100px]"
          />
          <div className="flex justify-end mt-1">
            <button
              type="button"
              // onClick={() => handleSpeakAnswer("differentiation")}
              className="text-blue-500 text-sm hover:underline"
            >
              🎙️ Speak your answer
            </button>
          </div>
        </div>
        <div>
          <h3 className="font-medium mb-2">What are your most profitable line items?</h3>
          <Textarea
            value={fields.profitable_line_items}
            onChange={e => handleChange("profitable_line_items", e.target.value)}
            placeholder="List the most profitable products or services your business offers"
            className="min-h-[100px]"
          />
          <div className="flex justify-end mt-1">
            <button
              type="button"
              // onClick={() => handleSpeakAnswer("profitable_line_items")}
              className="text-blue-500 text-sm hover:underline"
            >
              🎙️ Speak your answer
            </button>
          </div>
        </div>
        <div>
          <h3 className="font-medium mb-2">What are your 5 best sales lines to close a deal?</h3>
          <Textarea
            value={fields.best_sales_lines}
            onChange={e => handleChange("best_sales_lines", e.target.value)}
            placeholder="Share your top sales lines that help close deals"
            className="min-h-[100px]"
          />
          <div className="flex justify-end mt-1">
            <button
              type="button"
              // onClick={() => handleSpeakAnswer("best_sales_lines")}
              className="text-blue-500 text-sm hover:underline"
            >
              🎙️ Speak your answer
            </button>
          </div>
        </div>
      </div>
      <div className="flex justify-center mb-8">
        <Button
          className="bg-green-600 text-white hover:bg-green-700"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
      <ActionButtons
        showCustomize={true}
        onCustomize={() => { if (aiId) window.location.href = `/customize?aiId=${aiId}`; }}
        showSave={false}
        saving={saving}
      />
    </div>
  );
}
