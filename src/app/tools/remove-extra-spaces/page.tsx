import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import RemoveExtraSpaces from "./RemoveExtraSpaces"

export const metadata: Metadata = {
  title: "Remove Extra Spaces from Text Online",
  description: "Remove extra spaces, tabs and blank lines, trim every line and fix spacing around punctuation.",
  alternates: { canonical: "/tools/remove-extra-spaces" },
  openGraph: {
    title: "Remove Extra Spaces from Text Online",
    description: "Remove extra spaces, tabs and blank lines, trim every line and fix spacing around punctuation.",
    url: "/tools/remove-extra-spaces",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "TechSutraHub" }],
  },
}

const steps = [
    "Paste your text",
    "Pick what to clean",
    "Copy the tidy text"
  ]

const intro = [
    "Remove Extra Spaces cleans up messy spacing: double spaces, tabs, spaces at the start or end of lines, and too many empty lines. It also fixes spaces before commas and full stops.",
    "It's useful for text copied from Word, PDFs and websites, which often contains odd invisible spaces. Everything runs in your browser."
  ]

const features = [
    "Collapse multiple spaces into one",
    "Trim each line",
    "Convert tabs and non-breaking spaces",
    "Keep, limit or remove empty lines",
    "Fix spacing around punctuation"
  ]

const uses = [
    "Tidy text before publishing",
    "Clean data before pasting into a spreadsheet",
    "Fix text copied from a PDF",
    "Prepare code or CSV data"
  ]

const faq: Faq[] = [
    {
      "q": "What is a non-breaking space?",
      "a": "A special space character, often copied from Word or websites, that looks normal but can break formatting. This tool replaces it with a normal space."
    },
    {
      "q": "Can I remove all spaces?",
      "a": "Yes. Turn on Remove ALL spaces, useful for codes and numbers."
    },
    {
      "q": "Will it change my words?",
      "a": "No. Only spaces, tabs and empty lines are changed."
    },
    {
      "q": "Is my text uploaded?",
      "a": "No. Cleaning happens in your browser."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="remove-extra-spaces"
      title="Remove Extra Spaces"
      lead="Remove extra spaces, tabs and blank lines, trim every line and fix spacing around punctuation."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <RemoveExtraSpaces />
    </ToolPageLayout>
  )
}
