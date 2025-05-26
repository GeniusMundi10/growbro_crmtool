"use client";

export const dynamic = "force-dynamic";

import Header from "@/components/header"
import DashboardTabs from "@/components/dashboard-tabs"
import ResourceLinksForm from "./resource-links-form"
import React, { Suspense } from "react";

export default function ResourceLinksPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header title="Dashboard" />
      <div className="container mx-auto px-4 py-6">
        <DashboardTabs activeTab="resource-links" />
        <div className="mt-8">
          <ResourceLinksForm />
        </div>
      </div>
    </div>
  )
}
