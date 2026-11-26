import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import OrganizePdf from "./OrganizePdf"

export const metadata: Metadata = {
  title: "Organize PDF – Reorder, Rotate & Delete Pages",
  description: "Rearrange pages on a drag-and-drop board, rotate, duplicate or delete pages, and add pages from other PDFs.",
  alternates: { canonical: "/tools/pdf/organize-pdf" },
  openGraph: {
    title: "Organize PDF – Reorder, Rotate & Delete Pages",
    description: "Rearrange pages on a drag-and-drop board, rotate, duplicate or delete pages, and add pages from other PDFs.",
    url: "/tools/pdf/organize-pdf",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "TechSutraHub" }],
  },
}

const steps = [
    "Add a PDF",
    "Drag, rotate or delete pages",
    "Save the new PDF"
  ]

const intro = [
    "Organize PDF lets you rearrange the pages of a PDF on a visual board. Drag pages into a new order, rotate them, duplicate or delete them, add blank pages, and even bring in pages from other PDFs.",
    "Undo is always available, and the new PDF is created in your browser, so your document stays private."
  ]

const features = [
    "Drag-and-drop page board with thumbnails",
    "Rotate, duplicate or delete single pages or a selection",
    "Insert blank pages and pages from other PDFs",
    "Reverse the order in one click",
    "Undo any change"
  ]

const uses = [
    "Fix pages scanned in the wrong order",
    "Rotate sideways pages in a scanned document",
    "Remove blank or unwanted pages",
    "Build one document from parts of several PDFs"
  ]

const faq: Faq[] = [
    {
      "q": "How do I reorder PDF pages?",
      "a": "Open the PDF and drag the page thumbnails into the order you want. On a phone, drag a page by its ⠿ handle. Then press Save PDF."
    },
    {
      "q": "Can I rotate only one page?",
      "a": "Yes. Use the rotate buttons on that page, or select several pages and rotate them together."
    },
    {
      "q": "Can I add pages from another PDF?",
      "a": "Yes. Use Add another PDF and its pages appear on the board, ready to move anywhere."
    },
    {
      "q": "Is my document uploaded?",
      "a": "No. All changes are made in your browser."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="organize-pdf"
      title="Organize PDF"
      lead="Rearrange pages on a drag-and-drop board, rotate, duplicate or delete pages, and add pages from other PDFs."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <OrganizePdf />
    </ToolPageLayout>
  )
}
