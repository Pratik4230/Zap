import { Geist_Mono, Inter } from "next/font/google"
import type { Metadata } from "next"

import "./globals.css"
import { Providers } from "@/components/providers"
import { cn } from "@/lib/utils";
import { siteMetadata } from "@/lib/site";

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = siteMetadata

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn("dark antialiased", fontMono.variable, "font-sans", inter.variable)}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
