import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import RemoveDuplicateLines from "./RemoveDuplicateLines"

export const metadata: Metadata = {
  title: "Remove Duplicate Lines Online",
  description: "Remove duplicate lines from lists, keep the first or last copy, ignore case or spaces, or show only the duplicated lines.",
  alternates: { canonical: "/tools/text/remove-duplicate-lines" },
  openGraph: {
    title: "Remove Duplicate Lines Online",
    description: "Remove duplicate lines from lists, keep the first or last copy, ignore case or spaces, or show only the duplicated lines.",
    url: "/tools/text/remove-duplicate-lines",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "TechSutraHub" }],
  },
}

const steps = [
    "Paste your list",
    "Choose how duplicates are matched",
    "Copy the unique lines"
  ]

const intro = [
    "Remove Duplicate Lines deletes repeated lines from any list and keeps one copy of each. Choose whether to keep the first or last copy, ignore capital letters or extra spaces, or show only the lines that were duplicated.",
    "It handles lists with thousands of lines instantly, right in your browser."
  ]

const features = [
    "Keep the first or the last copy",
    "Case-sensitive or case-insensitive matching",
    "Ignore spaces at the start and end of lines",
    "Show only duplicates, or only lines that never repeat",
    "Optional A–Z sort of the result"
  ]

const uses = [
    "Clean email or phone number lists",
    "Remove repeated keywords from an SEO list",
    "Deduplicate product codes or URLs",
    "Find which entries appear more than once"
  ]

const faq: Faq[] = [
    {
      "q": "How do I remove duplicate lines?",
      "a": "Paste your list and the unique lines appear instantly. Copy or download the result."
    },
    {
      "q": "Are 'Apple' and 'apple' duplicates?",
      "a": "Only if Case sensitive is off, which is the default."
    },
    {
      "q": "Can I see which lines were duplicated?",
      "a": "Yes. Choose Duplicates to list only the lines that appear more than once."
    },
    {
      "q": "Is my list uploaded?",
      "a": "No. Everything runs in your browser."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="remove-duplicate-lines"
      title="Remove Duplicate Lines"
      lead="Remove duplicate lines from lists, keep the first or last copy, ignore case or spaces, or show only the duplicated lines."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <RemoveDuplicateLines />
    </ToolPageLayout>
  )
}
