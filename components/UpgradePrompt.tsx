import React from "react";
import { Button } from "@/components/ui/button";

export default function UpgradePrompt() {
  return (
    <div className="flex flex-col items-center justify-center bg-white border rounded-lg p-8 shadow-sm min-h-[300px]">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Upgrade Required</h2>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        The Teams feature is only available on the <span className="font-bold text-green-700">Pro</span> plan and above.<br />
        Please upgrade your plan to unlock team management and collaboration features.
      </p>
      <Button className="bg-green-600 hover:bg-green-700 px-6 py-2 text-lg" asChild>
        <a href="/settings/billing">Upgrade Plan</a>
      </Button>
    </div>
  );
}
