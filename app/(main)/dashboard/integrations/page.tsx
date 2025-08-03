"use client";

export const dynamic = "force-dynamic";

import Header from "@/components/header";
import DashboardTabs from "@/components/dashboard-tabs";
import IntegrationsForm from "./integrations-form";

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header title="Dashboard" />
      <div className="container mx-auto px-4 py-6">
        <DashboardTabs activeTab="integrations" />
        <div className="mt-8 flex justify-center">
          <IntegrationsForm />
        </div>
      </div>
    </div>
  );
}
