import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Infinity as InfinityIcon, ShieldCheck, Smartphone, Zap } from "lucide-react"
import { AdSlot } from "@/components/site/ad-slot"
import { HomeSearch } from "@/components/site/home-search"
import { ToolCard } from "@/components/site/tool-card"
import { CATEGORIES, TOOLS, toolBySlug, toolsIn, type Category } from "@/lib/tools"

export const metadata: Metadata = { alternates: { canonical: "/" } }

const POPULAR = ["image-to-pdf", "compress-image", "merge-pdf", "word-counter", "resize-image", "split-pdf", "case-converter", "pdf-to-image"]

const WHY = [
  { icon: ShieldCheck, title: "100% private", text: "Files and text are processed on your device. Nothing is uploaded to a server." },
  { icon: Zap, title: "Instant", text: "No upload or download wait — results appear as soon as you click." },
  { icon: Smartphone, title: "Works on mobile", text: "Every tool is built for phones as well as computers." },
  { icon: InfinityIcon, title: "Free & unlimited", text: "No sign-up, no watermarks, no daily limits." },
]

export default function HomePage() {
  const cats = Object.keys(CATEGORIES) as Category[]
  return (
    <div className="space-y-14">
      <HomeSearch
        hero={
          <>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Every image, PDF &amp; text tool <span className="text-primary">in one place</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              {TOOLS.length} free tools to compress, convert, edit, merge, count and clean — right in your browser. No sign-up, no uploads.
            </p>
          </>
        }
      >
        <div className="space-y-14">
          <section aria-labelledby="popular">
            <h2 id="popular" className="mb-4 text-xl font-semibold sm:text-2xl">
              Popular tools
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {POPULAR.map((s) => toolBySlug(s))
                .filter((t) => !!t)
                .map((t) => (
                  <ToolCard key={t.slug} tool={t} />
                ))}
            </div>
          </section>

          <AdSlot placement="top" />

          {cats.map((c, i) => {
            const cat = CATEGORIES[c]
            const Icon = cat.icon
            return (
              <div key={c} className="space-y-14">
                {i > 0 && <AdSlot placement="inContent" />}
                <section aria-labelledby={`cat-${c}`}>
                  <div className="mb-4 flex items-end justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="hidden size-10 place-items-center rounded-lg bg-accent text-primary sm:grid">
                        <Icon className="size-5" />
                      </span>
                      <div>
                        <h2 id={`cat-${c}`} className="text-xl font-semibold sm:text-2xl">
                          {cat.name}
                        </h2>
                        <p className="text-sm text-muted-foreground sm:text-base">{cat.blurb}</p>
                      </div>
                    </div>
                    <Link href={`/${cat.slug}`} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline">
                      View all <ArrowRight className="size-4" />
                    </Link>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {toolsIn(c).map((t) => (
                      <ToolCard key={t.slug} tool={t} />
                    ))}
                  </div>
                </section>
              </div>
            )
          })}
        </div>
      </HomeSearch>

      <section aria-labelledby="why" className="rounded-2xl border bg-card p-6 sm:p-10">
        <h2 id="why" className="text-center text-xl font-semibold sm:text-2xl">
          Why use PixTools?
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map((w) => (
            <div key={w.title} className="text-center">
              <span className="mx-auto grid size-11 place-items-center rounded-xl bg-accent text-primary">
                <w.icon className="size-5" />
              </span>
              <h3 className="mt-3 font-semibold">{w.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{w.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
