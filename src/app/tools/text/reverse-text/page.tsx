import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import ReverseText from "./ReverseText"

export const metadata: Metadata = {
  title: "Reverse Text Generator – Backwards & Upside Down",
  description: "Reverse text backwards, reverse word order, reverse each word, flip line order or make upside-down text.",
  alternates: { canonical: "/tools/text/reverse-text" },
  openGraph: {
    title: "Reverse Text Generator – Backwards & Upside Down",
    description: "Reverse text backwards, reverse word order, reverse each word, flip line order or make upside-down text.",
    url: "/tools/text/reverse-text",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "TechSutraHub" }],
  },
}

const steps = [
    "Paste your text",
    "Pick a reverse style",
    "Copy the result"
  ]

const intro = [
    "Reverse Text writes text backwards. Reverse all the characters, reverse the order of words, reverse each word, flip the order of lines, or make upside-down text.",
    "Marathi letters with matras and emoji stay whole instead of breaking into pieces."
  ]

const features = [
    "Reverse characters, words, each word or lines",
    "Upside-down text",
    "Keeps Devanagari letters and emoji intact",
    "Works line by line",
    "Copy or reuse the result"
  ]

const uses = [
    "Make fun messages and puzzles",
    "Reverse a list's order",
    "Create mirror text for designs",
    "Check palindromes"
  ]

const faq: Faq[] = [
    {
      "q": "How do I write text backwards?",
      "a": "Paste your text and choose Reverse text. The result appears instantly."
    },
    {
      "q": "Does it work with Marathi?",
      "a": "Yes. Letters with matras, like स्ते, stay together."
    },
    {
      "q": "Which characters can be turned upside down?",
      "a": "English letters, numbers and common punctuation."
    },
    {
      "q": "Is my text uploaded?",
      "a": "No. Everything happens in your browser."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="reverse-text"
      title="Reverse Text"
      lead="Reverse text backwards, reverse word order, reverse each word, flip line order or make upside-down text."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <ReverseText />
    </ToolPageLayout>
  )
}
