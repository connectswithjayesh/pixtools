import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import EmojiRemover from "./EmojiRemover"

export const metadata: Metadata = {
  title: "Emoji Remover – Remove Emoji from Text",
  description: "Remove every emoji from text, including flags, skin tones and family emoji, while keeping Marathi, Hindi and normal symbols.",
  alternates: { canonical: "/tools/remove-emoji" },
  openGraph: {
    title: "Emoji Remover – Remove Emoji from Text",
    description: "Remove every emoji from text, including flags, skin tones and family emoji, while keeping Marathi, Hindi and normal symbols.",
    url: "/tools/remove-emoji",
  },
}

const steps = [
    "Paste your text",
    "Choose what to replace emoji with",
    "Copy the clean text"
  ]

const intro = [
    "Emoji Remover deletes every emoji from your text, including skin tones, flags, family emoji and keycaps like 1️⃣, and tidies the leftover spaces.",
    "Marathi and Hindi text and normal numbers are never touched, and you can keep ©, ® and ™."
  ]

const features = [
    "Removes all emoji, including combined ones",
    "Lists the emoji found with counts",
    "Replace with nothing or a space",
    "Keeps ©, ® and ™ if you want",
    "Cleans up extra spaces"
  ]

const uses = [
    "Clean social media text for documents",
    "Prepare text for systems that don't support emoji",
    "Make messages more formal",
    "Clean data before analysis"
  ]

const faq: Faq[] = [
    {
      "q": "Does it remove flag and family emoji?",
      "a": "Yes. Multi-part emoji such as flags, skin tones and families are removed completely."
    },
    {
      "q": "Will it remove numbers?",
      "a": "No. Only emoji keycaps like 1️⃣ are removed; normal numbers stay."
    },
    {
      "q": "Does it affect Marathi text?",
      "a": "No. Devanagari letters are never removed."
    },
    {
      "q": "Is my text uploaded?",
      "a": "No. It runs in your browser."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="remove-emoji"
      title="Emoji Remover"
      lead="Remove every emoji from text, including flags, skin tones and family emoji, while keeping Marathi, Hindi and normal symbols."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <EmojiRemover />
    </ToolPageLayout>
  )
}
