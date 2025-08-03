"use client";
export const dynamic = "force-dynamic";

import React from "react";
import Header from "@/components/header";
import IntegrationsForm from "../dashboard/integrations/integrations-form";

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header title="Integrations" />
      <div className="container mx-auto px-4 py-6">
        <IntegrationsForm />
      </div>
    </div>
  );
}
