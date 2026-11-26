import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import WatermarkPdf from "./WatermarkPdf"

export const metadata: Metadata = {
  title: "Watermark PDF – Add Text or Logo to PDF",
  description: "Add a text watermark to all or selected PDF pages with opacity, angle, size, color and tiling.",
  alternates: { canonical: "/tools/watermark-pdf" },
  openGraph: {
    title: "Watermark PDF – Add Text or Logo to PDF",
    description: "Add a text watermark to all or selected PDF pages with opacity, angle, size, color and tiling.",
    url: "/tools/watermark-pdf",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "TechSutraHub" }],
  },
}

const steps = [
    "Add a PDF",
    "Type the watermark and style it",
    "Apply and download"
  ]

const intro = [
    "Watermark PDF adds a text or logo watermark to the pages of a PDF. Use it to mark documents as CONFIDENTIAL, DRAFT or COPY, or to brand files with your company logo.",
    "Text in any language, including मराठी and हिंदी, is supported. You control size, colour, transparency, angle and position, and everything runs in your browser."
  ]

const features = [
    "Text or image (PNG/JPG logo) watermark",
    "Single watermark or tiled across the page",
    "Opacity, size, angle and colour controls",
    "Nine positions for single watermarks",
    "All pages or a page range"
  ]

const uses = [
    "Mark documents as confidential before sharing",
    "Add your logo to quotations and price lists",
    "Stamp DRAFT on documents under review",
    "Discourage copying of certificates and notes"
  ]

const faq: Faq[] = [
    {
      "q": "How do I add a watermark to a PDF?",
      "a": "Open the PDF, type your text or choose a logo, adjust the style and press Add watermark."
    },
    {
      "q": "Can I use Marathi or Hindi text?",
      "a": "Yes. Text watermarks support any language your device can display."
    },
    {
      "q": "Can the watermark be removed later?",
      "a": "The watermark becomes part of each page, so it cannot simply be switched off. Keep your original file if you may need a clean copy."
    },
    {
      "q": "Is my PDF uploaded?",
      "a": "No. The watermark is added in your browser."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="watermark-pdf"
      title="Watermark PDF"
      lead="Add a text watermark to all or selected PDF pages with opacity, angle, size, color and tiling."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <WatermarkPdf />
    </ToolPageLayout>
  )
}
