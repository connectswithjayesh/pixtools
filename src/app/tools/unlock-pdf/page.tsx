import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import UnlockPdf from "./UnlockPdf"

export const metadata: Metadata = {
  title: "Unlock PDF – Remove PDF Password Online",
  description: "Remove the password and printing/copying restrictions from a PDF you own.",
  alternates: { canonical: "/tools/unlock-pdf" },
  openGraph: {
    title: "Unlock PDF – Remove PDF Password Online",
    description: "Remove the password and printing/copying restrictions from a PDF you own.",
    url: "/tools/unlock-pdf",
  },
}

const steps = [
    "Add the protected PDF",
    "Enter its password",
    "Download the unlocked PDF"
  ]

const intro = [
    "Unlock PDF removes the password and the printing or copying restrictions from a PDF you are allowed to open. Enter the password once and download a copy that opens without it.",
    "Decryption happens in your browser, so the file and its password stay on your device."
  ]

const features = [
    "Removes the open password",
    "Removes print, copy and edit restrictions",
    "Detects whether a PDF is locked",
    "Works with AES and older RC4 encryption",
    "Keeps the original quality"
  ]

const uses = [
    "Stop typing the password for your own bank statements",
    "Print a document that had printing blocked",
    "Merge or edit a protected PDF",
    "Archive documents without passwords"
  ]

const faq: Faq[] = [
    {
      "q": "How do I remove a password from a PDF?",
      "a": "Open the PDF, type its password and download the unlocked copy."
    },
    {
      "q": "Can I unlock a PDF without the password?",
      "a": "No. You need the password to open the file. This tool is for PDFs you own or are allowed to use."
    },
    {
      "q": "Is the password uploaded?",
      "a": "No. The file is decrypted in your browser."
    },
    {
      "q": "Does unlocking change the content?",
      "a": "No. Pages, text and images stay exactly the same."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="unlock-pdf"
      title="Unlock PDF"
      lead="Remove the password and printing/copying restrictions from a PDF you own."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <UnlockPdf />
    </ToolPageLayout>
  )
}
