import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import CharacterCounter from "./CharacterCounter"

export const metadata: Metadata = {
  title: "Character Counter – With & Without Spaces",
  description: "Count characters with and without spaces and check limits for X (Twitter), meta titles, Instagram, YouTube and SMS.",
  alternates: { canonical: "/tools/text/character-counter" },
  openGraph: {
    title: "Character Counter – With & Without Spaces",
    description: "Count characters with and without spaces and check limits for X (Twitter), meta titles, Instagram, YouTube and SMS.",
    url: "/tools/text/character-counter",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "TechSutraHub" }],
  },
}

const steps = [
    "Type or paste your text",
    "Check the limit bars for each platform",
    "Trim and copy if it's too long"
  ]

const intro = [
    "Character Counter counts characters with and without spaces and checks your text against the limits of popular platforms: X (Twitter), Instagram, YouTube, LinkedIn, Google Ads, SEO titles and descriptions, and SMS.",
    "If your text is too long, copy a version trimmed to the limit. Emoji and Marathi letters are counted the way you see them."
  ]

const features = [
    "Characters with and without spaces",
    "Limit bars for 13 platforms plus your own limit",
    "SMS part count for GSM and Unicode messages",
    "Copy text trimmed to any limit",
    "Byte size and most used characters"
  ]

const uses = [
    "Write meta titles and descriptions for SEO",
    "Fit a post within X's 280 characters",
    "Write Google Ads headlines",
    "Check how many SMS a message will use"
  ]

const faq: Faq[] = [
    {
      "q": "Do spaces count as characters?",
      "a": "Yes, on most platforms. The counter shows both totals so you can use the one you need."
    },
    {
      "q": "Why does a Marathi SMS use more messages?",
      "a": "SMS with Marathi, Hindi or emoji is sent as Unicode, which fits 70 characters per message instead of 160."
    },
    {
      "q": "How long should a meta description be?",
      "a": "About 150–160 characters, so it isn't cut off in search results."
    },
    {
      "q": "Is my text uploaded?",
      "a": "No. Counting happens in your browser."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="character-counter"
      title="Character Counter"
      lead="Count characters with and without spaces and check limits for X (Twitter), meta titles, Instagram, YouTube and SMS."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <CharacterCounter />
    </ToolPageLayout>
  )
}
