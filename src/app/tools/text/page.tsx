import type { Metadata } from "next"
import { CategoryView } from "@/components/site/category-view"
import { CATEGORIES } from "@/lib/tools"

export const metadata: Metadata = {
  title: "Text Tools \u2013 Word Counter, Case Converter & More",
  description: "Free online text tools: word and character counter, case converter, remove duplicate lines, sort lines, find and replace, text cleaner, keyword density and more. Works with Marathi and Hindi.",
  alternates: { canonical: "/tools/text" },
}

export default function Page() {
  return <CategoryView cat={CATEGORIES.text} />
}
