import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import PageNumbers from "./PageNumbers"

export const metadata: Metadata = {
  title: "Add Page Numbers to PDF Online Free",
  description: "Add page numbers to a PDF with position, format, starting number, font size and color options.",
  alternates: { canonical: "/tools/pdf-page-numbers" },
  openGraph: {
    title: "Add Page Numbers to PDF Online Free",
    description: "Add page numbers to a PDF with position, format, starting number, font size and color options.",
    url: "/tools/pdf-page-numbers",
  },
}

const steps = [
    "Add a PDF",
    "Choose position and format",
    "Apply and download"
  ]

const intro = [
    "Add Page Numbers stamps numbers on the pages of a PDF. Choose where they go, the style — such as 1, Page 1 of 10, or i, ii, iii — the starting number, the font, size and colour.",
    "A live preview shows the result before you download, and the PDF is edited in your browser without uploading."
  ]

const features = [
    "Six positions: top or bottom, left, centre or right",
    "Formats: 1, Page 1, 1 of N, Page 1 of N, Roman numerals and custom text",
    "Start from any number and skip the first pages",
    "Font, size, colour and margin controls",
    "Live preview of the first pages"
  ]

const uses = [
    "Number the pages of a thesis or report",
    "Prepare legal or tender documents",
    "Add page numbers before printing a booklet",
    "Make a merged PDF easier to refer to"
  ]

const faq: Faq[] = [
    {
      "q": "How do I add page numbers to a PDF?",
      "a": "Open the PDF, choose the position and format, and press Add page numbers. Then download the new PDF."
    },
    {
      "q": "Can I skip the cover page?",
      "a": "Yes. Set the first page to number, for example page 2, and choose the number to start from."
    },
    {
      "q": "Can I write 'Page 1 of 10'?",
      "a": "Yes. Pick that format, or type your own text using {n} for the page number and {total} for the page count."
    },
    {
      "q": "Is my PDF uploaded?",
      "a": "No. The numbers are added in your browser."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="pdf-page-numbers"
      title="Add Page Numbers"
      lead="Add page numbers to a PDF with position, format, starting number, font size and color options."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <PageNumbers />
    </ToolPageLayout>
  )
}
