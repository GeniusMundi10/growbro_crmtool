"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function CallbackHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const status = searchParams.get("status");
    const error = searchParams.get("error");

    if (window.opener) {
      if (status === "gcal_connected") {
        window.opener.postMessage({ status: "gcal_connected" }, window.location.origin);
      } else if (error) {
        window.opener.postMessage({ status: "gcal_error", error }, window.location.origin);
      }
      window.close();
    } else {
      // If no opener, redirect to integrations page
      if (status === "gcal_connected") {
        window.location.href = "/integrations?status=gcal_connected";
      } else {
        window.location.href = "/integrations?error=" + (error || "unknown");
      }
    }
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing connection...</p>
      </div>
    </div>
  );
}

export default function GoogleCalendarCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
