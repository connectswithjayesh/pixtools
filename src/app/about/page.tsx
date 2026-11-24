import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage } from "@/components/site/legal-page"
import { SITE } from "@/lib/site"
import { TOOLS } from "@/lib/tools"

export const metadata: Metadata = { title: "About Us", alternates: { canonical: "/about" } }

export default function AboutPage() {
  return (
    <LegalPage title="About Us">
      <p><strong>{SITE.name}</strong> offers {TOOLS.length} free online tools for everyday image, PDF and text tasks — compressing photos, resizing for social media, merging and splitting PDFs, counting words, converting case, cleaning text and more.</p>
      <h2>Private by design</h2>
      <p>Unlike most online converters, {SITE.name} never uploads your files. Every tool runs entirely inside your web browser, so your photos, documents and text stay on your own device.</p>
      <h2>Free for everyone</h2>
      <p>All tools are free with no sign-up and no watermarks added to your files. The site is supported by advertising, which lets us keep improving the tools and adding new ones.</p>
      <h2>Get in touch</h2>
      <p>Have a suggestion or found a problem? Visit our <Link href="/contact">contact page</Link>.</p>
    </LegalPage>
  )
}
