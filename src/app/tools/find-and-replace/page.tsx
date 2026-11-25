import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import FindReplace from "./FindReplace"

export const metadata: Metadata = {
  title: "Find and Replace Text Online (with Regex)",
  description: "Find and replace text with match case, whole words and regular expressions, and see every match highlighted.",
  alternates: { canonical: "/tools/find-and-replace" },
  openGraph: {
    title: "Find and Replace Text Online (with Regex)",
    description: "Find and replace text with match case, whole words and regular expressions, and see every match highlighted.",
    url: "/tools/find-and-replace",
  },
}

const steps = [
    "Paste your text",
    "Type what to find and what to replace it with",
    "Copy the updated text"
  ]

const intro = [
    "Find & Replace finds a word or phrase in your text and replaces it, with every match highlighted. Match case, match whole words only, replace just the first match, or use regular expressions for advanced patterns.",
    "Ready-made patterns help with phone numbers, emails and dates. Everything runs in your browser."
  ]

const features = [
    "Highlights every match and shows the count",
    "Match case and whole-word options",
    "Regular expressions with $1, $2 groups",
    "\\n and \\t for new lines and tabs",
    "Swap find and replace in one click"
  ]

const uses = [
    "Change a name throughout a document",
    "Reformat dates from 2025-03-14 to 14/03/2025",
    "Remove or mask phone numbers",
    "Fix repeated typos"
  ]

const faq: Faq[] = [
    {
      "q": "How do I replace a word everywhere?",
      "a": "Paste your text, type the word in Find and the new word in Replace. Every match is replaced in the result."
    },
    {
      "q": "What does Whole words only do?",
      "a": "It matches cat but not category."
    },
    {
      "q": "Can I use regex?",
      "a": "Yes. Turn on Use regular expression and use $1, $2 in Replace for captured groups."
    },
    {
      "q": "Is my text uploaded?",
      "a": "No. It runs in your browser."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="find-and-replace"
      title="Find & Replace"
      lead="Find and replace text with match case, whole words and regular expressions, and see every match highlighted."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <FindReplace />
    </ToolPageLayout>
  )
}
