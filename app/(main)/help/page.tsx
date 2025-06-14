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
      {open && (
  <div
    className="mt-2 text-gray-700 text-sm"
    dangerouslySetInnerHTML={{ __html: answer }}
  />
)}
    </div>
  );
}

// FAQ data
const faqData = [
  {
    q: "How do I customize my AI assistant?",
    a: `Customizing your AI assistant is easy and flexible:
<ul class='list-disc ml-6 mt-1'>
  <li>Go to the Dashboard and select your AI.</li>
  <li>Update your business information, logo, and color theme for a branded experience.</li>
  <li>Configure the AI's greeting, tone, and lead capture questions to match your customer journey.</li>
  <li>Add resource links, FAQs, and knowledge base articles to improve AI accuracy.</li>
  <li>Use the Live Preview to test changes instantly.</li>
</ul>
<b>Tip:</b> Save your changes and test the AI on your website to ensure the updates look and work as expected.`
  },
  {
    q: "How do I embed the AI on my website?",
    a: `To embed your AI assistant:
<ul class='list-disc ml-6 mt-1'>
  <li>Go to the "Get AI Code & Test AI" section in your dashboard.</li>
  <li>Choose the widget style and copy the provided code snippet.</li>
  <li>Paste the code before the <code>&lt;/body&gt;</code> tag on your site.</li>
  <li>For React/SPA sites, use the provided integration instructions for dynamic routing.</li>
  <li>Test the widget using the "Test AI" button and ensure it loads on all desired pages.</li>
</ul>
<b>Troubleshooting:</b> If the widget doesn't appear, clear your cache and check for JavaScript errors in the browser console.`
  },
  {
    q: "Can I train my AI with my own content?",
    a: `Absolutely! You can train your AI with:
<ul class='list-disc ml-6 mt-1'>
  <li>Website URLs (crawl your site for up-to-date info)</li>
  <li>PDFs, DOCX, and TXT files (upload in the Resources section)</li>
  <li>FAQs and support documents</li>
</ul>
After uploading, the AI will process and learn from your materials. Use the chat preview to test if the AI is referencing your content correctly.`
  },
  {
    q: "How do I invite team members?",
    a: `Invite your team for collaborative support:
<ul class='list-disc ml-6 mt-1'>
  <li>Go to the Team section in your dashboard.</li>
  <li>Click "Invite Member" and enter their email address.</li>
  <li>Assign a role (Admin, Support, Sales, etc.) and set permissions.</li>
  <li>Invited members will receive an email with setup instructions.</li>
</ul>
<b>Tip:</b> Regularly review your team list and permissions for security.`
  },
  {
    q: "Can I integrate GrowBro AI with my CRM?",
    a: `Yes, GrowBro AI integrates with popular CRMs:
<ul class='list-disc ml-6 mt-1'>
  <li>Go to the Integrations section in your dashboard.</li>
  <li>Select your CRM (e.g., HubSpot, Salesforce, Zoho, etc.).</li>
  <li>Follow the step-by-step instructions to connect your account.</li>
  <li>Map lead fields to ensure all relevant data is synced.</li>
</ul>
<b>Note:</b> If your CRM is not listed, contact support for custom integration options.`
  },
  {
    q: "What if I need more help?",
    a: `We're here for you!
<ul class='list-disc ml-6 mt-1'>
  <li>Use the Contact Support tab to start a chat or schedule a call.</li>
  <li>Browse our Help Center for detailed guides and troubleshooting tips.</li>
  <li>Email us at support@growbro.ai for advanced issues.</li>
</ul>
<b>Pro Tip:</b> Chat support is fastest for urgent questions!`
  },
  {
    q: "How do I reset my password?",
    a: `To reset your password:
<ul class='list-disc ml-6 mt-1'>
  <li>Go to Account Settings in your dashboard.</li>
  <li>Click "Change Password" and enter your new password.</li>
  <li>Follow the instructions sent to your email to confirm the change.</li>
</ul>
<b>Troubleshooting:</b> Didn't get the email? Check your spam folder or contact support for assistance.`
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
    <li>Go to <b>Dashboard &rarr; Create New AI</b>.</li>
    <li>Fill in your business details and preferences:
      <ul className="list-disc ml-6 mt-1">
        <li>Business Name, Industry, and Description</li>
        <li>Target Audience and Primary Use Case</li>
        <li>Preferred AI Tone and Personality</li>
      </ul>
    </li>
    <li>Upload your logo and select your brand colors for a personalized experience.</li>
    <li>Set up your default greeting and lead capture fields (name, email, phone, etc.).</li>
    <li>Click <b>"Save"</b> to initialize your AI assistant. You will see a live preview in the dashboard.</li>
    <li><b>Tip:</b> You can always revisit these settings to fine-tune your assistant as your business evolves.</li>
  </ol>
</GuideItem>
                    <GuideItem title="Customizing your AI">
  <ol className="list-decimal ml-5 mt-2 text-gray-700">
    <li>Navigate to the <b>AI Settings</b> page from your dashboard sidebar.</li>
    <li>Update your branding:
      <ul className="list-disc ml-6 mt-1">
        <li>Upload a new logo or change your color theme.</li>
        <li>Adjust the chat widget position and welcome message.</li>
      </ul>
    </li>
    <li>Personalize the greeting and lead capture forms:
      <ul className="list-disc ml-6 mt-1">
        <li>Add custom fields (e.g., company name, budget, etc.)</li>
        <li>Set required/optional fields for better lead qualification.</li>
      </ul>
    </li>
    <li>Preview all changes in real-time using the <b>Live Preview</b> panel.</li>
    <li><b>Best Practice:</b> Use a friendly and concise greeting to increase engagement rates.</li>
  </ol>
</GuideItem>
                    <GuideItem title="Embedding AI on your website">
  <ol className="list-decimal ml-5 mt-2 text-gray-700">
    <li>Go to the <b>"Get AI Code & Test AI"</b> section in your dashboard.</li>
    <li>Choose your preferred widget style (bubble, sidebar, inline, etc.).</li>
    <li>Copy the provided embed code snippet.</li>
    <li>Paste the code right before the <code>&lt;/body&gt;</code> tag on every page where you want the AI to appear.</li>
    <li>For single-page apps, ensure the code runs after page navigation events.</li>
    <li>Test the widget on your site using the <b>Test AI</b> button to ensure it loads and responds as expected.</li>
    <li><b>Advanced:</b> Use the <b>API Integration</b> tab for custom triggers or advanced embedding (see developer docs).</li>
  </ol>
</GuideItem>
                    <GuideItem title="Managing conversations">
  <ol className="list-decimal ml-5 mt-2 text-gray-700">
    <li>Go to the <b>Conversations</b> tab in your dashboard.</li>
    <li>View all past and ongoing chats, sorted by date or lead status.</li>
    <li>Click any conversation to see full details, including:
      <ul className="list-disc ml-6 mt-1">
        <li>User info, chat transcript, and AI responses</li>
        <li>Lead qualification data and notes</li>
      </ul>
    </li>
    <li>Respond to leads directly in the dashboard or assign chats to team members for follow-up.</li>
    <li>Use the <b>Export</b> function to download chat records as CSV or PDF for compliance or analysis.</li>
    <li><b>Tip:</b> Use tags or filters to quickly find conversations by topic, urgency, or team member.</li>
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
    <li>Open <b>AI Settings &rarr; Lead Capture</b> in your dashboard.</li>
    <li>Customize the form:
      <ul className="list-disc ml-6 mt-1">
        <li>Add or remove fields as needed (e.g., phone, company, budget, etc.)</li>
        <li>Set validation rules and placeholders for each field</li>
      </ul>
    </li>
    <li>Choose which fields are required to submit the form.</li>
    <li>Enable notifications for new leads via email, SMS, or dashboard alerts.</li>
    <li>Test the lead capture form using the <b>Test AI</b> widget to ensure all data is collected correctly.</li>
    <li><b>Pro Tip:</b> Keep your lead form short for higher conversion rates, but collect enough info for effective follow-up.</li>
  </ol>
</GuideItem>
                    <GuideItem title="AI training with your content">
  <ol className="list-decimal ml-5 mt-2 text-gray-700">
    <li>Go to <b>Resources</b> in your dashboard.</li>
    <li>Upload documents (PDF, DOCX, TXT) or provide website URLs for the AI to learn from.</li>
    <li>Tag and categorize your resources for better context (e.g., pricing, support, product info).</li>
    <li>Let the AI process and learn from your materials. Progress is shown in the dashboard.</li>
    <li>Test responses using the <b>Chat Preview</b> to verify the AI is using your content accurately.</li>
    <li><b>Troubleshooting:</b> If the AI misses info, check file formats and re-upload or contact support.</li>
  </ol>
</GuideItem>
                    <GuideItem title="Team collaboration">
  <ol className="list-decimal ml-5 mt-2 text-gray-700">
    <li>Go to <b>Team</b> in your dashboard.</li>
    <li>Invite new team members by entering their email addresses.</li>
    <li>Assign roles (Admin, Support, Sales, etc.) and set permissions for each member.</li>
    <li>Monitor team activity:
      <ul className="list-disc ml-6 mt-1">
        <li>See who responded to which leads</li>
        <li>Track performance and response times</li>
      </ul>
    </li>
    <li>Remove or update team members as your organization grows.</li>
    <li><b>Best Practice:</b> Regularly review permissions to keep your data secure.</li>
  </ol>
</GuideItem>
                    <GuideItem title="Analytics and reporting">
  <ol className="list-decimal ml-5 mt-2 text-gray-700">
    <li>Access <b>Analytics</b> from the dashboard sidebar.</li>
    <li>Track key metrics:
      <ul className="list-disc ml-6 mt-1">
        <li>User engagement (visits, chats started, questions asked)</li>
        <li>Lead quality (qualified leads, conversion rates)</li>
        <li>Response time and satisfaction scores</li>
      </ul>
    </li>
    <li>Export detailed reports as CSV, PDF, or connect to Google Sheets.</li>
    <li>Use filters and date ranges to analyze trends over time.</li>
    <li><b>Tip:</b> Schedule automated reports to your inbox for regular updates.</li>
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