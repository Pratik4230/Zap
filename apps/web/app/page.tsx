import { JsonLd } from "@/components/landing/json-ld"
import { LandingPage } from "@/components/landing/landing-page"
import { homeMetadata } from "@/lib/site"

export const metadata = homeMetadata
export const dynamic = "force-static"
export const revalidate = false

export default function HomePage() {
  return (
    <>
      <JsonLd />
      <LandingPage />
    </>
  )
}
