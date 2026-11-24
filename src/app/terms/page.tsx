import type { Metadata } from "next"
import { LegalPage } from "@/components/site/legal-page"
import { SITE } from "@/lib/site"

export const metadata: Metadata = { title: "Terms of Use", alternates: { canonical: "/terms" } }

const UPDATED = "24 November 2026"

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use">
      <p>Last updated: {UPDATED}</p>
      <p>By using {SITE.url} you agree to these terms.</p>
      <h2>Use of the tools</h2>
      <ul>
        <li>The tools are provided free of charge, “as is”, without warranties of any kind.</li>
        <li>You are responsible for the files you process and for having the right to use and modify them.</li>
        <li>Keep a copy of your original files. We are not liable for any loss of data or damages arising from use of the Site.</li>
        <li>You must not use the Site for unlawful purposes or try to disrupt it.</li>
      </ul>
      <h2>Advertising</h2>
      <p>The Site shows third-party advertisements. We are not responsible for the content of advertisers’ websites.</p>
      <h2>Changes</h2>
      <p>We may change these terms or the tools at any time.</p>
      <h2>Governing law</h2>
      <p>These terms are governed by the laws of {SITE.jurisdiction}.</p>
      <h2>Contact</h2>
      <p><a href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
    </LegalPage>
  )
}
