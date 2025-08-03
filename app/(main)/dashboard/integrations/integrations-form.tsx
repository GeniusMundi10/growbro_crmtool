"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { CheckCircle2, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

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
  const [loading, setLoading] = useState(true);

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
        {/* Future integrations can be added here */}
      </div>
    </section>
  );
}
