import { cn } from "@/lib/utils"

/**
 * TechSutraHub logo — "the flowing t": a lowercase t whose stem flows on like a thread, with a saffron dot.
 * The indigo tile stays the same in light and dark mode (it is the brand mark, like the favicon).
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-8 shrink-0", className)} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <rect width="64" height="64" rx="15" fill="#4338CA" />
      <path d="M27 11.5 V39 C27 47.5 31.5 52 39 52" fill="none" stroke="#FFFFFF" strokeWidth="8.6" strokeLinecap="round" />
      <path d="M15 22 H41" fill="none" stroke="#FFFFFF" strokeWidth="8.6" strokeLinecap="round" />
      <circle cx="49" cy="46.5" r="5.2" fill="#F59E0B" />
    </svg>
  )
}

/** Wordmark: "TechSutra" in ink, "Hub" in indigo (saffron in dark mode). */
export function LogoWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-heading font-bold tracking-tight", className)}>
      TechSutra<span className="text-primary dark:text-saffron">Hub</span>
    </span>
  )
}

export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={markClassName} />
      <LogoWordmark className="text-[1.0625rem]" />
    </span>
  )
}
