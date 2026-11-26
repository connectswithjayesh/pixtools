import type { Metadata } from "next"
import Link from "next/link"
import { AdSlot } from "@/components/site/ad-slot"
import { ToolCard } from "@/components/site/tool-card"
import { CATEGORIES, TOOLS, toolsIn, type Category, categoryHref } from "@/lib/tools"

export const metadata: Metadata = {
  title: "All Tools – Free Image, PDF & Text Tools",
  description: `Browse all ${TOOLS.length} free online tools: image compressor and converter, PDF merge and split, word counter, case converter and more.`,
  alternates: { canonical: "/tools" },
}

export default function AllToolsPage() {
  const cats = Object.keys(CATEGORIES) as Category[]
  return (
    <div className="space-y-10">
      <div>
        <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted-foreground"><Link href="/" className="hover:text-foreground">Home</Link> / All tools</nav>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">All tools</h1>
        <p className="mt-2 text-muted-foreground">{TOOLS.length} free tools in {cats.length} categories. Everything runs in your browser.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {cats.map((c) => (
            <a key={c} href={`#${c}`} className="rounded-full border bg-card px-3 py-1.5 text-sm font-medium hover:border-primary/40 hover:text-primary">
              {CATEGORIES[c].name} <span className="text-muted-foreground">({toolsIn(c).length})</span>
            </a>
          ))}
        </div>
      </div>
      <AdSlot placement="top" />
      {cats.map((c, i) => (
        <div key={c} className="space-y-10">
          {i > 0 && <AdSlot placement="inContent" />}
          <section id={c} className="scroll-mt-20">
            <div className="mb-4 flex items-end justify-between gap-4">
              <h2 className="text-xl font-semibold sm:text-2xl">{CATEGORIES[c].name}</h2>
              <Link href={categoryHref(c)} className="text-sm font-medium text-primary hover:underline">Open category →</Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{toolsIn(c).map((t) => <ToolCard key={t.slug} tool={t} />)}</div>
          </section>
        </div>
      ))}
    </div>
  )
}
