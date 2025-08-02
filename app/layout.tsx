import type React from "react"
import type { Metadata } from "next"
import { Inter as FontSans } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

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
  icons: {
    icon: "/icon.ico",
    shortcut: "/icon.ico",
    apple: "/icon.ico",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

import { NotificationProvider } from "@/context/NotificationContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={fontSans.variable}>
        <NotificationProvider>
          <ThemeProvider
            attribute="class"
            forcedTheme="light"  /* always use light mode */
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}
