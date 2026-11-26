import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import CaseConverter from "./CaseConverter"

export const metadata: Metadata = {
  title: "Case Converter – UPPER, lower, Title Case & more",
  description: "Change text to UPPER CASE, lower case, Title Case, Sentence case, camelCase, snake_case, kebab-case and more in one click.",
  alternates: { canonical: "/tools/case-converter" },
  openGraph: {
    title: "Case Converter – UPPER, lower, Title Case & more",
    description: "Change text to UPPER CASE, lower case, Title Case, Sentence case, camelCase, snake_case, kebab-case and more in one click.",
    url: "/tools/case-converter",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "TechSutraHub" }],
  },
}

const steps = [
    "Paste your text",
    "Pick a case style",
    "Copy or download the result"
  ]

const intro = [
    "Case Converter changes text to UPPER CASE, lower case, Title Case, Sentence case and more in one click. Developers can convert to camelCase, PascalCase, snake_case, kebab-case and CONSTANT_CASE.",
    "Paste your text, pick a style and copy the result. Everything happens in your browser."
  ]

const features = [
    "14 case styles",
    "Title Case keeps small words like 'of' and 'the' lowercase",
    "Sentence case fixes text typed in CAPS",
    "Code cases convert each line separately",
    "Copy, download or reuse the result as new input"
  ]

const uses = [
    "Fix text accidentally typed with Caps Lock on",
    "Format headings and titles",
    "Convert names into variable names",
    "Make URL slugs with kebab-case"
  ]

const faq: Faq[] = [
    {
      "q": "What is Title Case?",
      "a": "The main words start with a capital letter, while short words like a, of and the stay lowercase unless they are first or last."
    },
    {
      "q": "What is the difference between camelCase and PascalCase?",
      "a": "camelCase starts with a lowercase letter (userName); PascalCase starts with a capital (UserName)."
    },
    {
      "q": "Does it change Marathi or Hindi text?",
      "a": "No. Devanagari has no upper and lower case, so that text stays the same."
    },
    {
      "q": "Is my text uploaded?",
      "a": "No. The conversion happens in your browser."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="case-converter"
      title="Case Converter"
      lead="Change text to UPPER CASE, lower case, Title Case, Sentence case, camelCase, snake_case, kebab-case and more in one click."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <CaseConverter />
    </ToolPageLayout>
  )
}
