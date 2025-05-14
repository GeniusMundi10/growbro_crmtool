import type React from "react"
import type { Metadata } from "next"
import { Inter as FontSans } from "next/font/google"
import "./globals.css"
import Sidebar from "@/components/sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"
import { cn } from "@/lib/utils"
import { UserProvider } from "@/context/UserContext"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "GrowBro.ai - AI-Powered CRM Platform",
  description: "Advanced AI-powered sales automation and customer relationship management for modern businesses",
  generator: "Next.js",
  applicationName: "GrowBro.ai",
  keywords: ["AI", "CRM", "Sales Automation", "Lead Generation", "Customer Relationship", "Chatbot"],
  authors: [{ name: "GrowBro.ai Team" }],
  creator: "GrowBro.ai",
  publisher: "GrowBro.ai",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <UserProvider>
            <div className="flex h-screen overflow-hidden bg-gray-50">
              <Sidebar />
              <main className="flex-1 overflow-auto ml-[70px] md:ml-[280px] transition-all duration-300">
                {children}
              </main>
            </div>
            <Toaster position="top-right" richColors expand closeButton />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
