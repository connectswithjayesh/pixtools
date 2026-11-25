import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import RemoveLineBreaks from "./RemoveLineBreaks"

export const metadata: Metadata = {
  title: "Remove Line Breaks – Fix PDF Copied Text",
  description: "Remove line breaks from text copied from PDFs and emails, keep paragraphs, and fix words split with hyphens.",
  alternates: { canonical: "/tools/remove-line-breaks" },
  openGraph: {
    title: "Remove Line Breaks – Fix PDF Copied Text",
    description: "Remove line breaks from text copied from PDFs and emails, keep paragraphs, and fix words split with hyphens.",
    url: "/tools/remove-line-breaks",
  },
}

const steps = [
    "Paste your text",
    "Choose to keep paragraphs or remove all breaks",
    "Copy the joined text"
  ]

const intro = [
    "Line Break Remover joins lines that were broken in the wrong places, which happens when you copy text from a PDF or an email. Keep the paragraph breaks, remove every line break, or put each sentence on its own line.",
    "It also repairs words split with a hyphen at the end of a line. Everything runs in your browser."
  ]

const features = [
    "Keep paragraphs or remove all line breaks",
    "One sentence per line mode",
    "Join with a space, nothing, a comma or custom text",
    "Fix words broken with hyphens",
    "Remove double spaces"
  ]

const uses = [
    "Paste PDF text into an email or document",
    "Clean text before translating it",
    "Turn a column of values into one line",
    "Prepare text for a slide or social post"
  ]

const faq: Faq[] = [
    {
      "q": "Why does PDF text have line breaks?",
      "a": "PDFs store each line separately, so copied text keeps a break at the end of every line."
    },
    {
      "q": "Will my paragraphs be lost?",
      "a": "Not with Keep paragraphs, the default. Blank lines between paragraphs are kept."
    },
    {
      "q": "Can I turn a list into comma-separated text?",
      "a": "Yes. Choose Remove all and join with a comma."
    },
    {
      "q": "Is my text uploaded?",
      "a": "No. Everything happens in your browser."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="remove-line-breaks"
      title="Line Break Remover"
      lead="Remove line breaks from text copied from PDFs and emails, keep paragraphs, and fix words split with hyphens."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <RemoveLineBreaks />
    </ToolPageLayout>
  )
}
