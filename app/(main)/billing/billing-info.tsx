"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import PricingPlans from "./pricing-plans"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { useUser } from "@/context/UserContext"

export default function BillingInfo() {
  const router = useRouter()
  const [showPricingPlans, setShowPricingPlans] = useState(false)
  const { user } = useUser()
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [totalChatMessages, setTotalChatMessages] = useState(0)
  const [daysLeftInTrial, setDaysLeftInTrial] = useState(0)
  
  // Function to fetch total chat messages for the current user
  const fetchTotalChatMessages = async (userId: string) => {
    if (!userId) return
    
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!, 
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      // Query to get the sum of message_count for the specific client_id (user_id)
      const { data, error } = await supabase
        .from('dashboard_message_summary')
        .select('message_count')
        .eq('client_id', userId)
        
      if (error) {
        console.error('Error fetching total chat messages:', error)
        return
      }
      
      // Calculate the total message count from the returned rows
      if (data && data.length > 0) {
        const totalMessages = data.reduce((sum, row) => sum + (Number(row.message_count) || 0), 0)
        console.log('Total chat messages calculated:', totalMessages)
        setTotalChatMessages(totalMessages)
      }
    } catch (error) {
      console.error('Error in fetchTotalChatMessages:', error)
    }
  }

  // Function to fetch user subscription details
  const fetchSubscription = async () => {
  console.log('[BillingInfo] user:', user);
    if (!user?.id) return
    
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!, 
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      console.log('Fetching user data for:', user.id)
      
      // Use plan and trial_days from context instead of querying users table
      const planName = user?.plan ? user.plan.toLowerCase() : 'free';
      const trialDays = typeof user?.trial_days === 'number' ? user.trial_days : null;

      // Calculate days left in free trial (14 days total)
      if (trialDays !== null) {
        const daysLeft = Math.max(0, 14 - trialDays);
        setDaysLeftInTrial(daysLeft);
        console.log('Days left in trial (from context):', daysLeft);
      }

      if (planName && planName !== 'free') {
        console.log('User has a plan set:', planName)
        
        // Get plan details based on the plan name
        const { data: planData, error: planError } = await supabase
          .from('plans')
          .select('*')
          .ilike('name', planName)
          .limit(1);
        console.log('[BillingInfo] planData:', planData, 'planError:', planError);
          
        if (planError) {
          console.log('Error fetching plan details:', JSON.stringify(planError, null, 2) || 'Unknown error')
        }
        
        if (planData && planData.length > 0) {
          console.log('Found plan in database:', planData[0])
          setSubscription({
            plans: planData[0],
            plan_id: planName
          })
        } else {
          // If plan details are not in database, create a default one based on the plan name
          console.log('Creating default plan features for:', planName)
          
          // Default plan features based on plan name
          const defaultPlans = {
            'starter': {
              name: 'Starter',
              chat_messages: 25000,
              voice_messages: 0,
              ai_agents: 1,
              custom_branding: false,
              remove_watermark: false
            },
            'basic': {
              name: 'Basic',
              chat_messages: 100000,
              voice_messages: 0,
              ai_agents: 2,
              custom_branding: false,
              remove_watermark: false
            },
            'pro': {
              name: 'Pro',
              chat_messages: 250000,
              voice_messages: 300,
              ai_agents: 4,
              custom_branding: true,
              remove_watermark: true
            },
            'growth': {
              name: 'Growth',
              chat_messages: 500000,
              voice_messages: 400,
              ai_agents: 7,
              custom_branding: true,
              remove_watermark: true
            },
            'advanced': {
              name: 'Advanced',
              chat_messages: 2000000,
              voice_messages: 600,
              ai_agents: 10,
              custom_branding: true,
              remove_watermark: true
            }
          }
          
          if (defaultPlans[planName as keyof typeof defaultPlans]) {
            setSubscription({
              plans: defaultPlans[planName as keyof typeof defaultPlans],
              plan_id: planName
            })
          }
        }
      } else {
        console.log('User is on free plan or plan not set')
      }
    } catch (error) {
      console.error('Error in fetchSubscription:', error)
    }
  }
  
  // Fetch both subscription and message data when component mounts or user changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      
      if (user?.id) {
        await fetchSubscription()
        await fetchTotalChatMessages(user.id)
      }
      
      setLoading(false)
    }
    
    loadData()
  }, [user?.id])

  return (
    <>
      {showPricingPlans ? (
        <PricingPlans onClose={() => setShowPricingPlans(false)} />
      ) : (
        <Card className="max-w-md mx-auto">
          <CardHeader className={`${subscription ? 'bg-green-600' : 'bg-gray-600'} text-white`}>
            <CardTitle>{loading ? 'Loading...' : subscription ? subscription.plans?.name || 'Subscription' : 'Free Plan'}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ul className="space-y-2 mb-6">
              {loading ? (
                <li>Loading plan details...</li>
              ) : subscription ? (
                // Display features based on subscription plan
                <>
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    <span>{subscription.plans?.chat_messages || '250000'} chat messages</span>
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    <span>{subscription.plans?.voice_messages || '0'} voice minutes</span>
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    <span>{subscription.plans?.ai_agents || '1'} AI Agents</span>
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    <span>Unlimited Sales Leads</span>
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    <span>Custom Branding: {subscription.plans?.custom_branding ? 'Yes' : 'No'}</span>
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    <span>Remove Watermark: {subscription.plans?.remove_watermark ? 'Yes' : 'No'}</span>
                  </li>
                </>
              ) : (
                // Free plan features
                <>
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
                </>
              )}
            </ul>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span>Total Due:</span>
                <span>$0</span>
              </div>
              <div className="flex justify-between">
                <span>Total Chat Messages:</span>
                <span>{totalChatMessages}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Voice Messages:</span>
                <span>0</span>
              </div>
              <div className="flex justify-between">
                <span>Days left in Free Trial:</span>
                <span>{daysLeftInTrial}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button 
                onClick={() => setShowPricingPlans(true)} 
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {subscription ? 'Upgrade Plan' : 'Subscribe'}
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
