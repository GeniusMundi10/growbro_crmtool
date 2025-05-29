"use client";

import Header from "@/components/header"
import DashboardTabs from "@/components/dashboard-tabs"
import PhotoUploadForm from "./photo-upload-form"
import React, { Suspense } from "react";
import PhotoForm from "./photo-form";

export default function PhotoPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header title="Dashboard" />
      <div className="container mx-auto px-4 py-6">
        <DashboardTabs activeTab="photo" />
        <div className="mt-8">
          <PhotoForm />
        </div>
      </div>
    </div>
  )
}
