import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import LoremIpsum from "./LoremIpsum"

export const metadata: Metadata = {
  title: "Lorem Ipsum Generator – Latin, Marathi & Hindi",
  description: "Generate Lorem Ipsum placeholder paragraphs, sentences, words or lists — plus Marathi and Hindi dummy text, with optional HTML tags.",
  alternates: { canonical: "/tools/lorem-ipsum-generator" },
  openGraph: {
    title: "Lorem Ipsum Generator – Latin, Marathi & Hindi",
    description: "Generate Lorem Ipsum placeholder paragraphs, sentences, words or lists — plus Marathi and Hindi dummy text, with optional HTML tags.",
    url: "/tools/lorem-ipsum-generator",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "TechSutraHub" }],
  },
}

const steps = [
    "Choose paragraphs, sentences, words or a list",
    "Pick the language and amount",
    "Copy the dummy text"
  ]

const intro = [
    "Lorem Ipsum Generator creates placeholder text for designs, websites and layouts. Generate paragraphs, sentences, words or list items, with or without HTML tags.",
    "Besides classic Latin Lorem Ipsum, it can generate Marathi and Hindi dummy text, which is useful for testing Devanagari fonts and layouts."
  ]

const features = [
    "Paragraphs, sentences, words or lists",
    "Latin, मराठी and हिंदी dummy text",
    "Optional classic 'Lorem ipsum dolor sit amet' start",
    "HTML output with <p> and <ul><li>",
    "New random text in one click"
  ]

const uses = [
    "Fill website and app mock-ups",
    "Test Marathi and Hindi fonts",
    "Design print layouts before the copy is ready",
    "Create sample content for testing"
  ]

const faq: Faq[] = [
    {
      "q": "What is Lorem Ipsum?",
      "a": "Scrambled Latin text used since the 1500s as placeholder text, so readers focus on the design rather than the words."
    },
    {
      "q": "Can I get Marathi dummy text?",
      "a": "Yes. Choose मराठी to generate random Marathi words and sentences."
    },
    {
      "q": "Can I get HTML?",
      "a": "Yes. Turn on Wrap in HTML tags to get paragraphs and lists as HTML."
    },
    {
      "q": "Is the text free to use?",
      "a": "Yes. Use it anywhere."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="lorem-ipsum-generator"
      title="Lorem Ipsum Generator"
      lead="Generate Lorem Ipsum placeholder paragraphs, sentences, words or lists — plus Marathi and Hindi dummy text, with optional HTML tags."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <LoremIpsum />
    </ToolPageLayout>
  )
}
