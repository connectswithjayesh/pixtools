import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ShieldCheck } from "lucide-react"
import { AdSlot } from "@/components/site/ad-slot"
import { ToolCard } from "@/components/site/tool-card"
import { ToolLoader } from "@/tools/loader"
import { CATEGORIES, TOOLS, categoryBySlug, toolBySlug, toolsIn, type CategoryInfo, type Tool } from "@/lib/tools"
import { SITE } from "@/lib/site"

/** One route for the three category pages (/image-tools …) and every tool page (/merge-pdf …). */
export function generateStaticParams() {
  return [...Object.values(CATEGORIES).map((c) => ({ slug: c.slug })), ...TOOLS.map((t) => ({ slug: t.slug }))]
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const cat = categoryBySlug(slug)
  if (cat) return { title: `${cat.name} – Free Online ${cat.name}`, description: cat.description, alternates: { canonical: `/${slug}` } }
  const tool = toolBySlug(slug)
  if (!tool) return {}
  const kind = CATEGORIES[tool.category].name.replace(" Tools", "")
  return {
    title: `${tool.name} – Free Online ${kind} Tool`,
    description: tool.description,
    alternates: { canonical: `/${slug}` },
    openGraph: { title: `${tool.name} – ${SITE.name}`, description: tool.description, url: `/${slug}` },
  }
}

export default async function SlugPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params
  const cat = categoryBySlug(slug)
  if (cat) return <CategoryView cat={cat} />
  const tool = toolBySlug(slug)
  if (!tool) notFound()
  return <ToolView tool={tool} />
}

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

function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
}

function CategoryView({ cat }: { cat: CategoryInfo }) {
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
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "CollectionPage", name: cat.name, description: cat.description, url: `${SITE.url}/${cat.slug}`,
        hasPart: tools.map((t) => ({ "@type": "WebApplication", name: t.name, url: `${SITE.url}/${t.slug}` })),
      }} />
    </div>
  )
}

const FAQ = (tool: Tool) => {
  const thing = tool.category === "text" ? "text" : tool.category === "pdf" ? "PDF files" : "images"
  return [
    { q: `Is ${tool.name} free?`, a: `Yes. ${tool.name} is completely free, with no sign-up, no watermarks and no daily limits.` },
    { q: `Are my ${thing} uploaded?`, a: `No. ${tool.name} runs entirely in your web browser, so your ${thing} never leave your device.` },
    { q: `Does ${tool.name} work on mobile?`, a: "Yes. It works in any modern browser on Android, iPhone, tablets and computers." },
  ]
}

function ToolView({ tool }: { tool: Tool }) {
  const cat = CATEGORIES[tool.category]
  const related = toolsIn(tool.category).filter((t) => t.slug !== tool.slug).slice(0, 4)
  const Icon = tool.icon
  const faq = FAQ(tool)
  return (
    <div className="space-y-10">
      <div>
        <Breadcrumb items={[{ name: cat.name, href: `/${cat.slug}` }, { name: tool.name }]} />
        <div className="flex items-start gap-4">
          <span className="hidden size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground sm:grid"><Icon className="size-6" /></span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{tool.name}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">{tool.description}</p>
          </div>
        </div>
      </div>

      <AdSlot placement="top" />

      <ToolLoader slug={tool.slug} />

      <AdSlot placement="inContent" />

      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <h2 className="mb-4 text-xl font-semibold">How to use {tool.name}</h2>
          <ol className="grid gap-3 sm:grid-cols-3">
            {tool.steps.map((s, i) => (
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

      <JsonLd data={[
        {
          "@context": "https://schema.org", "@type": "WebApplication", name: tool.name, description: tool.description,
          url: `${SITE.url}/${tool.slug}`, applicationCategory: "UtilitiesApplication", operatingSystem: "Any (web browser)",
          offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
        },
        {
          "@context": "https://schema.org", "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE.url}/` },
            { "@type": "ListItem", position: 2, name: cat.name, item: `${SITE.url}/${cat.slug}` },
            { "@type": "ListItem", position: 3, name: tool.name, item: `${SITE.url}/${tool.slug}` },
          ],
        },
        {
          "@context": "https://schema.org", "@type": "FAQPage",
          mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        },
      ]} />
    </div>
  )
}
