import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import MergePdf from "./MergePdf"

export const metadata: Metadata = {
  title: "Merge PDF – Combine PDF Files into One Free",
  description: "Combine multiple PDF files into one. Drag to set the order before merging.",
  alternates: { canonical: "/tools/merge-pdf" },
  openGraph: {
    title: "Merge PDF – Combine PDF Files into One Free",
    description: "Combine multiple PDF files into one. Drag to set the order before merging.",
    url: "/tools/merge-pdf",
  },
}

const steps = [
    "Add two or more PDFs",
    "Drag to set the order",
    "Merge and download"
  ]

const intro = [
    "Merge PDF joins two or more PDF files into one document in the order you choose. Drag the files to arrange them, pick only the pages you need from each one, and download a single PDF ready to email, print or upload.",
    "Your files are combined inside your browser, so contracts, bank statements and ID documents are never uploaded to a server."
  ]

const features = [
    "Combine any number of PDFs, including large ones",
    "Drag to reorder files, or sort them by name",
    "Pick page ranges from each file, such as 1-3, 5",
    "Optional blank page between files for double-sided printing",
    "Make every page A4 when the files have mixed page sizes"
  ]

const uses = [
    "Join scanned pages into one application form",
    "Combine an invoice with its supporting documents",
    "Put several chapters or reports into one file",
    "Send many PDFs as a single email attachment"
  ]

const faq: Faq[] = [
    {
      "q": "How do I merge PDF files?",
      "a": "Add two or more PDFs, drag them into the order you want, and press Merge. The combined PDF downloads straight away."
    },
    {
      "q": "Can I merge only some pages of a file?",
      "a": "Yes. Type page ranges next to each file, for example 1-3, 5, and only those pages are included."
    },
    {
      "q": "Are my PDFs uploaded?",
      "a": "No. Merging happens in your browser, so your files stay on your device."
    },
    {
      "q": "Is there a file size limit?",
      "a": "There is no fixed limit. Very large files depend on your device's memory, so on older phones merge fewer files at a time."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="merge-pdf"
      title="Merge PDF"
      lead="Combine multiple PDF files into one. Drag to set the order before merging."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <MergePdf />
    </ToolPageLayout>
  )
}
