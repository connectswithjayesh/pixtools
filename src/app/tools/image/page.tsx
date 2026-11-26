import type { Metadata } from "next"
import { CategoryView } from "@/components/site/category-view"
import { CATEGORIES } from "@/lib/tools"

export const metadata: Metadata = {
  title: "Image Tools \u2013 Compress, Resize & Convert Images Free",
  description: "Free online image tools: compress JPG and PNG, resize for social media, convert to WEBP or AVIF, crop, rotate, add watermarks and more — right in your browser.",
  alternates: { canonical: "/tools/image" },
}

export default function Page() {
  return <CategoryView cat={CATEGORIES.image} />
}
