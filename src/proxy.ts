import { NextResponse, type NextRequest } from "next/server"
import { CATEGORIES, TOOLS } from "@/lib/tools"

/**
 * Answer unknown one-segment URLs (e.g. /no-such-tool) with a real 404 status.
 * Without this the [slug] page streams its shell first and the "not found" page would arrive with status 200.
 */
const KNOWN = new Set([
  "tools", "about", "contact", "privacy-policy", "terms", "image",
  ...Object.values(CATEGORIES).map((c) => c.slug),
  ...TOOLS.map((t) => t.slug),
])

export function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.slice(1)
  if (KNOWN.has(slug)) return NextResponse.next()
  return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 })
}

export const config = {
  // single-segment paths only, skipping Next internals and files such as /sitemap.xml or /favicon.ico
  matcher: ["/((?!_next/|.*\\.).+)"],
}
