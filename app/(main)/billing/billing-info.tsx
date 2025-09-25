"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import PricingPlans from "./pricing-plans"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { useUser } from "@/context/UserContext"
import { Badge } from "@/components/ui/badge"
import { Shimmer } from "@/components/ui/shimmer"
import { Crown, ArrowRight, BarChart2, Calendar, MessageSquare, CreditCard } from "lucide-react"

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
              chat_messages: 5000,
              voice_messages: 0,
              ai_agents: 1,
              custom_branding: false,
              remove_watermark: false
            },
            'basic': {
              name: 'Basic',
              chat_messages: 20000,
              voice_messages: 0,
              ai_agents: 2,
              custom_branding: false,
              remove_watermark: false
            },
            'pro': {
              name: 'Pro',
              chat_messages: 50000,
              voice_messages: 300,
              ai_agents: 4,
              custom_branding: true,
              remove_watermark: true
            },
            'growth': {
              name: 'Growth',
              chat_messages: 100000,
              voice_messages: 400,
              ai_agents: 7,
              custom_branding: true,
              remove_watermark: true
            },
            'advanced': {
              name: 'Advanced',
              chat_messages: 250000,
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
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              <Card className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Shimmer className="h-5 w-40" />
                      <Shimmer className="h-4 w-24" />
                    </div>
                    <Shimmer className="h-8 w-24 rounded-full" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Shimmer key={i} className="h-4 w-[70%]" />
                  ))}
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {["Total Due", "Messages", "Voice", "Trial Days"].map((_, i) => (
                  <Card key={i} className="shadow-sm">
                    <CardContent className="py-4">
                      <Shimmer className="h-4 w-24 mb-2" />
                      <Shimmer className="h-6 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Current Plan */}
              <Card className="shadow-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {subscription ? (subscription.plans?.name || 'Subscription') : 'Free Plan'}
                      </CardTitle>
                      <div className="text-sm text-muted-foreground">
                        {subscription ? 'Your current plan' : 'You are currently on the free plan'}
                      </div>
                    </div>
                    {subscription ? (
                      <Badge variant="outline" className="bg-white">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Free</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-2 mb-6 text-sm">
                    {subscription ? (
                      <>
                        <li className="flex items-center"><MessageSquare className="h-4 w-4 mr-2 text-emerald-600" />{subscription.plans?.chat_messages || '250000'} chat messages</li>
                        <li className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-blue-600" />{subscription.plans?.voice_messages || '0'} voice minutes</li>
                        <li className="flex items-center"><Crown className="h-4 w-4 mr-2 text-purple-600" />{subscription.plans?.ai_agents || '1'} AI Agents</li>
                        <li className="flex items-center"><ArrowRight className="h-4 w-4 mr-2 text-slate-600" />Unlimited Sales Leads</li>
                        <li className="flex items-center"><ArrowRight className="h-4 w-4 mr-2 text-slate-600" />Custom Branding: {subscription.plans?.custom_branding ? 'Yes' : 'No'}</li>
                        <li className="flex items-center"><ArrowRight className="h-4 w-4 mr-2 text-slate-600" />Remove Watermark: {subscription.plans?.remove_watermark ? 'Yes' : 'No'}</li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-center"><MessageSquare className="h-4 w-4 mr-2 text-emerald-600" />100 chat messages</li>
                        <li className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-blue-600" />0 voice minutes</li>
                        <li className="flex items-center"><Crown className="h-4 w-4 mr-2 text-purple-600" />1 AI Agents</li>
                        <li className="flex items-center"><ArrowRight className="h-4 w-4 mr-2 text-slate-600" />Unlimited Sales Leads</li>
                        <li className="flex items-center"><ArrowRight className="h-4 w-4 mr-2 text-slate-600" />Custom Branding: No</li>
                        <li className="flex items-center"><ArrowRight className="h-4 w-4 mr-2 text-slate-600" />Remove Watermark: No</li>
                      </>
                    )}
                  </ul>

                  {/* Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="shadow-none border">
                      <CardContent className="py-4">
                        <div className="text-xs text-muted-foreground">Total Due</div>
                        <div className="text-xl font-semibold">$0</div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-none border">
                      <CardContent className="py-4">
                        <div className="text-xs text-muted-foreground">Total Chat Messages</div>
                        <div className="text-xl font-semibold">{totalChatMessages}</div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-none border">
                      <CardContent className="py-4">
                        <div className="text-xs text-muted-foreground">Total Voice Messages</div>
                        <div className="text-xl font-semibold">0</div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-none border">
                      <CardContent className="py-4">
                        <div className="text-xs text-muted-foreground">Days left in Free Trial</div>
                        <div className="text-xl font-semibold">{daysLeftInTrial}</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={() => setShowPricingPlans(true)} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                      <Crown className="h-4 w-4 mr-2" /> {subscription ? 'Upgrade Plan' : 'Subscribe'}
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => router.push("/billing/usage")}>
                      <BarChart2 className="h-4 w-4 mr-2" /> View Usage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </>
  )
}
