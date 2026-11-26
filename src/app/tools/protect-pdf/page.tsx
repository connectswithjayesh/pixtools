import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import ProtectPdf from "./ProtectPdf"

export const metadata: Metadata = {
  title: "Protect PDF – Add Password to PDF (AES-256)",
  description: "Encrypt a PDF with AES-256 password protection and control printing, copying and editing permissions.",
  alternates: { canonical: "/tools/protect-pdf" },
  openGraph: {
    title: "Protect PDF – Add Password to PDF (AES-256)",
    description: "Encrypt a PDF with AES-256 password protection and control printing, copying and editing permissions.",
    url: "/tools/protect-pdf",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "TechSutraHub" }],
  },
}

const steps = [
    "Add a PDF",
    "Set a password and permissions",
    "Download the protected PDF"
  ]

const intro = [
    "Protect PDF adds a password to a PDF so only people with the password can open it. It uses strong AES-256 encryption, the same standard used by Adobe Acrobat.",
    "You can also block printing, copying or editing. Encryption runs in your browser, so the file and the password are never sent anywhere."
  ]

const features = [
    "AES-256 or AES-128 encryption",
    "Open password with confirmation",
    "Allow or block printing, copying and editing",
    "Optional separate owner password",
    "Works with any PDF"
  ]

const uses = [
    "Send salary slips and bank statements securely",
    "Protect medical or legal documents",
    "Share confidential business files",
    "Lock a PDF before uploading it to cloud storage"
  ]

const faq: Faq[] = [
    {
      "q": "How do I put a password on a PDF?",
      "a": "Open the PDF, type a password twice, choose the permissions and press Protect PDF."
    },
    {
      "q": "What if I forget the password?",
      "a": "AES-256 cannot be broken in practice, so a forgotten password cannot be recovered. Keep the original file or note the password safely."
    },
    {
      "q": "Is the password sent to a server?",
      "a": "No. The PDF is encrypted in your browser."
    },
    {
      "q": "Will the PDF open on all devices?",
      "a": "Yes. Any modern PDF reader asks for the password and opens the file."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="protect-pdf"
      title="Protect PDF"
      lead="Encrypt a PDF with AES-256 password protection and control printing, copying and editing permissions."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <ProtectPdf />
    </ToolPageLayout>
  )
}
