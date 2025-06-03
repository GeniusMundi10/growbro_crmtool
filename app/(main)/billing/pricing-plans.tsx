"use client"

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useUser } from "@/context/UserContext"

interface PricingPlansProps {
  onClose?: () => void
}

function PayUForm({ payuParams }: { payuParams: any }) {
  // Auto-submit form when params are present
  return (
    <form
      action={payuParams.action}
      method="POST"
      style={{ display: "none" }}
      id="payuForm"
    >
      {Object.entries(payuParams).map(([key, value]) =>
        key !== "action" ? (
          <input key={key} type="hidden" name={key} value={value as string} />
        ) : null
      )}
    </form>
  );
}

export default function PricingPlans({ onClose }: PricingPlansProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const [payuParams, setPayuParams] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const { user, loading: userLoading } = useUser();

  // Set payment status from URL on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const status = params.get('payment');
      if (status === 'success') setPaymentStatus('Payment successful! Thank you for your purchase.');
      else if (status === 'failure') setPaymentStatus('Payment failed. Please try again or contact support.');
    }
  }, []);

  const plans = [
    {
      name: "Starter",
      description: "For entrepreneurs",
      price: billingCycle === "monthly" ? "₹4199" : "₹41990",
      features: [
        "25000 chat messages",
        "₹8 per additional 1000 messages",
        "Voice not included",
        "1 AI Agent",
        "Unlimited Sales Leads",
        "Customer Chat history",
        "Lead capture & contact export",
      ],
    },
    {
      name: "Basic",
      description: "For new startups",
      price: billingCycle === "monthly" ? "₹16999" : "₹169990",
      features: [
        "100000 chat messages",
        "₹8 per additional 1000 messages",
        "Voice not included",
        "2 AI Agents",
        "Unlimited Sales Leads",
        "Customer Chat history",
        "Lead capture & contact export",
      ],
    },
    {
      name: "Pro",
      description: "For small businesses",
      price: billingCycle === "monthly" ? "₹29699" : "₹296990",
      features: [
        "250000 chat messages",
        "₹8 per additional 1000 messages",
        "300 voice messages",
        "₹35 per additional voice minute",
        "4 AI Agents",
        "Unlimited Sales Leads",
        "Remove Growbro watermark",
      ],
      popular: true,
    },
    {
      name: "Growth",
      description: "For growing businesses",
      price: billingCycle === "monthly" ? "₹55199" : "₹551990",
      features: [
        "500000 chat messages",
        "₹6 per additional 1000 messages",
        "400 voice messages",
        "₹34 per additional voice minute",
        "7 AI Agents",
        "Unlimited Sales Leads",
        "Remove Growbro watermark",
      ],
    },
    {
      name: "Advanced",
      description: "For scaling teams",
      price: billingCycle === "monthly" ? "₹101999" : "₹1019990",
      features: [
        "2000000 chat messages",
        "₹5 per additional 1000 messages",
        "600 voice messages",
        "₹32 per additional voice minute",
        "10 AI Agents",
        "Unlimited Sales Leads",
        "Remove Growbro watermark",
      ],
    },
  ]

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      {paymentStatus && (
        <div className={`mb-4 text-center ${paymentStatus.includes('successful') ? 'text-green-600' : 'text-red-600'}`}>{paymentStatus}</div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Choose Your Plan</h2>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <p className="text-center mb-6">Select the plan that fits your needs</p>

      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-2">
          <Label htmlFor="billing-cycle" className={billingCycle === "monthly" ? "font-bold" : ""}>
            Monthly
          </Label>
          <Switch
            id="billing-cycle"
            checked={billingCycle === "yearly"}
            onCheckedChange={(checked) => setBillingCycle(checked ? "yearly" : "monthly")}
          />
          <Label htmlFor="billing-cycle" className={billingCycle === "yearly" ? "font-bold" : ""}>
            Yearly
          </Label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {plans.map((plan) => (
          <Card key={plan.name} className={`overflow-hidden ${plan.popular ? "border-green-500 border-2" : ""}`}>
            <CardHeader className={`${plan.popular ? "bg-green-600 text-white" : "bg-gray-50"}`}>
              <CardTitle className="text-center">{plan.name}</CardTitle>
              <p className="text-center text-sm">{plan.description}</p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-gray-500">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${
                  plan.popular ? "bg-green-600 hover:bg-green-700" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                }`}
                 disabled={loadingPlan === plan.name || userLoading}
                onClick={async () => {
                  setError(null);
                  if (!user || userLoading) {
                    setError("Please log in to subscribe.");
                    return;
                  }
                  if (!(user as any).phone) {
                    setError("Please add your phone number in your profile before subscribing.");
                    return;
                  }
                  setLoadingPlan(plan.name);
                  try {
                    const res = await fetch("/api/payments/payu", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        userId: user.id,
                        firstname: user.name || "User",
                        email: user.email,
                        phone: (user as any).phone,
                        plan: plan.name.toLowerCase(),
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Failed to initiate payment");
                    setPayuParams(data);
                    setTimeout(() => {
                      document.getElementById("payuForm")?.submit();
                    }, 100);
                  } catch (err: any) {
                    setError(err.message || "Payment initiation failed");
                  } finally {
                    setLoadingPlan(null);
                  }
                }}
              >
                {loadingPlan === plan.name ? "Processing..." : "Select"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {error && (
        <div className="text-red-500 text-center mt-4">{error}</div>
      )}
      {payuParams && <PayUForm payuParams={payuParams} />}
    </div>
  )
}

