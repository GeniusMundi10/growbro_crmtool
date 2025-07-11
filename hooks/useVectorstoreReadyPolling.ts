import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useNotifications } from "@/context/NotificationContext";

/**
 * Polls the vectorstore_ready status for a given AI and notifies when it flips to true.
 * @param aiId The AI/business id to poll for.
 * @param pollIntervalMs Polling interval in milliseconds (default: 10000).
 */
export function useVectorstoreReadyPolling(aiId: string | undefined, pollIntervalMs = 10000) {
  const { addNotification } = useNotifications();
  const prevReady = useRef<boolean | null>(null);

  useEffect(() => {
    if (!aiId) return;
    let interval: NodeJS.Timeout;
    let cancelled = false;

    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from("business_info")
        .select("vectorstore_ready")
        .eq("id", aiId)
        .single();
      if (error || !data) return;
      const ready = !!data.vectorstore_ready;
      // Only show notification if transitioning from false to true
      if (prevReady.current === false && ready === true) {
        addNotification({
          content: "Your AI Assistant is ready to be deployed to your website!",
          icon: undefined,
        });
      }
      prevReady.current = ready;
    };
    // Initial fetch
    fetchStatus();
    interval = setInterval(fetchStatus, pollIntervalMs);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [aiId, pollIntervalMs, addNotification]);
}
