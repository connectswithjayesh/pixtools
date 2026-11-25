import Link from "next/link"
import { AdSlot } from "@/components/site/ad-slot"
import { ToolCard } from "@/components/site/tool-card"
import { CATEGORIES, toolHref, toolsIn, type CategoryInfo } from "@/lib/tools"
import { SITE } from "@/lib/site"

function Breadcrumb({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted-foreground">
      <Link href="/" className="hover:text-foreground">Home</Link>
      {items.map((i) => (
        <span key={i.name}> / {i.href ? <Link href={i.href} className="hover:text-foreground">{i.name}</Link> : <span className="text-foreground">{i.name}</span>}</span>
      ))}
    </nav>
  )
}

/** Category page body (/image-tools, /pdf-tools, /text-tools). Each category page.tsx owns its metadata. */
export function CategoryView({ cat }: { cat: CategoryInfo }) {
  const tools = toolsIn(cat.key)
  const Icon = cat.icon
  return (
    <div className="space-y-8">
      <div>
        <Breadcrumb items={[{ name: cat.name }]} />
        <div className="flex items-start gap-4">
          <span className="hidden size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground sm:grid"><Icon className="size-6" /></span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{cat.name}</h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">{cat.description}</p>
          </div>
        </div>
      </div>
      <AdSlot placement="top" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{tools.map((t) => <ToolCard key={t.slug} tool={t} />)}</div>
      <AdSlot placement="inContent" />
      <section>
        <h2 className="mb-4 text-xl font-semibold">Other categories</h2>
        <div className="flex flex-wrap gap-2">
          {Object.values(CATEGORIES).filter((c) => c.key !== cat.key).map((c) => (
            <Link key={c.key} href={`/${c.slug}`} className="rounded-full border bg-card px-4 py-2 text-sm font-medium hover:border-primary/40 hover:text-primary">{c.name}</Link>
          ))}
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "CollectionPage", name: cat.name, description: cat.description, url: `${SITE.url}/${cat.slug}`,
        hasPart: tools.map((t) => ({ "@type": "WebApplication", name: t.name, url: `${SITE.url}${toolHref(t.slug)}` })),
      }).replace(/</g, "\\u003c") }}
      />
    </div>
  )
}
