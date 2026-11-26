import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import TextRepeater from "./TextRepeater"

export const metadata: Metadata = {
  title: "Text Repeater – Repeat Text Many Times",
  description: "Repeat any word or message up to 1,00,000 times with new lines, spaces, commas or a custom separator, and optional numbering.",
  alternates: { canonical: "/tools/text-repeater" },
  openGraph: {
    title: "Text Repeater – Repeat Text Many Times",
    description: "Repeat any word or message up to 1,00,000 times with new lines, spaces, commas or a custom separator, and optional numbering.",
    url: "/tools/text-repeater",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "TechSutraHub" }],
  },
}

const steps = [
    "Type the text to repeat",
    "Set how many times and the separator",
    "Copy the result"
  ]

const intro = [
    "Text Repeater repeats a word, line or message as many times as you like, up to 1,00,000. Put the copies on new lines, separate them with spaces, commas or your own text, and number them if you want.",
    "The result appears instantly and can be copied or downloaded."
  ]

const features = [
    "Repeat up to 1,00,000 times",
    "New line, space, comma or custom separator",
    "Optional numbering with your own format",
    "Quick buttons for common counts",
    "Copy or download as .txt"
  ]

const uses = [
    "Create test data for forms and apps",
    "Make repeated patterns or lines for designs",
    "Fill a list template quickly",
    "Generate numbered lines"
  ]

const faq: Faq[] = [
    {
      "q": "How many times can I repeat text?",
      "a": "Up to 1,00,000 times, with a 5 MB limit on the total size."
    },
    {
      "q": "Can each copy be on a new line?",
      "a": "Yes. That is the default separator."
    },
    {
      "q": "Can I number the copies?",
      "a": "Yes. Turn on numbering and set a format such as {n}. or ({n})."
    },
    {
      "q": "Is my text uploaded?",
      "a": "No. It runs in your browser."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="text-repeater"
      title="Text Repeater"
      lead="Repeat any word or message up to 1,00,000 times with new lines, spaces, commas or a custom separator, and optional numbering."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <TextRepeater />
    </ToolPageLayout>
  )
}
