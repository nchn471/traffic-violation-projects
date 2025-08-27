import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/shared/layout/theme-provider"
import { Toaster } from "@/components/shared/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Traffic Monitor System",
  description: "Monitor and manage traffic violations with AI-powered detection",
  icons: {
    icon: "/icon.svg", 
    shortcut: "/icon.svg", 
    apple: "/icon.svg", 
  },
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          <div className="min-h-screen bg-background">
            <div className="container mx-auto px-6 py-4">{children}</div>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
