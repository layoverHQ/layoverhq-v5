import type React from "react"
import type { Metadata } from "next"
import { Space_Grotesk, DM_Sans } from "next/font/google"
import "./globals.css"
import { SiteFooter } from "@/components/site-footer"
import ErrorBoundary from "@/components/error-boundary"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
})

export const metadata: Metadata = {
  title: "LayoverHQ - Transform Your Layovers Into Adventures",
  description:
    "Discover amazing layover experiences, city tours, and flight connections. Turn your travel time into exploration time with LayoverHQ's premium layover services.",
  keywords: "layover, flight connections, city tours, travel, airport experiences, flight booking",
  authors: [{ name: "LayoverHQ Team" }],
  creator: "LayoverHQ",
  publisher: "LayoverHQ",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://layoverhq.com"),
  openGraph: {
    title: "LayoverHQ - Transform Your Layovers Into Adventures",
    description:
      "Discover amazing layover experiences and city tours. Turn your travel time into exploration time.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "LayoverHQ - Transform Your Layovers Into Adventures",
    description: "Discover amazing layover experiences and city tours.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#662046" />
        <meta name="color-scheme" content="light dark" />
        <link rel="icon" href="/favicon.svg" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
          :root {
            --font-sans: ${dmSans.style.fontFamily}, system-ui, -apple-system, sans-serif;
            --font-serif: ${spaceGrotesk.style.fontFamily}, Georgia, serif;
            --font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
          }
          
          html {
            font-family: var(--font-sans);
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          * {
            box-sizing: border-box;
          }
          
          body {
            margin: 0;
            padding: 0;
            min-height: 100vh;
            background-color: hsl(var(--background));
            color: hsl(var(--foreground));
          }
        `,
          }}
        />
      </head>
      <body
        className={`${dmSans.variable} ${spaceGrotesk.variable} antialiased min-h-screen bg-background text-foreground flex flex-col`}
      >
        <ErrorBoundary showErrorDetails={process.env.NODE_ENV === "development"}>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
