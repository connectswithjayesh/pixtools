"use client"

import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { TOOLS } from "@/lib/tools"
import { ToolCard } from "./tool-card"

/** Home hero with a search box; while searching, results replace the sections passed as children. */
export function HomeSearch({ hero, children }: { hero: React.ReactNode; children: React.ReactNode }) {
  const [q, setQ] = useState("")
  const found = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return null
    return TOOLS.filter((t) => `${t.name} ${t.short} ${t.description} ${t.category}`.toLowerCase().includes(s))
  }, [q])

  return (
    <>
      <section className="mx-auto max-w-3xl pt-2 text-center sm:pt-6">
        {hero}
        <div className="relative mx-auto mt-8 max-w-lg">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            enterKeyHint="search"
            placeholder="Search tools… e.g. compress, merge, word count"
            aria-label="Search tools"
            className="h-12 rounded-xl pr-10 pl-11 text-base shadow-sm"
          />
          {q && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQ("")}
              className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-muted-foreground hover:bg-accent"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </section>
      <div className="mt-14">
        {found ? (
          <section aria-live="polite">
            <h2 className="mb-4 text-lg font-semibold">
              {found.length} result{found.length !== 1 && "s"} for “{q.trim()}”
            </h2>
            {found.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {found.map((t) => (
                  <ToolCard key={t.slug} tool={t} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No tool matches “{q.trim()}”. Try another word.</p>
            )}
          </section>
        ) : (
          children
        )}
      </div>
    </>
  )
}
