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


export default function PricingPlans({ onClose }: PricingPlansProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const { user, loading: userLoading } = useUser();
  
  // Get user's current plan to determine which plans to disable
  const currentPlan = user?.plan?.toLowerCase() || 'free';
  
  // Helper function to determine if a plan should be disabled
  const isPlanDisabled = (planName: string, userPlan: string): boolean => {
    const planRanking = {
      'free': 0,
      'starter': 1,
      'basic': 2, 
      'pro': 3,
      'growth': 4,
      'advanced': 5
    };
    
    return planRanking[planName as keyof typeof planRanking] <= planRanking[userPlan as keyof typeof planRanking];
  };

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
      price: billingCycle === "monthly" ? "$29" : "$24",
      features: [
        "5,000 chat messages",
        "$1 per additional 1,000 messages",
        "Voice not included",
        "1 AI Agent",
        "Unlimited Sales Leads",
        "Customer Chat history",
        "Lead capture & contact export",
      ],
    },
    {
      name: "Basic",
      description: "For startups",
      price: billingCycle === "monthly" ? "$49" : "$41",
      features: [
        "20,000 chat messages",
        "$1 per additional 1,000 messages",
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
      price: billingCycle === "monthly" ? "$99" : "$82",
      features: [
        "50,000 chat messages",
        "$1 per additional 1,000 messages",
        "300 voice messages",
        "$1 per additional voice minute",
        "4 AI Agents",
        "Unlimited Sales Leads",
        "Remove Growbro watermark",
      ],
      popular: true,
    },
    {
      name: "Growth",
      description: "For growing businesses",
      price: billingCycle === "monthly" ? "$129" : "$107",
      features: [
        "100,000 chat messages",
        "$1 per additional 1,000 messages",
        "400 voice messages",
        "$1 per additional voice minute",
        "7 AI Agents",
        "Unlimited Sales Leads",
        "Remove Growbro watermark",
      ],
    },
    {
      name: "Advanced",
      description: "For scaling teams",
      price: billingCycle === "monthly" ? "$349" : "$290",
      features: [
        "250,000 chat messages",
        "$1 per additional 1,000 messages",
        "1,000 voice messages",
        "$1 per additional voice minute",
        "11 AI Agents",
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
        <div className="flex items-center justify-center mb-8 gap-3">
          <Switch
            id="billing-cycle"
            checked={billingCycle === "yearly"}
            onCheckedChange={(checked) => setBillingCycle(checked ? "yearly" : "monthly")}
            className="mx-2"
          />
          <Label htmlFor="billing-cycle" className="flex items-center gap-1 cursor-pointer select-none text-lg">
            <span className={billingCycle === "yearly" ? "font-bold text-green-600" : ""}>Annual (17% Discount)</span>
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
                <span className="text-gray-500">/mo</span>
                {billingCycle === "yearly" && (
                  <div className="text-xs text-gray-500 mt-1">
                    ${parseFloat(plan.price.replace(/[^\d.]/g, "")) * 12}/yr
                  </div>
                )}
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
                disabled={loadingPlan === plan.name || userLoading || isPlanDisabled(plan.name.toLowerCase(), currentPlan)}
                title={isPlanDisabled(plan.name.toLowerCase(), currentPlan) ? 
                    "You're already subscribed to this plan or a higher plan" : 
                    ""}
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
                    // 1. Calculate INR amount based on toggle
                    const usdPrice = parseFloat(plan.price.replace(/[^\d.]/g, ""));
                    let amount = 0;
                    if (billingCycle === "monthly") {
                      amount = Math.round(usdPrice * 86);
                    } else {
                      amount = Math.round(usdPrice * 12 * 86);
                    }
                    // 2. Create Razorpay order
                    const res = await fetch("/api/payments/razorpay", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        user_id: user.id,
                        plan_id: plan.name.toLowerCase(),
                        amount,
                        currency: "INR",
                        billing_cycle: billingCycle,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok || !data.order) throw new Error(data.error || "Failed to create payment order");
                    // 2. Load Razorpay script if not present
                    if (!document.getElementById("razorpay-sdk")) {
                      const script = document.createElement("script");
                      script.id = "razorpay-sdk";
                      script.src = "https://checkout.razorpay.com/v1/checkout.js";
                      document.body.appendChild(script);
                      await new Promise((resolve) => {
                        script.onload = resolve;
                      });
                    }
                    // 3. Trigger Razorpay checkout
                    const options = {
                      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_eIZIu8DDRCbETJ", // fallback for local dev
                      amount: data.order.amount,
                      currency: data.order.currency,
                      name: "Growbro.ai CRM",
                      description: plan.description,
                      order_id: data.order.id,
                      handler: async function (response: any) {
                        // 4. Verify payment
                        const verifyRes = await fetch("/api/payments/razorpay", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            user_id: user.id,
                            plan_id: plan.name.toLowerCase(),
                            amount,
                            currency: "INR",
                            billing_cycle: billingCycle,
                          }),
                        });
                        const verifyData = await verifyRes.json();
                        if (verifyData.success) {
                          setPaymentStatus("Payment successful! Thank you for your purchase.");
                        } else {
                          setPaymentStatus("Payment failed. " + (verifyData.error || "Please try again or contact support."));
                        }
                      },
                      prefill: {
                        name: user.name || "User",
                        email: user.email,
                        contact: (user as any).phone,
                      },
                      theme: { color: plan.popular ? "#16a34a" : "#e5e7eb" },
                    };
                    // @ts-ignore
                    const rzp = new window.Razorpay(options);
                    rzp.open();
                  } catch (err: any) {
                    setError(err.message || "Payment initiation failed");
                  } finally {
                    setLoadingPlan(null);
                  }
                }}
              >
                {loadingPlan === plan.name ? "Processing..." : 
                 isPlanDisabled(plan.name.toLowerCase(), currentPlan) ? 
                 "Current or Lower Plan" : "Select"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {error && (
        <div className="text-red-500 text-center mt-4">{error}</div>
      )}
      {/* Razorpay checkout UI will be placed here */}
    </div>
  )
}

