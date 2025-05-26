"use client";

export const dynamic = "force-dynamic";

import Header from "@/components/header"
import DashboardTabs from "@/components/dashboard-tabs"
import LeadCaptureForm from "./lead-capture-form"
import React, { Suspense } from "react";

export default function LeadCapturePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header title="Dashboard" />
      <div className="container mx-auto px-4 py-6">
        <DashboardTabs activeTab="lead-capture" />
        <div className="mt-8">
          <Suspense fallback={<div>Loading Lead Capture...</div>}>
            <LeadCaptureForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
