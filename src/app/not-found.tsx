import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { ToolCard } from "@/components/site/tool-card"
import { toolBySlug } from "@/lib/tools"

export default function NotFound() {
  const picks = ["image-to-pdf", "compress-image", "merge-pdf", "word-counter"].map((s) => toolBySlug(s)).filter((t) => !!t)
  return (
    <div className="mx-auto max-w-3xl py-10 text-center">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Page not found</h1>
      <p className="mt-2 text-muted-foreground">The page you’re looking for doesn’t exist or has moved.</p>
      <div className="mt-6 flex justify-center gap-2">
        <Link href="/" className={buttonVariants({ size: "lg" })}>Go home</Link>
        <Link href="/tools" className={buttonVariants({ size: "lg", variant: "outline" })}>All tools</Link>
      </div>
      <div className="mt-10 grid gap-3 text-left sm:grid-cols-2">{picks.map((t) => <ToolCard key={t.slug} tool={t} />)}</div>
    </div>
  )
}
