import type { Metadata } from "next"
import { CategoryView } from "@/components/site/category-view"
import { CATEGORIES } from "@/lib/tools"

export const metadata: Metadata = {
  title: "PDF Tools \u2013 Merge, Split, Compress & Edit PDF Free",
  description: "Free online PDF tools: merge and split PDFs, reorder pages, convert PDF to images, add page numbers and watermarks, sign, compress and password-protect — without uploading your files.",
  alternates: { canonical: "/pdf-tools" },
}

export default function Page() {
  return <CategoryView cat={CATEGORIES.pdf} />
}
