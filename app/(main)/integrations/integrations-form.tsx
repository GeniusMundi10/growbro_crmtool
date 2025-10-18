"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { CheckCircle2, Trash2, ExternalLink, ArrowRight, Settings, Calendar } from "lucide-react";
import { siHubspot, siWhatsapp } from 'simple-icons';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Shimmer } from "@/components/ui/shimmer";

// WhatsApp OAuth redirect URI - MUST be a public, non-redirecting URL
// This avoids auth or slash normalization during Meta's code binding step
const WA_REDIRECT_URI = "https://crm.growbro.ai/wa-es-redirect";

export default function IntegrationsForm() {
  const { user } = useUser();
  const router = useRouter();
  const [hubspotConnected, setHubspotConnected] = useState<boolean>(false);
  const [hubspotInfo, setHubspotInfo] = useState<any>(null);
  const [hubspotList, setHubspotList] = useState<Array<any>>([]);
  const [whatsappConnected, setWhatsappConnected] = useState<boolean>(false);
  const [whatsappInfo, setWhatsappInfo] = useState<any>(null);
  const [waList, setWaList] = useState<Array<any>>([]);
  const [selectedAiId, setSelectedAiId] = useState<string | null>(null);
  const [hubspotAiId, setHubspotAiId] = useState<string | null>(null);
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState<boolean>(false);
  const [googleCalendarInfo, setGoogleCalendarInfo] = useState<any>(null);
  const [googleCalendarAiId, setGoogleCalendarAiId] = useState<string | null>(null);
  const [aiList, setAiList] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [testTo, setTestTo] = useState("");
  const [testMsg, setTestMsg] = useState("Hello from GrowBro test");
  const [testSending, setTestSending] = useState(false);
  const [whatsappConnecting, setWhatsappConnecting] = useState(false);
  const fbReadyRef = useRef(false);
  const waSessionDataRef = useRef<{ waba_id?: string; phone_number_id?: string } | null>(null);
  const processingCodeRef = useRef(false);

  // Official brand icons using simple-icons
  const BrandIcon = ({ icon, className = "h-5 w-5" }: { icon: { path: string; hex: string; title: string }, className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" role="img" aria-label={icon.title} xmlns="http://www.w3.org/2000/svg">
      <title>{icon.title}</title>
      <path d={icon.path} fill={`#${icon.hex}`} />
    </svg>
  );

  // Load connection status from backend
  useEffect(() => {
    const checkStatus = async () => {
      setLoading(true);
      try {
        // We will refresh once more below after we compute defaultAi
        const res = await fetch("/api/hubspot/status");
        const data = await res.json();
        setHubspotConnected(!!data.connected);
        setHubspotInfo(data.info || null);
        // Fetch list of all HubSpot integrations
        const listRes = await fetch("/api/hubspot/list");
        const listData = await listRes.json();
        const hubspotItems = Array.isArray(listData?.items) ? listData.items : [];
        setHubspotList(hubspotItems);
      } catch {
        setHubspotConnected(false);
        setHubspotInfo(null);
        setHubspotList([]);
      }
      try {
        // Check Google Calendar status
        const gcalRes = await fetch("/api/google-calendar/status");
        const gcalData = await gcalRes.json();
        setGoogleCalendarConnected(!!gcalData.connected);
        setGoogleCalendarInfo(gcalData.info || null);
      } catch {
        setGoogleCalendarConnected(false);
        setGoogleCalendarInfo(null);
      }
      try {
        const res = await fetch("/api/whatsapp/status");
        const data = await res.json();
        setWhatsappConnected(!!data.connected);
        setWhatsappInfo(data.info || null);
        // Fetch list of all WhatsApp integrations
        const listRes = await fetch("/api/whatsapp/list");
        const listData = await listRes.json();
        const items = Array.isArray(listData?.items) ? listData.items : [];
        setWaList(items);
        // Fetch AI list for pre-connect selection
        const aiRes = await fetch("/api/ai/list");
        const aiData = await aiRes.json();
        const ais = Array.isArray(aiData?.items) ? aiData.items : [];
        setAiList(ais);
        // Default selection: if connected use that ai_id; else first AI in list
        const defaultAi = (data?.info?.ai_id as string | undefined)
          || (items[0]?.ai_id as string | undefined)
          || (ais[0]?.ai_id as string | undefined)
          || null;
        setSelectedAiId(defaultAi);
        setHubspotAiId(defaultAi);
        setGoogleCalendarAiId(defaultAi);
        // Now that we know the default AI, refresh HubSpot status for it if available
        try {
          const st = await fetch(`/api/hubspot/status${defaultAi ? `?ai_id=${encodeURIComponent(defaultAi)}` : ""}`).then(r=>r.json());
          setHubspotConnected(!!st.connected);
          setHubspotInfo(st.info || null);
        } catch {}
        // Refresh Google Calendar status for default AI
        try {
          const gcalSt = await fetch(`/api/google-calendar/status${defaultAi ? `?ai_id=${encodeURIComponent(defaultAi)}` : ""}`).then(r=>r.json());
          setGoogleCalendarConnected(!!gcalSt.connected);
          setGoogleCalendarInfo(gcalSt.info || null);
        } catch {}
      } catch {
        setWhatsappConnected(false);
        setWhatsappInfo(null);
        setWaList([]);
        setAiList([]);
        setSelectedAiId(null);
        setHubspotAiId(null);
        setGoogleCalendarAiId(null);
      }
      setLoading(false);
    };
    checkStatus();

    // Show toast if redirected after connect
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("status") === "connected") {
        toast.success("HubSpot connected!");
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (params.get("status") === "gcal_connected") {
        toast.success("Google Calendar connected!");
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (params.get("error")?.startsWith("gcal_")) {
        toast.error("Failed to connect Google Calendar");
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Re-check HubSpot connection when the HubSpot AI selection changes
  useEffect(() => {
    (async () => {
      try {
        const st = await fetch(`/api/hubspot/status${hubspotAiId ? `?ai_id=${encodeURIComponent(hubspotAiId)}` : ""}`).then(r=>r.json());
        setHubspotConnected(!!st.connected);
        setHubspotInfo(st.info || null);
      } catch {}
    })();
  }, [hubspotAiId]);

  // Re-check Google Calendar connection when AI selection changes
  useEffect(() => {
    (async () => {
      try {
        const st = await fetch(`/api/google-calendar/status${googleCalendarAiId ? `?ai_id=${encodeURIComponent(googleCalendarAiId)}` : ""}`).then(r=>r.json());
        setGoogleCalendarConnected(!!st.connected);
        setGoogleCalendarInfo(st.info || null);
      } catch {}
    })();
  }, [googleCalendarAiId]);

  const handleConnectHubspot = async () => {
    try {
      const qs = hubspotAiId ? `?ai_id=${encodeURIComponent(hubspotAiId)}` : "";
      const popup = window.open(
        `/api/hubspot/oauth-url${qs}`,
        "hubspot-oauth",
        "width=600,height=700"
      );
      if (!popup) {
        toast.error("Popup blocked. Please allow popups and try again.");
        return;
      }
      // Listen for postMessage from popup
      const listener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data.status === "connected") {
          setHubspotConnected(true);
          toast.success("HubSpot connected!");
          window.removeEventListener("message", listener);
          // Refresh status and list for this AI specifically
          try {
            const st = await fetch(`/api/hubspot/status${hubspotAiId ? `?ai_id=${encodeURIComponent(hubspotAiId)}` : ""}`).then(r=>r.json());
            setHubspotConnected(!!st.connected);
            setHubspotInfo(st.info || null);
            const listRes = await fetch("/api/hubspot/list");
            const listData = await listRes.json();
            setHubspotList(Array.isArray(listData?.items) ? listData.items : []);
          } catch {}
        }
      };
      window.addEventListener("message", listener);
    } catch (e) {
      console.error(e);
      toast.error("Unable to initiate HubSpot connection");
    }
  };


  const handleDisconnectHubspot = async () => {
    try {
      const res = await fetch("/api/hubspot/disconnect", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ ai_id: hubspotAiId || null }) });
      const data = await res.json();
      if (data.success) {
        setHubspotConnected(false);
        setHubspotInfo(null);
        toast.success("HubSpot disconnected");
        // Refresh list
        const listRes = await fetch("/api/hubspot/list");
        const listData = await listRes.json();
        const items = Array.isArray(listData?.items) ? listData.items : [];
        setHubspotList(items);
        // Select next available AI
        setHubspotAiId(items[0]?.ai_id || aiList[0]?.ai_id || null);
      } else {
        toast.error(data.error || "Failed to disconnect HubSpot");
      }
    } catch (e) {
      toast.error("Failed to disconnect HubSpot");
    }
  };

  const handleConnectGoogleCalendar = async () => {
    try {
      const qs = googleCalendarAiId ? `?ai_id=${encodeURIComponent(googleCalendarAiId)}` : "";
      const popup = window.open(
        `/api/google-calendar/oauth-url${qs}`,
        "google-calendar-oauth",
        "width=600,height=700"
      );
      if (!popup) {
        toast.error("Popup blocked. Please allow popups and try again.");
        return;
      }
      // Listen for postMessage from popup
      const listener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data.status === "gcal_connected") {
          setGoogleCalendarConnected(true);
          toast.success("Google Calendar connected!");
          window.removeEventListener("message", listener);
          // Refresh status for this AI specifically
          try {
            const st = await fetch(`/api/google-calendar/status${googleCalendarAiId ? `?ai_id=${encodeURIComponent(googleCalendarAiId)}` : ""}`).then(r=>r.json());
            setGoogleCalendarConnected(!!st.connected);
            setGoogleCalendarInfo(st.info || null);
          } catch {}
        }
      };
      window.addEventListener("message", listener);
    } catch (e) {
      console.error(e);
      toast.error("Unable to initiate Google Calendar connection");
    }
  };

  const handleDisconnectGoogleCalendar = async () => {
    try {
      const res = await fetch("/api/google-calendar/disconnect", { 
        method: "POST", 
        headers: {"Content-Type":"application/json"}, 
        body: JSON.stringify({ ai_id: googleCalendarAiId || null }) 
      });
      const data = await res.json();
      if (data.success) {
        setGoogleCalendarConnected(false);
        setGoogleCalendarInfo(null);
        toast.success("Google Calendar disconnected");
      } else {
        toast.error(data.error || "Failed to disconnect Google Calendar");
      }
    } catch (e) {
      toast.error("Failed to disconnect Google Calendar");
    }
  };

  // ---- WhatsApp Embedded Signup helpers ----
  const loadFacebookSdk = () => {
    if (typeof window === "undefined") return;
    const w = window as any;
    if (w.FB) {
      fbReadyRef.current = true;
      return;
    }
    // Initialize SDK when ready
    w.fbAsyncInit = function () {
      const appId = process.env.NEXT_PUBLIC_FB_APP_ID as string;
      if (!appId) {
        console.warn("NEXT_PUBLIC_FB_APP_ID is not set");
      }
      console.log('[WA_ES] Initializing FB SDK with appId', appId);
      w.FB?.init({
        appId: appId || "",
        autoLogAppEvents: true,
        xfbml: true,
        version: "v23.0",
      });
      fbReadyRef.current = true;
    };
    // Inject SDK script once
    const id = "facebook-jssdk";
    if (!document.getElementById(id)) {
      const js = document.createElement("script");
      js.id = id;
      js.async = true;
      js.defer = true;
      js.crossOrigin = "anonymous";
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      document.body.appendChild(js);
    }
    // Session logging message event listener (only add once)
    if (!w.__wa_es_listener_added) {
      window.addEventListener("message", (event: MessageEvent) => {
        if (typeof event.origin !== "string" || !event.origin.endsWith("facebook.com")) return;
        let payload: any = null;
        try {
          const raw = (event as any).data;
          payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch (e) {
          payload = null;
        }
        if (payload?.type === "WA_EMBEDDED_SIGNUP") {
          waSessionDataRef.current = {
            waba_id: payload?.data?.waba_id,
            phone_number_id: payload?.data?.phone_number_id,
          };
          console.debug("[WA_ES] Session data captured", waSessionDataRef.current);
        }
      });
      w.__wa_es_listener_added = true;
    }
  };

  // Load the Facebook SDK once on mount
  useEffect(() => {
    loadFacebookSdk();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnectWhatsApp = async () => {
    if (whatsappConnecting) {
      toast.error("WhatsApp connection already in progress...");
      return;
    }
    
    try {
      setWhatsappConnecting(true);
      const w = window as any;
      const FB = w.FB;
      if (!FB) {
        toast.error("Facebook SDK not loaded yet. Please try again in a moment.");
        return;
      }
      const configId = process.env.NEXT_PUBLIC_FB_EMBEDDED_SIGNUP_CONFIG_ID as string;
      if (!configId) {
        toast.error("Missing NEXT_PUBLIC_FB_EMBEDDED_SIGNUP_CONFIG_ID");
        return;
      }

      console.log('[WA_ES] Starting WhatsApp connection', {
        currentHref: window.location.href,
        configId,
        selectedAiId,
      });

      function fbLoginCallback(response: any) {
        if (response?.authResponse?.code) {
          // Prevent double processing of the same code
          if (processingCodeRef.current) {
            console.log('[WA_ES] Code already being processed, ignoring duplicate callback');
            return;
          }
          processingCodeRef.current = true;
          const code = response.authResponse.code as string;
          // Debug: print the exact code once to help diagnose exchange issues (short-lived, single-use)
          try {
            console.debug('[WA_ES] Received auth code from Meta', { code, length: code?.length });
          } catch {}
          // Use the SAME redirect URI as used in FB.login() for consistency
          const redirectUri = WA_REDIRECT_URI;
          console.log('[WA_ES] About to POST embedded-callback', {
            redirectUri,
            currentHref: window.location.href,
            configId,
            selectedAiId,
            hasCode: !!code,
            codePreview: code?.slice(0, 8),
            codeLen: code?.length,
          });
          const body = {
            code,
            waba_id: waSessionDataRef.current?.waba_id,
            phone_number_id: waSessionDataRef.current?.phone_number_id,
            redirect_uri: redirectUri,
            ai_id: selectedAiId || undefined,
          };
          fetch("/api/whatsapp/embedded-callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
            .then(async (resp) => {
              const data = await resp.json().catch(() => ({}));
              console.debug('[WA_ES] embedded-callback response', { ok: resp.ok, status: resp.status, data });
              if (!resp.ok || !(data as any)?.success) {
                toast.error((data as any)?.error || "WhatsApp onboarding failed");
                return;
              }
              setWhatsappConnected(true);
              toast.success("WhatsApp connected!");
              // Refresh status + integrations list so UI updates immediately
              try {
                const s = await fetch("/api/whatsapp/status").then(r=>r.json());
                setWhatsappConnected(!!s.connected);
                setWhatsappInfo(s.info || null);
                const l = await fetch("/api/whatsapp/list").then(r=>r.json());
                const items = Array.isArray(l?.items) ? l.items : [];
                setWaList(items);
                setSelectedAiId((s?.info?.ai_id as string | undefined) || items[0]?.ai_id || null);
              } catch {}
            })
            .catch((e) => {
              console.error(e);
              toast.error("Backend error during WhatsApp onboarding");
            })
            .finally(() => {
              processingCodeRef.current = false;
              setWhatsappConnecting(false);
            });
        } else {
          toast.error("WhatsApp signup was cancelled or failed.");
          processingCodeRef.current = false;
          setWhatsappConnecting(false);
        }
      }

      FB.login(fbLoginCallback, {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
        redirect_uri: WA_REDIRECT_URI,
        extras: { setup: {}, sessionInfoVersion: "3" },
      });
    } catch (e) {
      console.error(e);
      toast.error("Unable to initiate WhatsApp connection");
      setWhatsappConnecting(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    try {
      const res = await fetch("/api/whatsapp/disconnect", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setWhatsappConnected(false);
        setWhatsappInfo(null);
        toast.success("WhatsApp disconnected");
      } else {
        toast.error(data.error || "Failed to disconnect WhatsApp");
      }
    } catch (e) {
      toast.error("Failed to disconnect WhatsApp");
    }
  };

  const handleTestSend = async () => {
    if (!testTo || !testMsg) {
      toast.error("Enter recipient number and message");
      return;
    }
    if (!selectedAiId) {
      toast.error("No AI selected or found for this WhatsApp integration");
      return;
    }
    try {
      setTestSending(true);
      const resp = await fetch("/api/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_number: testTo, message: testMsg, ai_id: selectedAiId })
      });
      const data = await resp.json();
      if (!resp.ok || !data?.success) {
        toast.error(data?.error || "Test send failed");
        return;
      }
      toast.success("Test message sent");
    } catch (e) {
      toast.error("Failed to send test message");
    } finally {
      setTestSending(false);
    }
  };

  if (loading) {
    return (
      <section className="w-full max-w-4xl">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="max-w-md w-full shadow-sm border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shimmer className="h-5 w-5 rounded" />
                    <Shimmer className="h-5 w-28" />
                  </div>
                  <Shimmer className="h-5 w-16 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 4 }).map((__, j) => (
                  <Shimmer key={j} className="h-4 w-[80%]" />
                ))}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Shimmer className="h-9 w-full rounded-md" />
                  <Shimmer className="h-9 w-full rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-6xl">
      <div className="grid gap-6 md:grid-cols-2">
      <Card className="group hover:shadow-lg transition-all duration-200 border border-gray-200/60 bg-white/50 backdrop-blur">
        <CardHeader className="space-y-0 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 ring-1 ring-orange-200/50">
                <BrandIcon icon={siHubspot} className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">HubSpot</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">CRM Integration</p>
              </div>
            </div>
            <Badge 
              variant={hubspotConnected ? "default" : "secondary"} 
              className={hubspotConnected ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm" : "bg-gray-100 text-gray-600"}
            >
              {hubspotConnected && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {hubspotConnected ? "Connected" : "Not connected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {hubspotConnected
              ? `Connected${hubspotInfo?.portal_id ? ` to portal ${hubspotInfo.portal_id}` : ""}.`
              : "Sync leads you capture in GrowBro directly into your HubSpot CRM."}
          </p>
          {hubspotConnected ? (
            <div className="space-y-4">
              {hubspotList.length > 1 && (
                <div className="space-y-2">
                  <Label>Select AI / HubSpot Portal</Label>
                  <Select value={hubspotAiId ?? undefined} onValueChange={(v) => setHubspotAiId(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an integration" />
                    </SelectTrigger>
                    <SelectContent>
                      {hubspotList.map((item) => (
                        <SelectItem key={item.ai_id} value={item.ai_id}>
                          {(item.ai_name || 'AI') + (item.portal_id ? ` — Portal ${item.portal_id}` : '')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="rounded-lg bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-200/60 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</span>
                  <span className="text-sm font-semibold text-gray-900">Connected</span>
                </div>
                {hubspotInfo?.portal_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Portal ID</span>
                    <span className="text-sm font-mono font-semibold text-gray-900">{hubspotInfo.portal_id}</span>
                  </div>
                )}
                {hubspotInfo?.hub_domain && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hub Domain</span>
                    <span className="text-sm font-mono text-gray-600">{hubspotInfo.hub_domain}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="destructive" onClick={handleDisconnectHubspot} size="sm" className="flex-1">
                  Disconnect
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(`https://${hubspotInfo?.hub_domain || 'app.hubspot.com'}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1.5" />
                      Open HubSpot
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View your HubSpot portal</TooltipContent>
                </Tooltip>
              </div>
              <div className="rounded-md bg-blue-50/50 border border-blue-200/50 p-3">
                <p className="text-xs text-blue-700 leading-relaxed">
                  <span className="font-medium">Note:</span> Leads captured in your AI conversations will automatically sync to HubSpot.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {aiList.length > 0 ? (
                <>
                  <div className="space-y-2">
                    <Label>Select AI to connect</Label>
                    <Select value={hubspotAiId ?? undefined} onValueChange={(v) => setHubspotAiId(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an AI" />
                      </SelectTrigger>
                      <SelectContent>
                        {aiList.map((ai) => (
                          <SelectItem key={ai.ai_id} value={ai.ai_id}>
                            {ai.ai_name || 'AI'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleConnectHubspot} size="sm" disabled={!hubspotAiId}>
                    Connect
                  </Button>
                </>
              ) : (
                <p className="text-sm text-slate-600">No AIs found. Please create an AI first in your dashboard, then return to connect HubSpot.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="group hover:shadow-lg transition-all duration-200 border border-gray-200/60 bg-white/50 backdrop-blur">
        <CardHeader className="space-y-0 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 ring-1 ring-green-200/50">
                <BrandIcon icon={siWhatsapp} className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">WhatsApp</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Business Messaging</p>
              </div>
            </div>
            <Badge 
              variant={whatsappConnected ? "default" : "secondary"} 
              className={whatsappConnected ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm" : "bg-gray-100 text-gray-600"}
            >
              {whatsappConnected && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {whatsappConnected ? "Connected" : "Not connected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {whatsappConnected
              ? `Connected${whatsappInfo?.phone_number ? ` to +${whatsappInfo.phone_number}` : ""}.`
              : "Connect your WhatsApp Business number via Meta Embedded Signup."}
          </p>
          {whatsappConnected ? (
            <div className="space-y-4">
              {waList.length > 1 && (
                <div className="space-y-2">
                  <Label>Select AI / WhatsApp number</Label>
                  <Select value={selectedAiId ?? undefined} onValueChange={(v) => setSelectedAiId(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an integration" />
                    </SelectTrigger>
                    <SelectContent>
                      {waList.map((item) => (
                        <SelectItem key={item.ai_id} value={item.ai_id}>
                          {(item.ai_name || 'AI') + (item.phone_number ? ` — +${item.phone_number}` : '')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="rounded-lg bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-200/60 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</span>
                  <span className="text-sm font-semibold text-gray-900">{whatsappInfo?.status || "connected"}</span>
                </div>
                {whatsappInfo?.phone_number && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</span>
                    <span className="text-sm font-mono font-semibold text-gray-900">+{whatsappInfo.phone_number}</span>
                  </div>
                )}
                {whatsappInfo?.phone_number_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone ID</span>
                    <span className="text-xs font-mono text-gray-600">{whatsappInfo.phone_number_id}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="to">Test send to (E.164)</Label>
                <Input id="to" placeholder="+15551234567" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="msg">Message</Label>
                <Input id="msg" placeholder="Hello from GrowBro" value={testMsg} onChange={(e) => setTestMsg(e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleTestSend} size="sm" disabled={testSending} className="flex-1 min-w-[100px]">
                  Send Test
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/integrations/whatsapp-settings?ai_id=${encodeURIComponent(selectedAiId || whatsappInfo?.ai_id || '')}`)}
                  size="sm"
                  disabled={!selectedAiId && !whatsappInfo?.ai_id}
                  className="flex-1 min-w-[100px]"
                >
                  <Settings className="h-4 w-4 mr-1.5" />
                  Settings
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1 min-w-[100px]"
                  onClick={async () => {
                    try {
                      const resp = await fetch("/api/whatsapp/disconnect", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ai_id: selectedAiId || whatsappInfo?.ai_id })
                      });
                      const data = await resp.json();
                      if (!resp.ok || !data?.success) {
                        toast.error(data?.error || "Failed to disconnect WhatsApp");
                        return;
                      }
                      toast.success("WhatsApp disconnected");
                      // Refresh status/list
                      const s = await fetch("/api/whatsapp/status").then(r=>r.json());
                      setWhatsappConnected(!!s.connected);
                      setWhatsappInfo(s.info || null);
                      const l = await fetch("/api/whatsapp/list").then(r=>r.json());
                      const items = Array.isArray(l?.items) ? l.items : [];
                      setWaList(items);
                      setSelectedAiId(items[0]?.ai_id || null);
                    } catch (e) {
                      toast.error("Failed to disconnect WhatsApp");
                    }
                  }}
                >
                  Disconnect
                </Button>
              </div>
              <div className="rounded-md bg-blue-50/50 border border-blue-200/50 p-3">
                <p className="text-xs text-blue-700 leading-relaxed">
                  <span className="font-medium">Note:</span> Test numbers require recipients to be verified in Meta's API Setup, or start a session by messaging your number first.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {aiList.length > 0 ? (
                <>
                  <div className="space-y-2">
                    <Label>Select AI to connect</Label>
                    <Select value={selectedAiId ?? undefined} onValueChange={(v) => setSelectedAiId(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an AI" />
                      </SelectTrigger>
                      <SelectContent>
                        {aiList.map((ai) => (
                          <SelectItem key={ai.ai_id} value={ai.ai_id}>
                            {ai.ai_name || 'AI'} {ai.connected ? '— connected' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleConnectWhatsApp} size="sm" disabled={!selectedAiId || whatsappConnecting}>
                    {whatsappConnecting ? "Connecting..." : "Connect"}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-slate-600">No AIs found. Please create an AI first in your dashboard, then return to connect WhatsApp.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Calendar Integration */}
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-lg">Google Calendar</CardTitle>
            </div>
            <Badge
              variant={googleCalendarConnected ? "default" : "secondary"}
              className={googleCalendarConnected ? "bg-green-500 hover:bg-green-600" : ""}
            >
              {googleCalendarConnected && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {googleCalendarConnected ? "Connected" : "Not connected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {googleCalendarConnected
              ? `Connected to ${googleCalendarInfo?.calendar_name || "your calendar"}. Bookings will automatically sync.`
              : "Connect your Google Calendar to automatically sync confirmed bookings as calendar events."}
          </p>
          {googleCalendarConnected ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-200/60 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Calendar</span>
                  <span className="text-sm font-semibold text-gray-900">{googleCalendarInfo?.calendar_name || "Primary"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Timezone</span>
                  <span className="text-sm font-semibold text-gray-900">{googleCalendarInfo?.timezone || "UTC"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Auto-Sync</span>
                  <span className="text-sm font-semibold text-green-600">{googleCalendarInfo?.sync_enabled ? "Enabled" : "Disabled"}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={handleDisconnectGoogleCalendar}
                >
                  Disconnect
                </Button>
              </div>
              <div className="rounded-md bg-blue-50/50 border border-blue-200/50 p-3">
                <p className="text-xs text-blue-700 leading-relaxed">
                  <span className="font-medium">Note:</span> Only confirmed bookings with date and time will be synced to your calendar.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {aiList.length > 0 ? (
                <>
                  <div className="space-y-2">
                    <Label>Select AI to connect</Label>
                    <Select value={googleCalendarAiId ?? undefined} onValueChange={(v) => setGoogleCalendarAiId(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an AI" />
                      </SelectTrigger>
                      <SelectContent>
                        {aiList.map((ai) => (
                          <SelectItem key={ai.ai_id} value={ai.ai_id}>
                            {ai.ai_name || 'AI'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleConnectGoogleCalendar} size="sm" disabled={!googleCalendarAiId}>
                    Connect
                  </Button>
                </>
              ) : (
                <p className="text-sm text-slate-600">No AIs found. Please create an AI first in your dashboard, then return to connect Google Calendar.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </section>
  );
}
