import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "FlashAI - AI Flashcard Generator",
  description:
    "Turn your notes into study cards instantly with AI. Generate interactive flashcards from any text and improve your learning efficiency.",
  keywords: ["flashcards", "AI", "study", "learning", "education", "notes", "memorization"],
  authors: [{ name: "FlashAI" }],
  creator: "FlashAI",
  publisher: "FlashAI",
  openGraph: {
    title: "FlashAI - AI Flashcard Generator",
    description: "Turn your notes into study cards instantly with AI",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "FlashAI - AI Flashcard Generator",
    description: "Turn your notes into study cards instantly with AI",
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: "width=device-width, initial-scale=1",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
