"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface PricingPlansProps {
  onClose?: () => void
}

export default function PricingPlans({ onClose }: PricingPlansProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")

  const plans = [
    {
      name: "Starter",
      description: "For entrepreneurs",
      price: billingCycle === "monthly" ? "$49" : "$490",
      features: [
        "25000 chat messages",
        "$0.10 per additional 1000 messages",
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
      price: billingCycle === "monthly" ? "$199" : "$1990",
      features: [
        "100000 chat messages",
        "$0.08 per additional 1000 messages",
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
      price: billingCycle === "monthly" ? "$349" : "$3490",
      features: [
        "250000 chat messages",
        "$0.07 per additional 1000 messages",
        "300 voice messages",
        "$0.35 per additional voice minute",
        "4 AI Agents",
        "Unlimited Sales Leads",
        "Remove Growbro watermark",
      ],
      popular: true,
    },
    {
      name: "Growth",
      description: "For growing businesses",
      price: billingCycle === "monthly" ? "$649" : "$6490",
      features: [
        "500000 chat messages",
        "$0.06 per additional 1000 messages",
        "400 voice messages",
        "$0.34 per additional voice minute",
        "7 AI Agents",
        "Unlimited Sales Leads",
        "Remove Growbro watermark",
      ],
    },
    {
      name: "Advanced",
      description: "For scaling teams",
      price: billingCycle === "monthly" ? "$1199" : "$11990",
      features: [
        "2000000 chat messages",
        "$0.05 per additional 1000 messages",
        "600 voice messages",
        "$0.32 per additional voice minute",
        "10 AI Agents",
        "Unlimited Sales Leads",
        "Remove Growbro watermark",
      ],
    },
  ]

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
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
              >
                Select
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
