import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import SplitPdf from "./SplitPdf"

export const metadata: Metadata = {
  title: "Split PDF – Extract Pages from PDF Online",
  description: "Extract selected pages, split by custom ranges, every N pages, or into single pages.",
  alternates: { canonical: "/tools/pdf/split-pdf" },
  openGraph: {
    title: "Split PDF – Extract Pages from PDF Online",
    description: "Extract selected pages, split by custom ranges, every N pages, or into single pages.",
    url: "/tools/pdf/split-pdf",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "TechSutraHub" }],
  },
}

const steps = [
    "Add a PDF",
    "Choose pages or ranges",
    "Split and download"
  ]

const intro = [
    "Split PDF breaks one PDF into smaller files. Pick the pages you want, enter custom ranges, split every few pages, cut it into equal parts, or save every page as its own PDF.",
    "Page thumbnails make it easy to see what you are selecting, and everything is processed in your browser without uploading the document."
  ]

const features = [
    "Pick pages by clicking thumbnails",
    "Custom ranges such as 1-4, 7, 9-12",
    "Split every N pages or into equal parts",
    "Save every page as a separate PDF",
    "Several files download together as one ZIP"
  ]

const uses = [
    "Extract one chapter from a long report",
    "Send only the signed pages of a contract",
    "Separate a scanned batch into individual documents",
    "Share just the pages someone needs"
  ]

const faq: Faq[] = [
    {
      "q": "How do I extract pages from a PDF?",
      "a": "Open the PDF, choose Pick pages, tap the pages you want and press Split PDF. You get a new PDF with only those pages."
    },
    {
      "q": "Can I split a PDF into single pages?",
      "a": "Yes. Choose Every page and you get one PDF per page, downloaded together as a ZIP."
    },
    {
      "q": "Does splitting reduce quality?",
      "a": "No. Pages are copied exactly as they are, so text and images keep their original quality."
    },
    {
      "q": "Is my PDF uploaded?",
      "a": "No. Splitting is done in your browser and the file never leaves your device."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="split-pdf"
      title="Split PDF"
      lead="Extract selected pages, split by custom ranges, every N pages, or into single pages."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <SplitPdf />
    </ToolPageLayout>
  )
}
