import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import ImageToPdf from "./ImageToPdf"

export const metadata: Metadata = {
  title: "Image to PDF Converter – JPG & PNG to PDF Free",
  description: "Arrange images on a drag-and-drop board, rotate them, choose page size and margins, and download a PDF.",
  alternates: { canonical: "/tools/image/image-to-pdf" },
  openGraph: {
    title: "Image to PDF Converter – JPG & PNG to PDF Free",
    description: "Arrange images on a drag-and-drop board, rotate them, choose page size and margins, and download a PDF.",
    url: "/tools/image/image-to-pdf",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "TechSutraHub" }],
  },
}

const steps = [
    "Add your images",
    "Reorder on the board and pick page settings",
    "Convert and download the PDF"
  ]

const intro = [
    "Image to PDF turns your photos, scans and screenshots into a single, neat PDF document. Drop in JPG, PNG, WEBP, GIF, BMP, SVG or AVIF files, arrange them on a drag-and-drop board, and download a PDF that is ready to email, print or upload to a form.",
    "Unlike most converters, nothing is uploaded. The PDF is built inside your browser, so ID cards, bills, certificates and personal photos never leave your device. It works on phones too, which makes it easy to turn photos of paper documents into one clean file."
  ]

const features = [
    "Drag-and-drop board to reorder pages, with a live preview of the real page layout",
    "Page sizes A4, A3, A5, Letter, Legal, or exactly the size of each image",
    "Auto, portrait or landscape orientation and adjustable margins",
    "Fit, fill, stretch or original-size placement, plus page background colour",
    "JPEG quality slider, 72–300 dpi resolution and black-and-white mode to control file size",
    "Page numbers, text watermark, PDF title and author, and one-PDF-per-image ZIP output"
  ]

const uses = [
    "Combine photos of documents into one PDF for an online application",
    "Send several receipts or bills as a single attachment",
    "Turn screenshots into a shareable report",
    "Create a printable photo album or portfolio"
  ]

const faq: Faq[] = [
    {
      "q": "Is the Image to PDF converter free?",
      "a": "Yes. It is completely free with no sign-up, no daily limit and no watermark added to your PDF."
    },
    {
      "q": "Are my images uploaded to a server?",
      "a": "No. The PDF is created in your browser with JavaScript. Your images stay on your device and are cleared when you close the page."
    },
    {
      "q": "How many images can I add?",
      "a": "Up to 300 images in one PDF. Very large photos use more memory, so on older phones it is best to convert in smaller batches."
    },
    {
      "q": "How do I make the PDF smaller?",
      "a": "Choose JPEG format, lower the quality slider to around 70–80% and pick 150 dpi. For text documents, black-and-white mode also reduces size."
    },
    {
      "q": "Can I change the order of the pages?",
      "a": "Yes. Drag the cards on the board, or use the Sort menu to order by name, date or size. You can also rotate, duplicate or delete any page."
    },
    {
      "q": "Does it work on iPhone and Android?",
      "a": "Yes. It works in any modern mobile browser. On a phone, drag a page by its ⠿ handle, tap a page to preview it, and use the Settings and Convert buttons at the bottom of the screen."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="image-to-pdf"
      title="Image to PDF"
      lead="Arrange images on a drag-and-drop board, rotate them, choose page size and margins, and download a PDF."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <ImageToPdf />
    </ToolPageLayout>
  )
}
