"use client"

import { useState } from "react"
import { Check, Copy, Link2 } from "lucide-react"
import { AMBER, AMBER_BORDER, AMBER_DIM } from "@/lib/landing"
import { siteConfig } from "@/lib/site"

export function DemoLink() {
  const [copied, setCopied] = useState(false)
  const url = `${siteConfig.shortLinkDomain}/launch`

  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm"
      style={{ background: "oklch(0.12 0 0)", borderColor: AMBER_BORDER }}
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
        style={{ background: AMBER_DIM }}
      >
        <Link2 size={13} style={{ color: AMBER }} />
      </div>
      <span className="flex-1 font-medium text-foreground">{url}</span>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(`https://${url}`)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors"
        style={{ background: copied ? AMBER_DIM : "transparent" }}
      >
        {copied ? (
          <Check size={13} style={{ color: AMBER }} />
        ) : (
          <Copy size={13} className="text-muted-foreground" />
        )}
      </button>
    </div>
  )
}
