import Link from "next/link"
import { CATEGORIES, toolHref, toolsIn, type Category } from "@/lib/tools"
import { SITE } from "@/lib/site"

export function SiteFooter() {
  return (
    <footer className="border-t bg-card/50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-semibold">{SITE.name}</p>
          <p className="mt-2 text-sm text-muted-foreground">{SITE.tagline}. Your files and text are processed on your device and never uploaded.</p>
        </div>
        {(Object.keys(CATEGORIES) as Category[]).map((c) => (
          <div key={c}>
            <Link href={`/${CATEGORIES[c].slug}`} className="text-sm font-semibold hover:text-primary">{CATEGORIES[c].name}</Link>
            <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              {toolsIn(c).map((t) => <li key={t.slug}><Link href={toolHref(t.slug)} className="hover:text-foreground">{t.name}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-8">
        <p>© {SITE.name}. All rights reserved.</p>
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          <Link href="/about" className="hover:text-foreground">About</Link>
          <Link href="/contact" className="hover:text-foreground">Contact</Link>
          <Link href="/privacy-policy" className="hover:text-foreground">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
        </nav>
      </div>
    </footer>
  )
}
