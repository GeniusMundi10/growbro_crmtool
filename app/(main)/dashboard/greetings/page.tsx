"use client";

import Header from "@/components/header"
import DashboardTabs from "@/components/dashboard-tabs"
import GreetingsForm from "./greetings-form"
import React, { Suspense } from "react";

export default function GreetingsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header title="Dashboard" />
      <div className="container mx-auto px-4 py-6">
        <DashboardTabs activeTab="greetings" />
        <div className="mt-8">
          <GreetingsForm />
        </div>
      </div>
    </div>
  )
}
