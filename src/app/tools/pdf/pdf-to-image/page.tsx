import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import PdfToImage from "./PdfToImage"

export const metadata: Metadata = {
  title: "PDF to JPG & PNG Converter Online Free",
  description: "Turn every PDF page, or the pages you choose, into high-quality JPG or PNG images.",
  alternates: { canonical: "/tools/pdf/pdf-to-image" },
  openGraph: {
    title: "PDF to JPG & PNG Converter Online Free",
    description: "Turn every PDF page, or the pages you choose, into high-quality JPG or PNG images.",
    url: "/tools/pdf/pdf-to-image",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "TechSutraHub" }],
  },
}

const steps = [
    "Add a PDF",
    "Pick format, quality and pages",
    "Convert and download"
  ]

const intro = [
    "PDF to Image converts the pages of a PDF into JPG, PNG or WEBP images. Convert every page or only the ones you choose, at the resolution you need — from quick previews to 600 dpi print quality.",
    "Pages are rendered in your browser with the same engine Firefox uses, so the images look exactly like the PDF and your file stays on your device."
  ]

const features = [
    "JPG, PNG or WEBP output",
    "72, 150, 300 or 600 dpi",
    "All pages or a custom page range",
    "Quality slider for JPG and WEBP, and a black & white option",
    "Download single pages or all of them as a ZIP"
  ]

const uses = [
    "Share a PDF page on WhatsApp or social media",
    "Insert a PDF page into a presentation",
    "Upload a certificate where only images are accepted",
    "Create thumbnails of a document"
  ]

const faq: Faq[] = [
    {
      "q": "How do I convert a PDF to JPG?",
      "a": "Open the PDF, choose JPG and a resolution, and press Convert. Download each page, or all pages as a ZIP."
    },
    {
      "q": "Which resolution should I choose?",
      "a": "150 dpi is good for screens and sharing. Choose 300 dpi for printing and 600 dpi only when you need very fine detail."
    },
    {
      "q": "Can I convert only one page?",
      "a": "Yes. Choose Pick pages and enter the page number or a range."
    },
    {
      "q": "Is my PDF uploaded?",
      "a": "No. Pages are turned into images inside your browser."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="pdf-to-image"
      title="PDF to Image"
      lead="Turn every PDF page, or the pages you choose, into high-quality JPG or PNG images."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <PdfToImage />
    </ToolPageLayout>
  )
}
