"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/context/UserContext";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Layers, ClipboardList, Clock, Save, Plus, Trash2 } from "lucide-react";

interface BusinessHoursDay {
  open: string;
  close: string;
  enabled: boolean;
}

interface BusinessHours {
  [key: string]: BusinessHoursDay;
}

type WorkflowType = "scheduled" | "request" | "custom";

type FormFieldType = "text" | "textarea" | "select" | "number" | "email" | "phone";

interface BookingService {
  key: string;
  name: string;
  workflow_type: WorkflowType;
  description?: string;
  active: boolean;
  channels: string[];
  duration_minutes?: number;
}

interface BookingFormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  helper_text?: string;
  options?: string[];
  service_keys: string[];
}

interface BookingConfig {
  version: number;
  enabled: boolean;
  industry_type: string;
  services: BookingService[];
  forms: BookingFormField[];
  labels: {
    dashboard_title: string;
    scheduled_tab: string;
    request_tab: string;
  };
  slot_settings: {
    duration_minutes: number;
  };
  request_settings: Record<string, any>;
  confirmation_templates: {
    scheduled: string;
    request: string;
  };
}

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const WORKFLOW_OPTIONS: { value: WorkflowType; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "request", label: "Request" },
  { value: "custom", label: "Custom" },
];

const SERVICE_CHANNELS = ["web", "whatsapp", "phone", "email"];

const LABEL_OPTIONS: Array<{
  value: string;
  label: string;
  dashboard_title: string;
  scheduled_tab: string;
  request_tab: string;
}> = [
  { value: "healthcare", label: "Healthcare", dashboard_title: "Patient Bookings", scheduled_tab: "Appointments", request_tab: "Consultations" },
  { value: "legal", label: "Legal Services", dashboard_title: "Client Bookings", scheduled_tab: "Scheduled Meetings", request_tab: "Consultations" },
  { value: "real_estate", label: "Real Estate", dashboard_title: "Property Bookings", scheduled_tab: "Viewings", request_tab: "Inquiries" },
  { value: "fitness", label: "Fitness & Wellness", dashboard_title: "Session Bookings", scheduled_tab: "Classes", request_tab: "Personal Training" },
  { value: "education", label: "Education", dashboard_title: "Student Bookings", scheduled_tab: "Lectures", request_tab: "Tutoring" },
  { value: "custom", label: "Custom", dashboard_title: "Bookings", scheduled_tab: "Scheduled", request_tab: "Requests" }
];

const FORM_FIELD_TYPES: FormFieldType[] = ["text", "textarea", "select", "number", "email", "phone"];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const generateServiceKey = (value: string) => {
  const base = slugify(value) || "service";
  return `${base}_${Math.random().toString(36).slice(2, 8)}`;
};

const generateFieldId = (value: string) => {
  const base = slugify(value) || "field";
  return `${base}_${Math.random().toString(36).slice(2, 8)}`;
};

const getDefaultBusinessHours = (): BusinessHours => {
  const hours: BusinessHours = {};
  DAYS.forEach((day) => {
    hours[day] = {
      open: "09:00",
      close: "18:00",
      enabled: day !== "sunday",
    };
  });
  return hours;
};

const getDefaultBookingConfig = (): BookingConfig => ({
  version: 1,
  enabled: false,
  industry_type: "custom",
  services: [],
  forms: [],
  labels: {
    dashboard_title: "Bookings",
    scheduled_tab: "Scheduled",
    request_tab: "Requests",
  },
  slot_settings: {
    duration_minutes: 30,
  },
  request_settings: {},
  confirmation_templates: {
    scheduled: "",
    request: "",
  },
});

const getButtonVariant = (selected: boolean) => (selected ? "default" : "outline");

