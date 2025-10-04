import { useEffect, useRef, useState } from 'react';

interface PollingOptions {
  enabled?: boolean;
  interval?: number; // milliseconds
  onUpdate?: (data: any) => void;
}

export function useConversationPolling(
  userId: string | undefined,
  options: PollingOptions = {}
) {
  const {
    enabled = true,
    interval = 10000, // 10 seconds default
    onUpdate,
  } = options;

  const [lastPollTime, setLastPollTime] = useState<string>(new Date().toISOString());
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    const poll = async () => {
      // Don't poll if already polling (prevent overlapping requests)
      if (isPolling) return;

      setIsPolling(true);
      try {
        // Check for updated conversations
        const response = await fetch(`/api/conversations/poll?since=${lastPollTime}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.updated_conversations && data.updated_conversations.length > 0) {
            console.log('[Polling] Found updates:', data.updated_conversations.length);
            
            // Update last poll time
            setLastPollTime(new Date().toISOString());
            
            // Notify parent component
            if (onUpdate) {
              onUpdate(data);
            }
          }
        }
      } catch (error) {
        console.error('[Polling] Error:', error);
        // Don't throw - just log and continue polling
      } finally {
        setIsPolling(false);
      }
    };

    // Initial poll
    poll();

    // Set up interval
    intervalRef.current = setInterval(poll, interval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, userId, interval, lastPollTime, isPolling, onUpdate]);

  // Pause polling when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden - clear interval
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Tab is visible - resume polling
        if (enabled && userId && !intervalRef.current) {
          const poll = async () => {
            if (isPolling) return;
            setIsPolling(true);
            try {
              const response = await fetch(`/api/conversations/poll?since=${lastPollTime}`);
              if (response.ok) {
                const data = await response.json();
                if (data.updated_conversations && data.updated_conversations.length > 0) {
                  setLastPollTime(new Date().toISOString());
                  if (onUpdate) onUpdate(data);
                }
              }
            } catch (error) {
              console.error('[Polling] Error:', error);
            } finally {
              setIsPolling(false);
            }
          };
          
          poll();
          intervalRef.current = setInterval(poll, interval);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, userId, interval, lastPollTime, isPolling, onUpdate]);

  return {
    isPolling,
    lastPollTime,
  };
}
