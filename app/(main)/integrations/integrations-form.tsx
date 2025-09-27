"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { CheckCircle2, Trash2, ExternalLink, ArrowRight } from "lucide-react";
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
  const [hubspotConnected, setHubspotConnected] = useState<boolean>(false);
  const [whatsappConnected, setWhatsappConnected] = useState<boolean>(false);
  const [whatsappInfo, setWhatsappInfo] = useState<any>(null);
  const [waList, setWaList] = useState<Array<any>>([]);
  const [selectedAiId, setSelectedAiId] = useState<string | null>(null);
  const [hubspotAiId, setHubspotAiId] = useState<string | null>(null);
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
      } catch {
        setHubspotConnected(false);
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
        // Now that we know the default AI, refresh HubSpot status for it if available
        try {
          const st = await fetch(`/api/hubspot/status${defaultAi ? `?ai_id=${encodeURIComponent(defaultAi)}` : ""}`).then(r=>r.json());
          setHubspotConnected(!!st.connected);
        } catch {}
      } catch {
        setWhatsappConnected(false);
        setWhatsappInfo(null);
        setWaList([]);
        setAiList([]);
        setSelectedAiId(null);
      }
      setLoading(false);
    };
    checkStatus();

    // Show toast if redirected after connect
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("status") === "connected") {
        toast.success("HubSpot connected!");
        window.history.replaceState({}, document.title, window.location.pathname); // Clean up URL
      }
    }
  }, []);

  // Re-check HubSpot connection when the HubSpot AI selection changes
  useEffect(() => {
    (async () => {
      try {
        const st = await fetch(`/api/hubspot/status${hubspotAiId ? `?ai_id=${encodeURIComponent(hubspotAiId)}` : ""}`).then(r=>r.json());
        setHubspotConnected(!!st.connected);
      } catch {}
    })();
  }, [hubspotAiId]);

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
          // Refresh status for this AI specifically
          try {
            const st = await fetch(`/api/hubspot/status${hubspotAiId ? `?ai_id=${encodeURIComponent(hubspotAiId)}` : ""}`).then(r=>r.json());
            setHubspotConnected(!!st.connected);
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
        toast.success("HubSpot disconnected");
      } else {
        toast.error(data.error || "Failed to disconnect HubSpot");
      }
    } catch (e) {
      toast.error("Failed to disconnect HubSpot");
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
    <section className="w-full max-w-4xl">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="max-w-md w-full shadow-sm border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <BrandIcon icon={siHubspot} className="h-5 w-5" />
            <CardTitle className="text-lg font-semibold">HubSpot</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {hubspotConnected && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            <Badge variant={hubspotConnected ? "default" : "secondary"} className={hubspotConnected ? "bg-emerald-100 text-emerald-800" : ""}>
              {hubspotConnected ? "Connected" : "Not connected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">Sync leads you capture in GrowBro directly into your HubSpot CRM.</p>
          {aiList.length > 0 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select AI</Label>
                <Select value={hubspotAiId ?? undefined} onValueChange={(v) => setHubspotAiId(v)}>
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
              {hubspotConnected ? (
                <Button variant="destructive" onClick={handleDisconnectHubspot} size="sm">Disconnect</Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button onClick={handleConnectHubspot} size="sm" disabled={!hubspotAiId}>Connect</Button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a href="https://app.hubspot.com/" target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:underline inline-flex items-center gap-1">
                        Docs <ExternalLink className="h-3 w-3" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>Open HubSpot to verify the connection</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-600">No AIs found. Please create an AI first in your dashboard, then return to connect HubSpot.</p>
          )}
        </CardContent>
      </Card>
      <Card className="max-w-md w-full shadow-sm border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <BrandIcon icon={siWhatsapp} className="h-5 w-5" />
            <CardTitle className="text-lg font-semibold">WhatsApp</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {whatsappConnected && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            <Badge variant={whatsappConnected ? "default" : "secondary"} className={whatsappConnected ? "bg-emerald-100 text-emerald-800" : ""}>
              {whatsappConnected ? "Connected" : "Not connected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
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
              <div className="text-xs text-slate-600 bg-slate-50 border rounded p-3">
                <div><span className="font-medium">Status:</span> {whatsappInfo?.status || "connected"}</div>
                {whatsappInfo?.phone_number && (
                  <div><span className="font-medium">Phone:</span> +{whatsappInfo.phone_number}</div>
                )}
                {whatsappInfo?.phone_number_id && (
                  <div><span className="font-medium">Phone Number ID:</span> {whatsappInfo.phone_number_id}</div>
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
              <div className="flex gap-2">
                <Button onClick={handleTestSend} size="sm" disabled={testSending}>Send Test</Button>
                <Button
                  variant="destructive"
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
                  size="sm"
                >
                  Disconnect
                </Button>
              </div>
              <p className="text-[11px] text-slate-500">Note: Test numbers require recipients to be verified in Meta's API Setup, or start a session by messaging your number first.</p>
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
        {/* Future integrations can be added here */}
      </div>
    </section>
  );
}
