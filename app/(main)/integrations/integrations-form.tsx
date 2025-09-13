"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { CheckCircle2, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface IntegrationCardProps {
  name: string;
  description: string;
  connected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

function IntegrationCard({ name, description, connected, onConnect, onDisconnect }: IntegrationCardProps) {
  return (
    <Card className="max-w-md w-full shadow-sm border border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Plug className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-lg font-semibold">{name}</CardTitle>
        </div>
        {connected && <CheckCircle2 className="h-5 w-5 text-green-600" />}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        {connected ? (
          <Button variant="destructive" onClick={onDisconnect} size="sm">
            Disconnect
          </Button>
        ) : (
          <Button onClick={onConnect} size="sm">
            Connect
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function IntegrationsForm() {
  const { user } = useUser();
  const [hubspotConnected, setHubspotConnected] = useState<boolean>(false);
  const [whatsappConnected, setWhatsappConnected] = useState<boolean>(false);
  const [whatsappInfo, setWhatsappInfo] = useState<any>(null);
  const [waList, setWaList] = useState<Array<any>>([]);
  const [selectedAiId, setSelectedAiId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [testTo, setTestTo] = useState("");
  const [testMsg, setTestMsg] = useState("Hello from GrowBro test");
  const [testSending, setTestSending] = useState(false);
  const fbReadyRef = useRef(false);
  const waSessionDataRef = useRef<{ waba_id?: string; phone_number_id?: string } | null>(null);

  // Load connection status from backend
  useEffect(() => {
    const checkStatus = async () => {
      setLoading(true);
      try {
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
        // Default selection: currently connected (from status) or most recent
        const defaultAi = (data?.info?.ai_id as string | undefined) || (items[0]?.ai_id as string | undefined) || null;
        setSelectedAiId(defaultAi);
      } catch {
        setWhatsappConnected(false);
        setWhatsappInfo(null);
        setWaList([]);
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

  const handleConnectHubspot = async () => {
    try {
      const popup = window.open(
        "/api/hubspot/oauth-url",
        "hubspot-oauth",
        "width=600,height=700"
      );
      if (!popup) {
        toast.error("Popup blocked. Please allow popups and try again.");
        return;
      }
      // Listen for postMessage from popup
      const listener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data.status === "connected") {
          setHubspotConnected(true);
          toast.success("HubSpot connected!");
          window.removeEventListener("message", listener);
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
      const res = await fetch("/api/hubspot/disconnect", { method: "POST" });
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
        try {
          const data = JSON.parse((event as any).data);
          if (data?.type === "WA_EMBEDDED_SIGNUP") {
            waSessionDataRef.current = {
              waba_id: data?.data?.waba_id,
              phone_number_id: data?.data?.phone_number_id,
            };
          }
        } catch {
          // ignore non-JSON messages
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
    try {
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

      function fbLoginCallback(response: any) {
        if (response?.authResponse?.code) {
          const code = response.authResponse.code as string;
          const body = {
            code,
            waba_id: waSessionDataRef.current?.waba_id,
            phone_number_id: waSessionDataRef.current?.phone_number_id,
            // Important for OAuth code exchange: must match the page that launched the flow
            redirect_uri: typeof window !== 'undefined' ? window.location.href : undefined,
          };
          fetch("/api/whatsapp/embedded-callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
            .then(async (resp) => {
              const data = await resp.json().catch(() => ({}));
              if (!resp.ok || !(data as any)?.success) {
                toast.error((data as any)?.error || "WhatsApp onboarding failed");
                return;
              }
              setWhatsappConnected(true);
              toast.success("WhatsApp connected!");
            })
            .catch((e) => {
              console.error(e);
              toast.error("Backend error during WhatsApp onboarding");
            });
        } else {
          toast.error("WhatsApp signup was cancelled or failed.");
        }
      }

      FB.login(fbLoginCallback, {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
        extras: { setup: {}, sessionInfoVersion: "3" },
      });
    } catch (e) {
      console.error(e);
      toast.error("Unable to initiate WhatsApp connection");
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
    return <div className="text-center text-gray-500 py-10">Loading...</div>;
  }

  return (
    <section className="w-full max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6 text-slate-800">Integrations</h1>
      <p className="text-sm text-slate-600 mb-10">Connect third-party tools to super-charge your AI assistant workflow.</p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <IntegrationCard
        name="HubSpot"
        description="Sync leads you capture in GrowBro directly into your HubSpot CRM."
        connected={hubspotConnected}
        onConnect={handleConnectHubspot}
        onDisconnect={handleDisconnectHubspot}
      />
      <Card className="max-w-md w-full shadow-sm border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Plug className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg font-semibold">WhatsApp</CardTitle>
          </div>
          {whatsappConnected && <CheckCircle2 className="h-5 w-5 text-green-600" />}
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
            <Button onClick={handleConnectWhatsApp} size="sm">Connect</Button>
          )}
        </CardContent>
      </Card>
        {/* Future integrations can be added here */}
      </div>
    </section>
  );
}
