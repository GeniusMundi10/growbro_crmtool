"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useUser } from "@/context/UserContext"
import { getAIServices, upsertAIServices } from "@/lib/supabase"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import HelpButton from "@/components/help-button"
import ActionButtons from "@/components/action-buttons"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Briefcase } from "lucide-react"

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
    const data = await getAIServices(aiId!, user!.id);
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
  };

  // Autosave services when fields change (debounced 800ms)
  const firstRenderRef = useRef(true);
  useEffect(() => {
    if (loading) return;
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    const t = setTimeout(() => {
      handleSave();
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields]);

  if (loading) {
    return <div className="text-center text-gray-500 py-10">Loading...</div>;
  }

  return (
    <Card className="overflow-hidden border-none shadow-md">
      <CardHeader className="bg-gradient-to-r from-emerald-900 to-green-800 text-white">
        <CardTitle className="flex items-center text-2xl">
          <Briefcase className="mr-2 h-5 w-5" />
          Your Business Services
        </CardTitle>
        <CardDescription className="text-emerald-100">
          Tell your AI about your offerings and differentiators. Changes save automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex items-center justify-end mb-6">
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
              <button type="button" className="text-blue-500 text-sm hover:underline">🎙️ Speak your answer</button>
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
              <button type="button" className="text-blue-500 text-sm hover:underline">🎙️ Speak your answer</button>
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
              <button type="button" className="text-blue-500 text-sm hover:underline">🎙️ Speak your answer</button>
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
              <button type="button" className="text-blue-500 text-sm hover:underline">🎙️ Speak your answer</button>
            </div>
          </div>
        </div>
        <ActionButtons
          showCustomize={true}
          onCustomize={() => { if (aiId) window.location.href = `/customize?aiId=${aiId}`; }}
          showSave={false}
          saving={saving}
        />
      </CardContent>
    </Card>
  );
}
