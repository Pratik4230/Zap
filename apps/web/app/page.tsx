import { JsonLd } from "@/components/landing/json-ld"
import { LandingPage } from "@/components/landing/landing-page"
import { siteMetadata } from "@/lib/site"

export const metadata = siteMetadata
export const dynamic = "force-static"

export default function HomePage() {
  return (
    <>
      <JsonLd />
      <LandingPage />
    </>
  )
}
