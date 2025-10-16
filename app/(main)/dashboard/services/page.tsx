"use client";

export const dynamic = "force-dynamic";

import Header from "@/components/header"
import DashboardTabs from "@/components/dashboard-tabs"
import ServicesForm from "./services-form"
import React, { Suspense } from "react";

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header title="Dashboard" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <DashboardTabs activeTab="services" />
        <div className="mt-6 sm:mt-8">
          <ServicesForm />
        </div>
      </div>
    </div>
  )
}
