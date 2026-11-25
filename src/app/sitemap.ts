import type { MetadataRoute } from "next"
import { CATEGORIES, TOOLS, toolHref } from "@/lib/tools"
import { SITE } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (p: string) => `${SITE.url}${p}`
  return [
    { url: url("/"), changeFrequency: "weekly", priority: 1 },
    { url: url("/tools"), changeFrequency: "weekly", priority: 0.8 },
    ...Object.values(CATEGORIES).map((c) => ({ url: url(`/${c.slug}`), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...TOOLS.map((t) => ({ url: url(toolHref(t.slug)), changeFrequency: "monthly" as const, priority: 0.9 })),
    ...["/about", "/contact", "/privacy-policy", "/terms"].map((p) => ({ url: url(p), changeFrequency: "yearly" as const, priority: 0.3 })),
  ]
}