const normalizeBookingConfig = (config?: Partial<BookingConfig>): BookingConfig => {
  const defaults = getDefaultBookingConfig();

  const services = Array.isArray(config?.services)
    ? config!.services.map((service) => {
        const key = service.key || generateServiceKey(service.name || "Service");
        const channels = Array.isArray(service.channels) && service.channels.length > 0 ? Array.from(new Set(service.channels)) : ["web"];
        return {
          key,
          name: service.name || "Untitled Service",
          workflow_type: (service.workflow_type as WorkflowType) || "scheduled",
          description: service.description || "",
          active: service.active ?? true,
          channels,
          duration_minutes: typeof service.duration_minutes === "number" ? service.duration_minutes : undefined,
        } satisfies BookingService;
      })
    : [];

  const validKeys = new Set(services.map((service) => service.key));

  const forms = Array.isArray(config?.forms)
    ? config!.forms.map((field) => {
        const type = (field.type as FormFieldType) || "text";
        const options = type === "select" && Array.isArray(field.options) ? field.options : [];
        return {
          id: field.id || generateFieldId(field.label || "Field"),
          label: field.label || "Untitled Field",
          type,
          required: field.required ?? true,
          placeholder: field.placeholder || "",
          helper_text: field.helper_text || "",
          options,
          service_keys: Array.isArray(field.service_keys)
            ? field.service_keys.filter((key) => validKeys.has(key))
            : [],
        } satisfies BookingFormField;
      })
    : [];

  return {
    ...defaults,
    ...config,
    services,
    forms,
    labels: {
      ...defaults.labels,
      ...(config?.labels || {}),
    },
    slot_settings: {
      duration_minutes: config?.slot_settings?.duration_minutes || defaults.slot_settings.duration_minutes,
    },
    request_settings: config?.request_settings ?? {},
    confirmation_templates: {
      ...defaults.confirmation_templates,
      ...(config?.confirmation_templates || {}),
    },
  };
};

const getServiceBadgeVariant = (selected: boolean) => (selected ? "default" : "outline");

