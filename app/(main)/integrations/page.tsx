"use client";
export const dynamic = "force-dynamic";

import React from "react";
import Header from "@/components/header";
import IntegrationsForm from "./integrations-form";

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header 
        title="Integrations" 
        description="Connect third-party tools to super-charge your AI assistant workflow."
        showTitleInHeader={false} 
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <IntegrationsForm />
      </div>
    </div>
  );
}
