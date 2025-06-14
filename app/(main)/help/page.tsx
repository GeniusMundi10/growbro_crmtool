"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HelpCircle, Book, Video, MessageSquare, PhoneCall } from "lucide-react"
import Header from "@/components/header"
import React from 'react';

// GuideItem component
function GuideItem({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <li className="border rounded-md p-3 bg-gray-50 hover:bg-gray-100 transition">
      <button
        className="flex items-center justify-between w-full text-left font-medium text-blue-700 focus:outline-none"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <svg
          className={`w-4 h-4 ml-2 transform transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </li>
  );
}

// FaqItem component
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border rounded-md p-3 bg-gray-50 hover:bg-gray-100 transition">
      <button
        className="flex items-center justify-between w-full text-left font-medium text-green-700 focus:outline-none"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{question}</span>
        <svg
          className={`w-4 h-4 ml-2 transform transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {open && <div className="mt-2 text-gray-700 text-sm">{answer}</div>}
    </div>
  );
}

// FAQ data
const faqData = [
  {
    q: "How do I customize my AI assistant?",
    a: "You can customize your AI assistant through the dashboard by updating your business information, adding resources, and configuring lead capture settings.",
  },
  {
    q: "How do I embed the AI on my website?",
    a: 'Go to the "Get AI Code & Test AI" section where you can get the embed code to add to your website. Simply copy the code and paste it into your website\'s HTML.',
  },
  {
    q: "Can I train my AI with my own content?",
    a: "Yes, you can train your AI with your website content, files, and other resources through the dashboard.",
  },
  {
    q: "How do I invite team members?",
    a: "Go to the Team section where you can add new team members by entering their email addresses and assigning them appropriate roles.",
  },
  {
    q: "Can I integrate GrowBro AI with my CRM?",
    a: "Yes, GrowBro AI offers integration options with popular CRMs. Check the Integrations section in your dashboard for setup instructions.",
  },
  {
    q: "What if I need more help?",
    a: "You can reach out to our support team via the Contact Support tab for chat or a scheduled call.",
  },
  {
    q: "How do I reset my password?",
    a: "Go to Account Settings and click on 'Change Password'. Follow the instructions sent to your email.",
  },
];

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
                    <GuideItem title="Setting up your AI assistant">
                      <ol className="list-decimal ml-5 mt-2 text-gray-700">
                        <li>Go to Dashboard &rarr; Create New AI.</li>
                        <li>Fill in your business details and preferences.</li>
                        <li>Click "Save" to initialize your AI assistant.</li>
                      </ol>
                    </GuideItem>
                    <GuideItem title="Customizing your AI">
                      <ol className="list-decimal ml-5 mt-2 text-gray-700">
                        <li>Navigate to the AI settings page.</li>
                        <li>Update branding, greeting, and lead capture forms.</li>
                        <li>Preview changes in real-time.</li>
                      </ol>
                    </GuideItem>
                    <GuideItem title="Embedding AI on your website">
                      <ol className="list-decimal ml-5 mt-2 text-gray-700">
                        <li>Go to "Get AI Code & Test AI" in the dashboard.</li>
                        <li>Copy the provided embed code.</li>
                        <li>Paste it into your website’s HTML.</li>
                      </ol>
                    </GuideItem>
                    <GuideItem title="Managing conversations">
                      <ol className="list-decimal ml-5 mt-2 text-gray-700">
                        <li>View chat history in the dashboard.</li>
                        <li>Respond to leads directly or assign to team members.</li>
                        <li>Export conversations for records or analysis.</li>
                      </ol>
                    </GuideItem>
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
                    <GuideItem title="Lead capture configuration">
                      <ol className="list-decimal ml-5 mt-2 text-gray-700">
                        <li>Customize the lead capture form in AI settings.</li>
                        <li>Choose which fields are required (name, email, etc.).</li>
                        <li>Enable notifications for new leads.</li>
                      </ol>
                    </GuideItem>
                    <GuideItem title="AI training with your content">
                      <ol className="list-decimal ml-5 mt-2 text-gray-700">
                        <li>Upload documents or provide website URLs in Resources.</li>
                        <li>Let the AI process and learn from your materials.</li>
                        <li>Test responses using the chat preview.</li>
                      </ol>
                    </GuideItem>
                    <GuideItem title="Team collaboration">
                      <ol className="list-decimal ml-5 mt-2 text-gray-700">
                        <li>Invite team members from the Team section.</li>
                        <li>Assign roles and permissions for each member.</li>
                        <li>Monitor team activity and contributions.</li>
                      </ol>
                    </GuideItem>
                    <GuideItem title="Analytics and reporting">
                      <ol className="list-decimal ml-5 mt-2 text-gray-700">
                        <li>Access analytics in the dashboard sidebar.</li>
                        <li>Track engagement, lead quality, and conversion rates.</li>
                        <li>Export reports for further analysis.</li>
                      </ol>
                    </GuideItem>
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
                <div className="space-y-2">
                  {faqData.map((faq, idx) => (
                    <FaqItem key={idx} question={faq.q} answer={faq.a} />
                  ))}
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