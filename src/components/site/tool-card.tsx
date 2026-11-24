import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import type { Tool } from "@/lib/tools"
import { cn } from "@/lib/utils"

const TINT = {
  image: "bg-accent text-primary",
  pdf: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  text: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
} as const

export function ToolCard({ tool, className }: { tool: Tool; className?: string }) {
  const Icon = tool.icon
  return (
    <Link
      href={`/${tool.slug}`}
      className={cn(
        "group relative flex gap-3 rounded-xl border bg-card p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
    >
      <div className={cn("grid size-11 shrink-0 place-items-center rounded-lg", TINT[tool.category])}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 pr-4">
        <p className="leading-tight font-semibold">{tool.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">{tool.short}</p>
      </div>
      <ArrowUpRight className="absolute top-3 right-3 size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  )
}