export default function BookingSettingsPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [aiList, setAiList] = useState<any[]>([]);
  const [aiId, setAiId] = useState<string | null>(null);
  const [businessHours, setBusinessHours] = useState<BusinessHours>(() => getDefaultBusinessHours());
  const [bookingConfig, setBookingConfig] = useState<BookingConfig>(() => getDefaultBookingConfig());
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    workflow_type: "scheduled" as WorkflowType,
    channels: ["web", "whatsapp"],
    duration_minutes: 30 as number | undefined,
    active: true,
  });
  const [formDraft, setFormDraft] = useState<BookingFormField>({
    id: "",
    label: "",
    type: "text",
    required: true,
    placeholder: "",
    helper_text: "",
    options: [],
    service_keys: [],
  });
  const [formOptionsInput, setFormOptionsInput] = useState("");

  useEffect(() => {
    if (user?.id) {
      fetchSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchSettings = async () => {
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data, error } = await supabase
        .from("business_info")
        .select("id, ai_name, business_hours, booking_config")
        .eq("user_id", user?.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const selected = data[0];
        setAiList(data);
        setAiId(selected.id);
        setBusinessHours(selected.business_hours || getDefaultBusinessHours());
        setBookingConfig(normalizeBookingConfig(selected.booking_config));
      } else {
        setAiList([]);
        setAiId(null);
        setBusinessHours(getDefaultBusinessHours());
        setBookingConfig(getDefaultBookingConfig());
      }
    } catch (err) {
      console.error("Error fetching booking settings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAiChange = (id: string) => {
    const selected = aiList.find((item) => item.id === id);
    if (selected) {
      setAiId(selected.id);
      setBusinessHours(selected.business_hours || getDefaultBusinessHours());
      setBookingConfig(normalizeBookingConfig(selected.booking_config));
    }
  };

  const updateBusinessHours = (day: string, field: keyof BusinessHoursDay, value: string | boolean) => {
    setHasUnsavedChanges(true);
    setBusinessHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  // Removed toggleDayAvailability - days are now managed in Business Hours tab

  const updateService = (key: string, updates: Partial<BookingService>) => {
    setHasUnsavedChanges(true);
    setBookingConfig((prev) => ({
      ...prev,
      services: prev.services.map((service) => (service.key === key ? { ...service, ...updates } : service)),
    }));
  };

  const toggleServiceChannel = (key: string, channel: string) => {
    setBookingConfig((prev) => ({
      ...prev,
      services: prev.services.map((service) => {
        if (service.key !== key) return service;
        const exists = service.channels.includes(channel);
        const channels = exists
          ? service.channels.filter((value) => value !== channel)
          : [...service.channels, channel];
        return {
          ...service,
          channels: channels.length > 0 ? channels : ["web"],
        };
      }),
    }));
  };

  const toggleDraftServiceChannel = (channel: string) => {
    setNewService((prev) => {
      const exists = prev.channels.includes(channel);
      const channels = exists ? prev.channels.filter((value) => value !== channel) : [...prev.channels, channel];
      return {
        ...prev,
        channels: channels.length > 0 ? channels : ["web"],
      };
    });
  };

  const handleAddService = () => {
    const trimmed = newService.name.trim();
    if (!trimmed) {
      alert("Service name is required");
      return;
    }

    setBookingConfig((prev) => {
      const existing = new Set(prev.services.map((item) => item.key));
      let key = generateServiceKey(trimmed);
      while (existing.has(key)) {
        key = generateServiceKey(`${trimmed}_${Math.random().toString(36).slice(2, 4)}`);
      }

      const service: BookingService = {
        key,
        name: trimmed,
        workflow_type: newService.workflow_type,
        description: newService.description.trim(),
        active: newService.active,
        channels: Array.from(new Set(newService.channels)),
        duration_minutes: typeof newService.duration_minutes === "number" ? newService.duration_minutes : undefined,
      };

      return {
        ...prev,
        services: [...prev.services, service],
      };
    });

    setNewService({
      name: "",
      description: "",
      workflow_type: "scheduled",
      channels: ["web", "whatsapp"],
      duration_minutes: 30,
      active: true,
    });
  };

  const handleRemoveService = (key: string) => {
    setBookingConfig((prev) => ({
      ...prev,
      services: prev.services.filter((service) => service.key !== key),
      forms: prev.forms.map((field) => ({
        ...field,
        service_keys: field.service_keys.filter((value) => value !== key),
      })),
    }));
  };

  const resetFormDraft = () => {
    setFormDraft({
      id: "",
      label: "",
      type: "text",
      required: true,
      placeholder: "",
      helper_text: "",
      options: [],
      service_keys: [],
    });
    setFormOptionsInput("");
  };

  const toggleDraftServiceKey = (key: string) => {
    setFormDraft((prev) => {
      const exists = prev.service_keys.includes(key);
      return {
        ...prev,
        service_keys: exists ? prev.service_keys.filter((value) => value !== key) : [...prev.service_keys, key],
      };
    });
  };

  const toggleFieldServiceKey = (id: string, key: string) => {
    setBookingConfig((prev) => ({
      ...prev,
      forms: prev.forms.map((field) => {
        if (field.id !== id) return field;
        const exists = field.service_keys.includes(key);
        return {
          ...field,
          service_keys: exists ? field.service_keys.filter((value) => value !== key) : [...field.service_keys, key],
        };
      }),
    }));
  };

  const updateField = (id: string, updates: Partial<BookingFormField>) => {
    setHasUnsavedChanges(true);
    setBookingConfig((prev) => ({
      ...prev,
      forms: prev.forms.map((field) => (field.id === id ? { ...field, ...updates } : field)),
    }));
  };

  const handleAddField = () => {
    const label = formDraft.label.trim();
    if (!label) {
      alert("Field label is required");
      return;
    }

    if (formDraft.type === "select") {
      const options = formOptionsInput
        .split(/\r?\n|,/)
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
      if (options.length === 0) {
        alert("Select fields require at least one option");
        return;
      }
    }

    const validKeys = bookingConfig.services.map((service) => service.key);
    const field: BookingFormField = {
      id: generateFieldId(label),
      label,
      type: formDraft.type,
      required: formDraft.required,
      placeholder: formDraft.placeholder?.trim() || "",
      helper_text: formDraft.helper_text?.trim() || "",
      options:
        formDraft.type === "select"
          ? formOptionsInput
              .split(/\r?\n|,/)
              .map((value) => value.trim())
              .filter((value) => value.length > 0)
          : [],
      service_keys: formDraft.service_keys.filter((key) => validKeys.includes(key)),
    };

    setBookingConfig((prev) => ({
      ...prev,
      forms: [...prev.forms, field],
    }));

    resetFormDraft();
  };

  const handleRemoveField = (id: string) => {
    setBookingConfig((prev) => ({
      ...prev,
      forms: prev.forms.filter((field) => field.id !== id),
    }));
  };

  const saveSettings = async () => {
    if (!aiId) return;

    setSaving(true);
    try {
      const normalized = normalizeBookingConfig(bookingConfig);
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase
        .from("business_info")
        .update({
          business_hours: businessHours,
          booking_config: normalized,
        })
        .eq("id", aiId);

      if (error) throw error;

      setHasUnsavedChanges(false);
      alert("Settings saved successfully");
    } catch (err) {
      console.error("Error saving booking settings", err);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const availableServiceOptions = useMemo(() => bookingConfig.services, [bookingConfig.services]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <Header 
          title="Booking Settings" 
          description="Configure your booking system, services, and forms"
          showTitleInHeader={false}
        />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header 
        title="Booking Settings" 
        description="Configure services, intake forms, and availability for every workflow with ease."
        showTitleInHeader={false}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6 pb-24">

          {/* AI Selector */}
          {aiList.length > 1 && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium min-w-[110px]">Select AI:</label>
                  <Select value={aiId ?? undefined} onValueChange={handleAiChange}>
                    <SelectTrigger className="w-[260px]">
                      <SelectValue placeholder="Choose an AI" />
                    </SelectTrigger>
                    <SelectContent>
                      {aiList.map((ai) => (
                        <SelectItem key={ai.id} value={ai.id}>
                          {ai.ai_name || "Untitled AI"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="bg-white">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Services
              </TabsTrigger>
              <TabsTrigger value="forms" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Forms
              </TabsTrigger>
              <TabsTrigger value="hours" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Hours
              </TabsTrigger>
            </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Platform Configuration</CardTitle>
                <CardDescription>Control global booking behaviour and labels</CardDescription>
              </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold">Enable Booking System</Label>
                      <p className="text-sm text-gray-500">Allow customers to submit bookings across supported channels</p>
                    </div>
                    <Switch
                      checked={bookingConfig.enabled}
                      onCheckedChange={(checked) => setBookingConfig((prev) => ({ ...prev, enabled: checked }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label>Industry Type</Label>
                      <Input
                        placeholder="e.g. healthcare"
                        value={bookingConfig.industry_type}
                        onChange={(event) => setBookingConfig((prev) => ({ ...prev, industry_type: event.target.value }))}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Labels</h3>
                      <p className="text-sm text-gray-600">Customize the text labels used in the booking interface.</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="label-preset">Label Preset</Label>
                          <Select
                            value={LABEL_OPTIONS.find(opt => opt.dashboard_title === bookingConfig.labels.dashboard_title && opt.scheduled_tab === bookingConfig.labels.scheduled_tab && opt.request_tab === bookingConfig.labels.request_tab)?.value || "custom"}
                            onValueChange={(value) => {
                              if (value === "custom") {
                                // Keep current custom values
                              } else {
                                const preset = LABEL_OPTIONS.find(opt => opt.value === value);
                                if (preset) {
                                  setBookingConfig(prev => ({
                                    ...prev,
                                    labels: {
                                      dashboard_title: preset.dashboard_title,
                                      scheduled_tab: preset.scheduled_tab,
                                      request_tab: preset.request_tab
                                    }
                                  }));
                                }
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a label preset" />
                            </SelectTrigger>
                            <SelectContent>
                              {LABEL_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="dashboard-title">Dashboard Title</Label>
                          <Input
                            id="dashboard-title"
                            value={bookingConfig.labels.dashboard_title}
                            onChange={(e) => setBookingConfig(prev => ({
                              ...prev,
                              labels: { ...prev.labels, dashboard_title: e.target.value }
                            }))}
                            placeholder="e.g., Patient Bookings"
                          />
                        </div>

                        <div>
                          <Label htmlFor="scheduled-tab">Scheduled Tab Label</Label>
                          <Input
                            id="scheduled-tab"
                            value={bookingConfig.labels.scheduled_tab}
                            onChange={(e) => setBookingConfig(prev => ({
                              ...prev,
                              labels: { ...prev.labels, scheduled_tab: e.target.value }
                            }))}
                            placeholder="e.g., Appointments"
                          />
                        </div>

                        <div>
                          <Label htmlFor="request-tab">Request Tab Label</Label>
                          <Input
                            id="request-tab"
                            value={bookingConfig.labels.request_tab}
                            onChange={(e) => setBookingConfig(prev => ({
                              ...prev,
                              labels: { ...prev.labels, request_tab: e.target.value }
                            }))}
                            placeholder="e.g., Consultations"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create Service</CardTitle>
                  <CardDescription>Services define what customers can schedule or request</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      placeholder="Example: Consultation"
                      value={newService.name}
                      onChange={(event) => setNewService((prev) => ({ ...prev, name: event.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      rows={3}
                      placeholder="Optional description"
                      value={newService.description}
                      onChange={(event) => setNewService((prev) => ({ ...prev, description: event.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Workflow</Label>
                      <Select
                        value={newService.workflow_type}
                        onValueChange={(value: WorkflowType) => setNewService((prev) => ({ ...prev, workflow_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose workflow" />
                        </SelectTrigger>
                        <SelectContent>
                          {WORKFLOW_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Default Duration</Label>
                      <Input
                        type="number"
                        min={5}
                        step={5}
                        value={newService.duration_minutes ?? ""}
                        onChange={(event) =>
                          setNewService((prev) => ({
                            ...prev,
                            duration_minutes: event.target.value ? Number(event.target.value) : undefined,
                          }))
                        }
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Channels</Label>
                    <div className="flex flex-wrap gap-2">
                      {SERVICE_CHANNELS.map((channel) => (
                        <Button
                          key={channel}
                          type="button"
                          size="sm"
                          variant={getServiceBadgeVariant(newService.channels.includes(channel))}
                          onClick={() => toggleDraftServiceChannel(channel)}
                        >
                          {channel}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newService.active}
                        onCheckedChange={(checked) => setNewService((prev) => ({ ...prev, active: checked }))}
                      />
                      <Label className="text-sm">Active</Label>
                    </div>
                    <Button onClick={handleAddService} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Service
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Configured Services</CardTitle>
                  <CardDescription>Update workflow types, channels, and metadata</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bookingConfig.services.length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                      No services configured yet.
                    </div>
                  )}

                  {bookingConfig.services.map((service) => (
                    <Card key={service.key} className="border shadow-sm">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-2 flex-1">
                            <Input
                              value={service.name}
                              onChange={(event) => updateService(service.key, { name: event.target.value })}
                            />
                            <Textarea
                              rows={3}
                              placeholder="Service description"
                              value={service.description}
                              onChange={(event) => updateService(service.key, { description: event.target.value })}
                            />
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveService(service.key)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-xs text-gray-500">Workflow</Label>
                            <Select
                              value={service.workflow_type}
                              onValueChange={(value: WorkflowType) => updateService(service.key, { workflow_type: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {WORKFLOW_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Duration (minutes)</Label>
                            <Input
                              type="number"
                              min={5}
                              step={5}
                              value={service.duration_minutes ?? ""}
                              onChange={(event) =>
                                updateService(service.key, {
                                  duration_minutes: event.target.value ? Number(event.target.value) : undefined,
                                })
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-xs text-gray-500">Status</Label>
                              <Badge variant={service.active ? "default" : "secondary"} className="mt-1">
                                {service.active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <Switch
                              checked={service.active}
                              onCheckedChange={(checked) => updateService(service.key, { active: checked })}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-gray-500">Channels</Label>
                          <div className="flex flex-wrap gap-2">
                            {SERVICE_CHANNELS.map((channel) => (
                              <Button
                                key={channel}
                                type="button"
                                size="sm"
                                variant={getServiceBadgeVariant(service.channels.includes(channel))}
                                onClick={() => toggleServiceChannel(service.key, channel)}
                              >
                                {channel}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="forms">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create Form Field</CardTitle>
                  <CardDescription>Attach fields to services for questionnaires</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Field Label</Label>
                    <Input
                      placeholder="Example: Patient Name"
                      value={formDraft.label}
                      onChange={(event) => setFormDraft((prev) => ({ ...prev, label: event.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Field Type</Label>
                      <Select
                        value={formDraft.type}
                        onValueChange={(value: FormFieldType) => {
                          setFormDraft((prev) => ({
                            ...prev,
                            type: value,
                            options: value === "select" ? prev.options : [],
                          }));
                          if (value !== "select") {
                            setFormOptionsInput("");
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FORM_FIELD_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <Switch
                        checked={formDraft.required}
                        onCheckedChange={(checked) => setFormDraft((prev) => ({ ...prev, required: checked }))}
                      />
                      <Label className="text-sm">Required</Label>
                    </div>
                  </div>

                  {formDraft.type === "select" && (
                    <div>
                      <Label>Options (one per line or comma separated)</Label>
                      <Textarea
                        rows={4}
                        placeholder={"Option A\nOption B"}
                        value={formOptionsInput}
                        onChange={(event) => setFormOptionsInput(event.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <Label>Placeholder</Label>
                    <Input
                      placeholder="Optional placeholder"
                      value={formDraft.placeholder ?? ""}
                      onChange={(event) => setFormDraft((prev) => ({ ...prev, placeholder: event.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>Helper Text</Label>
                    <Textarea
                      rows={2}
                      placeholder="Optional helper text"
                      value={formDraft.helper_text ?? ""}
                      onChange={(event) => setFormDraft((prev) => ({ ...prev, helper_text: event.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Attach to Services</Label>
                    <div className="flex flex-wrap gap-2">
                      {availableServiceOptions.length === 0 && (
                        <p className="text-xs text-gray-500">Add at least one service to attach fields.</p>
                      )}
                      {availableServiceOptions.map((service) => (
                        <Button
                          key={service.key}
                          type="button"
                          size="sm"
                          variant={getServiceBadgeVariant(formDraft.service_keys.includes(service.key))}
                          onClick={() => toggleDraftServiceKey(service.key)}
                        >
                          {service.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={resetFormDraft}>
                      Reset
                    </Button>
                    <Button onClick={handleAddField} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Field
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Configured Fields</CardTitle>
                  <CardDescription>Manage dynamic questionnaire structure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bookingConfig.forms.length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                      No fields configured yet.
                    </div>
                  )}

                  {bookingConfig.forms.map((field) => (
                    <Card key={field.id} className="border shadow-sm">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-2 flex-1">
                            <Input
                              value={field.label}
                              onChange={(event) => updateField(field.id, { label: event.target.value })}
                            />
                            <Textarea
                              rows={2}
                              placeholder="Helper text"
                              value={field.helper_text ?? ""}
                              onChange={(event) => updateField(field.id, { helper_text: event.target.value })}
                            />
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveField(field.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-xs text-gray-500">Type</Label>
                            <Select
                              value={field.type}
                              onValueChange={(value: FormFieldType) => {
                                if (value !== "select") {
                                  updateField(field.id, { type: value, options: [] });
                                } else {
                                  updateField(field.id, { type: value });
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FORM_FIELD_TYPES.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Placeholder</Label>
                            <Input
                              value={field.placeholder ?? ""}
                              onChange={(event) => updateField(field.id, { placeholder: event.target.value })}
                            />
                          </div>
                          <div className="flex items-center gap-2 justify-end">
                            <Switch
                              checked={field.required}
                              onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                            />
                            <Label className="text-xs">Required</Label>
                          </div>
                        </div>

                        {field.type === "select" && (
                          <div>
                            <Label className="text-xs text-gray-500">Options</Label>
                            <Textarea
                              rows={3}
                              value={(field.options || []).join("\n")}
                              onChange={(event) =>
                                updateField(field.id, {
                                  options: event.target.value
                                    .split(/\r?\n|,/)
                                    .map((value) => value.trim())
                                    .filter((value) => value.length > 0),
                                })
                              }
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label className="text-xs text-gray-500">Attached Services</Label>
                          <div className="flex flex-wrap gap-2">
                            {availableServiceOptions.length === 0 && (
                              <p className="text-xs text-gray-500">Add services to attach this field.</p>
                            )}
                            {availableServiceOptions.map((service) => (
                              <Button
                                key={service.key}
                                type="button"
                                size="sm"
                                variant={getServiceBadgeVariant(field.service_keys.includes(service.key))}
                                onClick={() => toggleFieldServiceKey(field.id, service.key)}
                              >
                                {service.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="hours">
            <Card>
              <CardHeader>
                <CardTitle>Business Hours & Slot Duration</CardTitle>
                <CardDescription>Configure operating hours and appointment duration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Slot Duration Setting */}
                <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Default Appointment Duration</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min={5}
                        step={5}
                        value={bookingConfig.slot_settings.duration_minutes}
                        onChange={(event) =>
                          setBookingConfig((prev) => ({
                            ...prev,
                            slot_settings: {
                              ...prev.slot_settings,
                              duration_minutes: Math.max(5, Number(event.target.value) || 5),
                            },
                          }))
                        }
                        className="max-w-xs bg-white"
                      />
                      <span className="text-sm text-gray-600">minutes</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Time slots will be generated based on this duration (e.g., 30 min slots: 09:00, 09:30, 10:00...)
                    </p>
                  </div>
                </div>

                {/* Business Hours per Day */}
                <div className="space-y-4">
                  <Label className="text-sm font-semibold">Operating Hours by Day</Label>
                  {DAYS.map((day) => (
                  <div key={day} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-lg border p-4">
                    <div className="space-y-1">
                      <Label className="capitalize font-semibold">{day}</Label>
                      <p className="text-xs text-gray-500">Configure opening hours or mark as closed</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={businessHours[day]?.enabled ?? false}
                        onCheckedChange={(checked) => updateBusinessHours(day, "enabled", checked)}
                      />
                      {(businessHours[day]?.enabled ?? false) ? (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-gray-500">Open</Label>
                            <Input
                              type="time"
                              value={businessHours[day]?.open || "09:00"}
                              onChange={(event) => updateBusinessHours(day, "open", event.target.value)}
                              className="w-32"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-gray-500">Close</Label>
                            <Input
                              type="time"
                              value={businessHours[day]?.close || "18:00"}
                              onChange={(event) => updateBusinessHours(day, "close", event.target.value)}
                              className="w-32"
                            />
                          </div>
                        </div>
                      ) : (
                        <Badge variant="secondary">Closed</Badge>
                      )}
                    </div>
                  </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>

        {/* Sticky Save Button Footer */}
        <div className="sticky bottom-0 z-10 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-4 mt-8 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-600">
                Saving to <span className="font-semibold">{aiList.find(ai => ai.id === aiId)?.ai_name || 'this AI'}</span>
              </p>
              {hasUnsavedChanges && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  Unsaved changes
                </Badge>
              )}
            </div>
            <Button
              onClick={saveSettings}
              disabled={saving}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 shadow-lg"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-b-transparent"></span>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save All Settings
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
