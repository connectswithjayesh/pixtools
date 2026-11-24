import type { Metadata } from "next"
import { Mail } from "lucide-react"
import { LegalPage } from "@/components/site/legal-page"
import { SITE } from "@/lib/site"

export const metadata: Metadata = { title: "Contact Us", alternates: { canonical: "/contact" } }

export default function ContactPage() {
  return (
    <LegalPage title="Contact Us">
      <p>We’d love to hear from you — whether it’s feedback, a feature request, a bug report or a business enquiry.</p>
      <div className="flex items-center gap-3 rounded-xl border bg-card p-5 text-foreground">
        <span className="grid size-10 place-items-center rounded-lg bg-accent text-primary"><Mail className="size-5" /></span>
        <div>
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="font-medium"><a href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
        </div>
      </div>
      <p>We usually reply within 2 working days. Please don’t email files — our tools work without sending files to anyone.</p>
    </LegalPage>
  )
}
