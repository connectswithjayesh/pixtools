import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import CompressPdf from "./CompressPdf"

export const metadata: Metadata = {
  title: "Compress PDF – Reduce PDF File Size Online",
  description: "Shrink PDF files for email, WhatsApp and upload forms — lossless optimisation or strong image compression.",
  alternates: { canonical: "/tools/compress-pdf" },
  openGraph: {
    title: "Compress PDF – Reduce PDF File Size Online",
    description: "Shrink PDF files for email, WhatsApp and upload forms — lossless optimisation or strong image compression.",
    url: "/tools/compress-pdf",
  },
}

const steps = [
    "Add a PDF",
    "Pick a compression level",
    "Compress and download"
  ]

const intro = [
    "Compress PDF makes PDF files smaller so they fit email limits, WhatsApp and online form upload limits. Choose lossless optimisation to keep text sharp, or stronger levels that recompress the pages as images for much smaller files.",
    "The before and after sizes are shown before you download, and compression happens in your browser — your document is never uploaded."
  ]

const features = [
    "Lossless mode: restructures the file and keeps text selectable",
    "Recommended, Strong and Extreme levels for scans and photos",
    "Black & white option for even smaller scans",
    "Shows the size saved before you download",
    "Works with large multi-page PDFs"
  ]

const uses = [
    "Meet a 1 MB or 2 MB limit on an online application",
    "Email a scanned document that is too big",
    "Send a PDF on WhatsApp",
    "Save storage space"
  ]

const faq: Faq[] = [
    {
      "q": "How much can a PDF be compressed?",
      "a": "Scanned documents and photos often shrink by 60–90% with the Recommended or Strong level. PDFs that are mostly text shrink less."
    },
    {
      "q": "Will the text still be selectable?",
      "a": "With Lossless it stays selectable. The other levels turn pages into images, so text can no longer be selected or searched."
    },
    {
      "q": "Which level should I use?",
      "a": "Try Recommended first. Use Strong or Extreme only if the file is still too large."
    },
    {
      "q": "Is my PDF uploaded?",
      "a": "No. Compression runs in your browser."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="compress-pdf"
      title="Compress PDF"
      lead="Shrink PDF files for email, WhatsApp and upload forms — lossless optimisation or strong image compression."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <CompressPdf />
    </ToolPageLayout>
  )
}
