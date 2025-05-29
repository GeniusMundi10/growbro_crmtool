"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HelpCircle, Book, Video, MessageSquare, PhoneCall } from "lucide-react"
import Header from "@/components/header"

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header title="Help Center" />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Help Center</h1>
          <p className="text-gray-600">Get the assistance you need with GrowBro AI</p>
        </div>
        
        <Tabs defaultValue="guides">
          <TabsList className="mb-6">
            <TabsTrigger value="guides">Guides</TabsTrigger>
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="contact">Contact Support</TabsTrigger>
          </TabsList>
          
          <TabsContent value="guides">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <Book className="h-6 w-6 text-green-600 mb-2" />
                  <CardTitle>Getting Started</CardTitle>
                  <CardDescription>Learn the basics of using GrowBro AI</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="text-blue-600 hover:underline cursor-pointer">Setting up your AI assistant</li>
                    <li className="text-blue-600 hover:underline cursor-pointer">Customizing your AI</li>
                    <li className="text-blue-600 hover:underline cursor-pointer">Embedding AI on your website</li>
                    <li className="text-blue-600 hover:underline cursor-pointer">Managing conversations</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <Book className="h-6 w-6 text-green-600 mb-2" />
                  <CardTitle>Advanced Features</CardTitle>
                  <CardDescription>Get more out of your AI assistant</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="text-blue-600 hover:underline cursor-pointer">Lead capture configuration</li>
                    <li className="text-blue-600 hover:underline cursor-pointer">AI training with your content</li>
                    <li className="text-blue-600 hover:underline cursor-pointer">Team collaboration</li>
                    <li className="text-blue-600 hover:underline cursor-pointer">Analytics and reporting</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="faqs">
            <Card>
              <CardHeader>
                <HelpCircle className="h-6 w-6 text-green-600 mb-2" />
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Quick answers to common questions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-1">How do I customize my AI assistant?</h3>
                    <p className="text-sm text-gray-600">You can customize your AI assistant through the dashboard by updating your business information, adding resources, and configuring lead capture settings.</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">How do I embed the AI on my website?</h3>
                    <p className="text-sm text-gray-600">Go to the "Get AI Code & Test AI" section where you can get the embed code to add to your website. Simply copy the code and paste it into your website's HTML.</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Can I train my AI with my own content?</h3>
                    <p className="text-sm text-gray-600">Yes, you can train your AI with your website content, files, and other resources through the dashboard.</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">How do I invite team members?</h3>
                    <p className="text-sm text-gray-600">Go to the Team section where you can add new team members by entering their email addresses and assigning them appropriate roles.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="videos">
            <Card>
              <CardHeader>
                <Video className="h-6 w-6 text-green-600 mb-2" />
                <CardTitle>Video Tutorials</CardTitle>
                <CardDescription>Learn visually with step-by-step guides</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-100 aspect-video rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition">
                    <div className="text-center">
                      <Video className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <h3 className="font-medium">Getting Started with GrowBro AI</h3>
                      <p className="text-sm text-gray-600">4:32</p>
                    </div>
                  </div>
                  <div className="bg-gray-100 aspect-video rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition">
                    <div className="text-center">
                      <Video className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <h3 className="font-medium">Customizing Your AI</h3>
                      <p className="text-sm text-gray-600">5:45</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="contact">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <MessageSquare className="h-6 w-6 text-green-600 mb-2" />
                  <CardTitle>Chat Support</CardTitle>
                  <CardDescription>Get help from our support team</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">Our support team is available to help you with any questions or issues.</p>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition">Start Chat</button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <PhoneCall className="h-6 w-6 text-green-600 mb-2" />
                  <CardTitle>Schedule a Call</CardTitle>
                  <CardDescription>Talk to a support specialist</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">Schedule a call with our support team to get personalized assistance.</p>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition">Book a Call</button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 