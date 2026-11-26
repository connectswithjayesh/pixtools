"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { LayoutGrid, Menu, Moon, Sun, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CATEGORIES, toolHref, toolsIn, type Category, categoryHref } from "@/lib/tools"
import { SITE } from "@/lib/site"
import { Logo } from "@/components/site/logo"
import { cn } from "@/lib/utils"

const CATS = Object.keys(CATEGORIES) as Category[]

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  // close the menu after navigating (adjust state during render instead of in an effect)
  const [menuPath, setMenuPath] = useState(pathname)
  if (menuPath !== pathname) {
    setMenuPath(pathname)
    setOpen(false)
  }
  // no page scroll behind the open mobile menu
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  const active = (href: string) => pathname === href
  // a category tab stays highlighted on its tool pages (/tools/image/…)
  const inSection = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const nav = (href: string, section = false) =>
    cn(
      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
      (section ? inSection(href) : active(href)) ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
    )

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <Link href="/" aria-label={`${SITE.name} home`} className="flex items-center">
            <Logo />
          </Link>
          <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Tool categories">
            {CATS.map((c) => (
              <Link key={c} href={categoryHref(c)} className={nav(categoryHref(c), true)}>
                {CATEGORIES[c].name}
              </Link>
            ))}
            <Link href="/tools" className={nav("/tools")}>
              All tools
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label="Toggle dark mode"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              <Sun className="hidden dark:block" />
              <Moon className="dark:hidden" />
            </Button>
            <Button
              variant="ghost"
              size="icon-lg"
              className="md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-x-0 top-14 bottom-0 z-40 overflow-y-auto overscroll-contain border-t bg-background p-4 md:hidden">
          <Link href="/tools" className="mb-4 flex items-center gap-2 rounded-lg border bg-card px-3 py-3 font-medium">
            <LayoutGrid className="size-4 text-primary" /> All tools
          </Link>
          {CATS.map((c) => (
            <div key={c} className="mb-5">
              <Link href={categoryHref(c)} className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {CATEGORIES[c].name}
              </Link>
              <div className="mt-2 grid grid-cols-2 gap-1">
                {toolsIn(c).map((t) => (
                  <Link
                    key={t.slug}
                    href={toolHref(t.slug)}
                    className={cn(
                      "flex min-h-11 items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent",
                      active(toolHref(t.slug)) && "bg-accent",
                    )}
                  >
                    <t.icon className="size-4 shrink-0 text-primary" /> <span className="truncate">{t.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
