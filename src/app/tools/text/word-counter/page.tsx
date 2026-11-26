import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import WordCounter from "./WordCounter"

export const metadata: Metadata = {
  title: "Word Counter – Count Words & Characters Online",
  description: "Count words, characters, sentences and paragraphs as you type, with reading time, speaking time and top keywords. Works with Marathi and Hindi.",
  alternates: { canonical: "/tools/text/word-counter" },
  openGraph: {
    title: "Word Counter – Count Words & Characters Online",
    description: "Count words, characters, sentences and paragraphs as you type, with reading time, speaking time and top keywords. Works with Marathi and Hindi.",
    url: "/tools/text/word-counter",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "TechSutraHub" }],
  },
}

const steps = [
    "Type or paste your text",
    "See live counts and keyword stats",
    "Copy or keep editing"
  ]

const intro = [
    "Word Counter counts words, characters, sentences and paragraphs as you type, and estimates reading and speaking time. It also shows your most used keywords and details like average word length and the longest word.",
    "It counts English, मराठी and हिंदी correctly, including letters with matras. Your text stays in your browser and is never uploaded."
  ]

const features = [
    "Live word, character, sentence and paragraph count",
    "Reading and speaking time with adjustable speed",
    "Top keywords and 2–3 word phrases",
    "Count for selected text only",
    "Correct counts for Marathi and Hindi"
  ]

const uses = [
    "Check essay and assignment word limits",
    "Write blog posts and articles of the right length",
    "Time a speech or presentation",
    "Keep social media posts short"
  ]

const faq: Faq[] = [
    {
      "q": "How are words counted?",
      "a": "Words are groups of letters or numbers separated by spaces or punctuation. Hyphenated words and contractions like it's count as one word."
    },
    {
      "q": "Does it work for Marathi and Hindi?",
      "a": "Yes. Devanagari words and combined letters such as क्ष are counted correctly."
    },
    {
      "q": "How is reading time calculated?",
      "a": "Word count divided by reading speed, 200 words per minute by default. You can change the speed."
    },
    {
      "q": "Is my text saved?",
      "a": "Your text is kept only in this browser so it is still there if you reload. It is never uploaded."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="word-counter"
      title="Word Counter"
      lead="Count words, characters, sentences and paragraphs as you type, with reading time, speaking time and top keywords. Works with Marathi and Hindi."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <WordCounter />
    </ToolPageLayout>
  )
}
