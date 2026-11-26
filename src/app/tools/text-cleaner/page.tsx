import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import TextCleaner from "./TextCleaner"

export const metadata: Metadata = {
  title: "Text Cleaner – Remove HTML, Links & Symbols",
  description: "Clean messy text: strip HTML tags, decode entities, remove links, emails, emoji, numbers, special characters and invisible characters.",
  alternates: { canonical: "/tools/text-cleaner" },
  openGraph: {
    title: "Text Cleaner – Remove HTML, Links & Symbols",
    description: "Clean messy text: strip HTML tags, decode entities, remove links, emails, emoji, numbers, special characters and invisible characters.",
    url: "/tools/text-cleaner",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "TechSutraHub" }],
  },
}

const steps = [
    "Paste your messy text",
    "Tick what to remove",
    "Copy the clean text"
  ]

const intro = [
    "Text Cleaner removes the clutter from text copied from websites, emails and documents. Strip HTML tags, decode entities like &amp;, remove links, emails, emoji, hashtags, numbers, special symbols and invisible characters.",
    "Tick only what you want removed and the clean text appears instantly."
  ]

const features = [
    "Strip HTML tags, scripts and styles",
    "Decode HTML entities",
    "Remove URLs, emails, @mentions, #hashtags and emoji",
    "Straighten curly quotes and dashes",
    "Remove invisible zero-width characters"
  ]

const uses = [
    "Clean text copied from web pages",
    "Prepare text for AI tools or translation",
    "Remove tracking links before sharing",
    "Tidy social media captions"
  ]

const faq: Faq[] = [
    {
      "q": "What are invisible characters?",
      "a": "Characters like zero-width spaces that you can't see but that break searches, counts and formatting."
    },
    {
      "q": "Will it remove Marathi text?",
      "a": "Only if you turn on Non-English characters. All other options keep Marathi and Hindi."
    },
    {
      "q": "Can I clean HTML?",
      "a": "Yes. Strip HTML tags keeps the text and removes the markup."
    },
    {
      "q": "Is my text uploaded?",
      "a": "No. Cleaning happens in your browser."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="text-cleaner"
      title="Text Cleaner"
      lead="Clean messy text: strip HTML tags, decode entities, remove links, emails, emoji, numbers, special characters and invisible characters."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <TextCleaner />
    </ToolPageLayout>
  )
}
