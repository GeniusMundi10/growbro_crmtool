"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import PricingPlans from "./pricing-plans"
import { useRouter } from "next/navigation"

export default function BillingInfo() {
  const router = useRouter()
  const [showPricingPlans, setShowPricingPlans] = useState(false)

  return (
    <>
      {showPricingPlans ? (
        <PricingPlans onClose={() => setShowPricingPlans(false)} />
      ) : (
        <Card className="max-w-md mx-auto">
          <CardHeader className="bg-green-600 text-white">
            <CardTitle>Free Plan</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ul className="space-y-2 mb-6">
              <li className="flex items-center">
                <span className="mr-2">•</span>
                <span>100 chat minutes</span>
              </li>
              <li className="flex items-center">
                <span className="mr-2">•</span>
                <span>0 voice minutes</span>
              </li>
              <li className="flex items-center">
                <span className="mr-2">•</span>
                <span>1 AI Agents</span>
              </li>
              <li className="flex items-center">
                <span className="mr-2">•</span>
                <span>Unlimited Sales Leads</span>
              </li>
              <li className="flex items-center">
                <span className="mr-2">•</span>
                <span>Custom Branding: No</span>
              </li>
              <li className="flex items-center">
                <span className="mr-2">•</span>
                <span>Remove Watermark: No</span>
              </li>
            </ul>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span>Total Due:</span>
                <span>$0</span>
              </div>
              <div className="flex justify-between">
                <span>Total Chat Minutes:</span>
                <span>0</span>
              </div>
              <div className="flex justify-between">
                <span>Total Voice Minutes:</span>
                <span>0</span>
              </div>
              <div className="flex justify-between">
                <span>Days left in Free Trial:</span>
                <span>13</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button onClick={() => setShowPricingPlans(true)} className="w-full bg-green-600 hover:bg-green-700">
                Subscribe
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => router.push("/billing/usage")}
              >
                View Usage
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
