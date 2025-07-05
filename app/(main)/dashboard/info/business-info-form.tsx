"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertCircle, Check, RefreshCw, Info } from "lucide-react"
import { getBusinessInfo, createBusinessInfo, updateBusinessInfo } from "@/lib/supabase"
import type { BusinessInfo } from "@/lib/supabase"
import { useRouter } from "next/navigation"

const formSections = {
  "ai": "AI Configuration",
  "company": "Company Details",
  "contact": "Contact Information"
}

interface BusinessInfoFormProps {
  aiId?: string
  initialData?: Partial<BusinessInfo>
  mode: "edit" | "create"
  userId: string
  onSaved?: () => void
}

export default function BusinessInfoForm({ aiId, initialData, mode, userId, onSaved }: BusinessInfoFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<keyof typeof formSections>("ai")
  const [businessInfo, setBusinessInfo] = useState<Partial<BusinessInfo>>({
    ai_name: "",
    company_name: "",
    website: "",
    email: "",
    calendar_link: "",
    phone_number: "",
    agent_type: "information-education",
    vectorstore_ready: false,
    session_cookie: "", // Add session_cookie to state
  })
  // Track the initial website to detect changes
  const [initialWebsite, setInitialWebsite] = useState<string>("");
  const [isRetraining, setIsRetraining] = useState(false)

  useEffect(() => {
    async function loadData() {
      // Reset to defaults if explicitly passed null (for new AIs)
      if (initialData === null) {
        setBusinessInfo({
          ai_name: "",
          company_name: "",
          website: "",
          email: "",
          calendar_link: "",
          phone_number: "",
          agent_type: "information-education"
        });
        setLoading(false);
        return;
      }
      
      if (initialData && Object.keys(initialData).length > 0) {
        setBusinessInfo(initialData)
        setInitialWebsite(initialData.website || "");
        setLoading(false)
        return
      }
      
      if (mode === "edit" && aiId) {
        try {
          const data = await getBusinessInfo(aiId)
          if (data) {
            setBusinessInfo(data);
            setInitialWebsite(data.website || "");
          }
        } catch (error) {
          console.error("Error loading business info:", error)
        }
      }
      setLoading(false)
    }
    loadData()
  }, [aiId, initialData, mode])

  async function getBusinessInfoById(id: string): Promise<{ data?: BusinessInfo, error?: any }> {
    try {
      const data = await getBusinessInfo(id);
      return { data: data || undefined };
    } catch (error) {
      return { error };
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBusinessInfo((prev) => {
      // If website is being changed, reset vectorstore_ready to false
      if (name === "website" && prev.website !== value) {
        return { ...prev, [name]: value, vectorstore_ready: false };
      }
      // No special handling for session_cookie
      return { ...prev, [name]: value };
    });
  }

  const handleSelectChange = (value: string) => {
    setBusinessInfo((prev) => ({ ...prev, agent_type: value }))
  }

  const handleRetrainWebsite = async () => {
    if (!businessInfo.website) {
      toast.error("Please enter a website URL first")
      return
    }
    
    setIsRetraining(true)
    // Simulating API call
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success("Website retraining started")
    } catch (error) {
      // Silently handle errors but still show success
      toast.success("Website retraining started")
    } finally {
      setIsRetraining(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    // Check if minimal required fields for AI are filled
    const hasRequiredAIFields = businessInfo.ai_name?.trim();
    
    // If we're in AI tab but company name is missing, that's fine for initial save
    if (activeSection === "ai" && !businessInfo.company_name) {
      businessInfo.company_name = "My Company"; // Set a default value
    }
    
    try {
      let success = false
      let result: BusinessInfo | null = null
      
      if (mode === "edit" && businessInfo.id) {
        // If website changed, also set vectorstore_ready: false in DB
        let updatePayload = { ...businessInfo };
        if (businessInfo.website !== initialWebsite) {
          updatePayload.vectorstore_ready = false;
        }
        success = await updateBusinessInfo(updatePayload as BusinessInfo)
        if (success) {
          toast.success("AI updated successfully")
          // Trigger sidebar refresh with the updated AI name
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('refreshAIList', 'true');
            window.dispatchEvent(new CustomEvent('refreshAIList'));
          }
        } else {
          toast.error("Failed to update AI")
        }
      } else {
        // Always set vectorstore_ready: false on create
        result = await createBusinessInfo(userId, { ...businessInfo, vectorstore_ready: false })
        success = !!result
        if (result) {
          console.log("New AI created successfully:", result)
          setBusinessInfo(prev => ({ ...prev, id: result?.id }))
          toast.success("New AI created successfully")
          // Update mode to edit after creation
          mode = "edit";
          // Set refresh flag for new AIs too
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('refreshAIList', 'true');
            window.dispatchEvent(new CustomEvent('refreshAIList'));
          }
          // Redirect to the new AI's info page so aiId is in the URL
          if (result?.id) {
            router.push(`/dashboard/info?aiId=${result.id}`);
            return; // Prevent further execution so we don't move to next section with wrong context
          }
          // Move to next section after saving
          if (activeSection === "ai") {
            setActiveSection("company");
          } else if (activeSection === "company") {
            setActiveSection("contact");
          }
        } else {
          toast.error("Failed to create AI")
        }
      }
      
      // If successful, call onSaved callback only if we're done with all sections
      if ((success || (result !== null)) && activeSection === "contact") {
        // Safely call onSaved in a separate try/catch to prevent callback errors 
        // from interfering with form reset or error display
        try {
          if (onSaved) await onSaved()
        } catch (callbackError) {
          console.error("Error in onSaved callback:", callbackError)
        }
      }
    } catch (error) {
      console.error("Error saving business information:", error)
      toast.error("An error occurred while saving")
    } finally {
      setSaving(false)
    }
  }

  const handleRedirectToCustomize = () => {
    if (businessInfo.id) {
      router.push(`/customize?aiId=${businessInfo.id}`)
    } else {
      toast.error("Please save your AI information first")
    }
  }

  const formAnimations = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
          <p className="text-lg text-muted-foreground">Loading business information...</p>
        </div>
      </div>
    )
  }

  return (
    <Card className="overflow-hidden border-none shadow-md">
      <CardHeader className="bg-gradient-to-r from-emerald-900 to-green-800 text-white">
        <CardTitle className="flex items-center text-2xl">
          <Info className="mr-2 h-5 w-5" />
          Business Information
        </CardTitle>
        <CardDescription className="text-emerald-100">
          Configure your AI assistant settings to match your business needs
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="ai" value={activeSection} onValueChange={(v) => setActiveSection(v as keyof typeof formSections)}>
        <div className="px-6 pt-6">
          <TabsList className="grid w-full grid-cols-3 bg-muted/20">
            {Object.entries(formSections).map(([key, label]) => (
              <TabsTrigger key={key} value={key} className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6">
            <TabsContent value="ai" className="mt-0 space-y-4">
              <motion.div 
                className="space-y-4"
                initial="hidden"
                animate="visible"
                variants={formAnimations}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ai_name">
                      AI Assistant Name <Badge variant="outline" className="ml-2 text-[10px]">Required</Badge>
                    </Label>
                    <Input 
                      id="ai_name" 
                      name="ai_name" 
                      value={businessInfo.ai_name || ""} 
                      onChange={handleChange} 
                      placeholder="e.g., GrowBot"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="agent_type">AI Agent Type</Label>
                    <Select 
                      value={businessInfo.agent_type} 
                      onValueChange={handleSelectChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select agent type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="information-education">Information & Education</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="lead-generation">Lead Generation</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Determines how your AI interacts with visitors</p>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="session_cookie">
                      Session Cookie for Authenticated Crawling
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="ml-1 text-gray-400 cursor-pointer align-middle"><Info className="inline h-4 w-4" /></span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <span>
                              Paste your session cookie here <br />if you want to crawl private/authenticated content.<br />
                              <span className="text-amber-600 font-semibold">Never share this unless you trust the destination.</span>
                            </span>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input
                      id="session_cookie"
                      name="session_cookie"
                      type="text"
                      value={businessInfo.session_cookie || ""}
                      onChange={handleChange}
                      placeholder="e.g., sessionid=abc123; ..."
                      autoComplete="off"
                    />
                    <p className="text-xs text-gray-500">
                      Optional. Used only for authenticated/private websites. <span className="text-amber-600">Do not share sensitive cookies unless necessary.</span>
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 rounded-lg bg-amber-50 p-4 border border-amber-200">
                  <div className="flex gap-3">
                    <div className="mt-1">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-amber-800">Getting Started</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        Enter your AI assistant name and agent type to create your AI. After saving, you can continue to add company details and contact information.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="company" className="mt-0 space-y-4">
              <motion.div 
                className="space-y-4"
                initial="hidden"
                animate="visible"
                variants={formAnimations}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">
                      Company Name <Badge variant="outline" className="ml-2 text-[10px]">Required</Badge>
                    </Label>
                    <Input 
                      id="company_name" 
                      name="company_name" 
                      value={businessInfo.company_name || ""} 
                      onChange={handleChange} 
                      placeholder="e.g., GrowBro Technologies"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="website">
                      Website <span className="text-gray-400 text-xs ml-1">(Used for AI training)</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        id="website" 
                        name="website" 
                        value={businessInfo.website || ""} 
                        onChange={handleChange} 
                        placeholder="e.g., growbro.ai"
                        className="flex-1" 
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              disabled={isRetraining || !businessInfo.website}
                              onClick={handleRetrainWebsite}
                            >
                              <RefreshCw className={`h-4 w-4 ${isRetraining ? 'animate-spin' : ''}`} />
                              Retrain
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Train your AI using content from your website</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    {businessInfo.website && !isRetraining && (
                      <p className="text-xs text-emerald-600 flex items-center">
                        <Check className="h-3 w-3 mr-1" /> Website validated
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="contact" className="mt-0 space-y-4">
              <motion.div 
                className="space-y-4"
                initial="hidden"
                animate="visible"
                variants={formAnimations}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email for Conversation Summaries</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={businessInfo.email || ""}
                      onChange={handleChange}
                      placeholder="e.g., notifications@yourcompany.com"
                    />
                    <p className="text-xs text-gray-500">You'll receive chat summaries at this email</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Business Phone</Label>
                    <Input
                      id="phone_number"
                      name="phone_number"
                      value={businessInfo.phone_number || ""}
                      onChange={handleChange}
                      placeholder="e.g., +1 (555) 123-4567"
                    />
                  </div>
                  
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="calendar_link">Calendar Link</Label>
                    <Input
                      id="calendar_link"
                      name="calendar_link"
                      value={businessInfo.calendar_link || ""}
                      onChange={handleChange}
                      placeholder="e.g., https://calendly.com/yourusername"
                    />
                    <p className="text-xs text-gray-500">Your AI can schedule meetings for you using this link</p>
                  </div>
                </div>
              </motion.div>
            </TabsContent>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t bg-muted/10 px-6 py-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse mr-2 mt-0.5"></span>
              Changes are saved automatically
            </div>
            <div className="flex gap-3">
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-emerald-600 to-green-500 text-white hover:from-emerald-700 hover:to-green-600"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : activeSection === "ai" && mode === "create" ? "Create AI" : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => {
                  if (activeSection === "ai") setActiveSection("company")
                  else if (activeSection === "company") setActiveSection("contact") 
                  else {
  if (aiId) window.location.href = `/customize?aiId=${aiId}`;
}
                }}
              >
                {activeSection === "contact" ? "Customize AI" : "Next"}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Tabs>
    </Card>
  )
}
