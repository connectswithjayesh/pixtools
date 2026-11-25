import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import SignPdf from "./SignPdf"

export const metadata: Metadata = {
  title: "Sign PDF Online – Add Signature to PDF Free",
  description: "Sign PDF documents online: draw, type or upload your signature, add the date, and place them anywhere on any page.",
  alternates: { canonical: "/tools/sign-pdf" },
  openGraph: {
    title: "Sign PDF Online – Add Signature to PDF Free",
    description: "Sign PDF documents online: draw, type or upload your signature, add the date, and place them anywhere on any page.",
    url: "/tools/sign-pdf",
  },
}

const steps = [
    "Add a PDF",
    "Create your signature and drag it into place",
    "Save the signed PDF"
  ]

const intro = [
    "Sign PDF lets you add your signature to any PDF without printing it. Draw your signature with a finger or mouse, type your name in a handwriting font, or upload a photo of your signature, then place it anywhere on any page.",
    "You can also add today's date. The signed PDF is created in your browser, so your documents and signature stay on your device."
  ]

const features = [
    "Draw, type or upload a signature",
    "Drag, resize and place it on any page",
    "Add today's date as text",
    "Copy a signature to every page",
    "Ink colour and pen width options"
  ]

const uses = [
    "Sign agreements, offer letters and forms",
    "Approve invoices and purchase orders",
    "Fill and sign school or office forms",
    "Initial every page of a contract"
  ]

const faq: Faq[] = [
    {
      "q": "How do I sign a PDF online?",
      "a": "Open the PDF, create your signature, tap it to place it on the page, drag it into position and press Save signed PDF."
    },
    {
      "q": "Is this a legal digital signature?",
      "a": "It adds an image of your signature, like signing on paper. It is not a certificate-based digital signature. Check what the receiver needs."
    },
    {
      "q": "Can I sign on my phone?",
      "a": "Yes. Draw your signature with your finger and place it on the page."
    },
    {
      "q": "Is my signature uploaded?",
      "a": "No. Your signature and document never leave your device."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="sign-pdf"
      title="Sign PDF"
      lead="Sign PDF documents online: draw, type or upload your signature, add the date, and place them anywhere on any page."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <SignPdf />
    </ToolPageLayout>
  )
}
