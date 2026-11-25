import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import AddLineNumbers from "./AddLineNumbers"

export const metadata: Metadata = {
  title: "Add Line Numbers to Text Online",
  description: "Add line numbers in any format — 1. 1) [1] 01 — with a custom start and step, or remove existing line numbers.",
  alternates: { canonical: "/tools/add-line-numbers" },
  openGraph: {
    title: "Add Line Numbers to Text Online",
    description: "Add line numbers in any format — 1. 1) [1] 01 — with a custom start and step, or remove existing line numbers.",
    url: "/tools/add-line-numbers",
  },
}

const steps = [
    "Paste your lines",
    "Pick a number format",
    "Copy the numbered text"
  ]

const intro = [
    "Add Line Numbers puts a number at the start of every line, in the format you choose: 1., 1), [1], 01 and more. Set the starting number and step, skip empty lines, or remove existing numbers.",
    "Everything runs in your browser."
  ]

const features = [
    "Eight ready formats plus your own",
    "Start at any number and count by any step",
    "Zero padding: 01, 02 … 10",
    "Skip empty lines",
    "Remove line numbers from numbered text"
  ]

const uses = [
    "Number a list of questions or steps",
    "Add line numbers to code or a poem",
    "Prepare numbered lists for documents",
    "Clean up a list that already has numbers"
  ]

const faq: Faq[] = [
    {
      "q": "How do I number lines?",
      "a": "Paste your lines and pick a format. Every line gets a number instantly."
    },
    {
      "q": "Can I start from a number other than 1?",
      "a": "Yes. Set Start at and Count by."
    },
    {
      "q": "Can I remove numbers?",
      "a": "Yes. Choose Remove numbers to strip 1., 2), [3] and similar prefixes."
    },
    {
      "q": "Is my text uploaded?",
      "a": "No. It runs in your browser."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="add-line-numbers"
      title="Add Line Numbers"
      lead="Add line numbers in any format — 1. 1) [1] 01 — with a custom start and step, or remove existing line numbers."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <AddLineNumbers />
    </ToolPageLayout>
  )
}
