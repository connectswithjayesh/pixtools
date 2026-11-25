import Link from "next/link"
import { CheckCircle2, ShieldCheck } from "lucide-react"
import { AdSlot } from "@/components/site/ad-slot"
import { ToolCard } from "@/components/site/tool-card"
import { CATEGORIES, toolBySlug, toolsIn } from "@/lib/tools"
import { SITE } from "@/lib/site"

export interface Faq { q: string; a: string }

/**
 * Page frame shared by every tool page. Each tool's own page.tsx (src/app/tools/<slug>/page.tsx)
 * owns its metadata and content and passes it in; the tool itself is the children.
 */
export function ToolPageLayout({ slug, title, lead, steps, intro, features, uses, faq, children }: {
  slug: string
  /** H1 */
  title: string
  /** one line under the H1 */
  lead: string
  steps: string[]
  intro: string[]
  features: string[]
  uses: string[]
  faq: Faq[]
  children: React.ReactNode
}) {
  const tool = toolBySlug(slug)
  if (!tool) throw new Error(`Unknown tool slug: ${slug}`)
  const cat = CATEGORIES[tool.category]
  const related = toolsIn(tool.category).filter((t) => t.slug !== slug).slice(0, 4)
  const Icon = tool.icon
  const url = `${SITE.url}/tools/${slug}`

  return (
    <div className="space-y-10">
      <div>
        <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          {" / "}<Link href={`/${cat.slug}`} className="hover:text-foreground">{cat.name}</Link>
          {" / "}<span className="text-foreground">{title}</span>
        </nav>
        <div className="flex items-start gap-4">
          <span className="hidden size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground sm:grid"><Icon className="size-6" /></span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">{lead}</p>
          </div>
        </div>
      </div>

      <AdSlot placement="top" />

      {children}

      <AdSlot placement="inContent" />

      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <h2 className="mb-4 text-xl font-semibold">How to use {tool.name}</h2>
          <ol className="grid gap-3 sm:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s} className="rounded-xl border bg-card p-4">
                <span className="grid size-7 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{i + 1}</span>
                <p className="mt-3 text-sm font-medium">{s}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-5 text-primary" /> Private by design</p>
          <p className="mt-2 text-sm text-muted-foreground">Everything happens inside your browser. Your files and text are never uploaded to any server, so they stay completely private.</p>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">About {tool.name}</h2>
          {intro.map((p) => <p key={p} className="leading-relaxed text-muted-foreground">{p}</p>)}
          <h3 className="pt-2 text-lg font-semibold">Features</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {features.map((f) => (
              <li key={f} className="flex gap-2 text-sm"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />{f}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border bg-card p-5 lg:self-start">
          <h3 className="font-semibold">Popular uses</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {uses.map((u) => <li key={u} className="flex gap-2"><span className="text-primary">•</span>{u}</li>)}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Frequently asked questions</h2>
        <div className="divide-y rounded-xl border bg-card">
          {faq.map((f) => (
            <details key={f.q} className="group p-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {f.q}<span className="text-muted-foreground transition-transform group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">More {cat.name}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{related.map((t) => <ToolCard key={t.slug} tool={t} />)}</div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org", "@type": "WebApplication", name: tool.name, description: lead, url,
              applicationCategory: "UtilitiesApplication", operatingSystem: "Any (web browser)",
              offers: { "@type": "Offer", price: "0", priceCurrency: "INR" }, featureList: features,
            },
            {
              "@context": "https://schema.org", "@type": "HowTo", name: `How to use ${tool.name}`,
              step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s })),
            },
            {
              "@context": "https://schema.org", "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: `${SITE.url}/` },
                { "@type": "ListItem", position: 2, name: cat.name, item: `${SITE.url}/${cat.slug}` },
                { "@type": "ListItem", position: 3, name: tool.name, item: url },
              ],
            },
            {
              "@context": "https://schema.org", "@type": "FAQPage",
              mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
            },
          ]).replace(/</g, "\\u003c"),
        }}
      />
    </div>
  )
}
