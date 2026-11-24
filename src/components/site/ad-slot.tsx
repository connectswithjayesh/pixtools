"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { SITE, type AdPlacement } from "@/lib/site"
import { cn } from "@/lib/utils"

declare global { interface Window { adsbygoogle?: unknown[] } }

const MIN_H: Record<AdPlacement, string> = {
  top: "min-h-[100px] md:min-h-[90px]",
  inContent: "min-h-[250px]",
  sidebar: "min-h-[250px]",
  bottom: "min-h-[100px] md:min-h-[90px]",
}

/**
 * One Google AdSense unit. Shows a labelled placeholder until a publisher ID and slot are set in src/lib/site.ts.
 * Re-mounts on every route change so each page view requests a fresh ad.
 */
export function AdSlot({ placement, className }: { placement: AdPlacement; className?: string }) {
  const pathname = usePathname()
  return <AdUnit key={`${placement}-${pathname}`} placement={placement} className={className} />
}

function AdUnit({ placement, className }: { placement: AdPlacement; className?: string }) {
  const { enabled, client, slots } = SITE.ads
  const slot = slots[placement]
  const ref = useRef<HTMLModElement>(null)
  const live = enabled && !!client && !!slot

  useEffect(() => {
    if (!live) return
    try {
      // push once per <ins> (StrictMode mounts twice in dev)
      if (ref.current && !ref.current.dataset.adsbygoogleStatus) (window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch { /* ad blocker or script not ready */ }
  }, [live])

  if (!enabled) return null
  return (
    <aside aria-label="Advertisement" className={cn("w-full", className)}>
      <p className="mb-1 text-center text-[10px] tracking-widest text-muted-foreground/70 uppercase">Advertisement</p>
      {live ? (
        <ins
          ref={ref}
          className={cn("adsbygoogle block overflow-hidden", MIN_H[placement])}
          style={{ display: "block" }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format={placement === "sidebar" ? "rectangle" : "auto"}
          data-full-width-responsive="true"
        />
      ) : (
        <div className={cn("grid place-items-center rounded-lg border border-dashed bg-muted/40 text-xs text-muted-foreground", MIN_H[placement])}>
          Ad space · {placement}
        </div>
      )}
    </aside>
  )
}
