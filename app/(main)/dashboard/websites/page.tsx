"use client";

export const dynamic = "force-dynamic";

import Header from "@/components/header"
import DashboardTabs from "@/components/dashboard-tabs"
import WebsitesForm from "./websites-form"
import React, { Suspense } from "react";

export default function WebsitesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header title="Dashboard" />
      <div className="container mx-auto px-4 py-6">
        <DashboardTabs activeTab="websites" />
        <div className="mt-8">
          <WebsitesForm />
        </div>
      </div>
    </div>
  )
}
