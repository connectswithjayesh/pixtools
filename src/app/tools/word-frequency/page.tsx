import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import WordFrequency from "./WordFrequency"

export const metadata: Metadata = {
  title: "Word Frequency Counter & Keyword Density",
  description: "Find the most used words and 2–3 word phrases with count and keyword density, skip common words, and export to CSV.",
  alternates: { canonical: "/tools/word-frequency" },
  openGraph: {
    title: "Word Frequency Counter & Keyword Density",
    description: "Find the most used words and 2–3 word phrases with count and keyword density, skip common words, and export to CSV.",
    url: "/tools/word-frequency",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "TechSutraHub" }],
  },
}

const steps = [
    "Paste your article",
    "Pick words or phrases",
    "Read the table or export CSV"
  ]

const intro = [
    "Word Frequency Counter shows the most used words and phrases in your text with their count and keyword density. Switch between single words and 2- or 3-word phrases, and skip common words like the, and, आणि and है.",
    "Export the full table to CSV or copy it into Excel or Google Sheets."
  ]

const features = [
    "Single words, 2-word and 3-word phrases",
    "Count and density percentage",
    "Skips common English, Marathi and Hindi words",
    "Filter the table",
    "CSV export and copy for spreadsheets"
  ]

const uses = [
    "Check keyword density for SEO",
    "Avoid repeating the same word too often",
    "Analyse survey answers and reviews",
    "Find the main topics of a long text"
  ]

const faq: Faq[] = [
    {
      "q": "What is keyword density?",
      "a": "The share of your text taken up by a keyword. Around 1–2% for the main keyword reads naturally."
    },
    {
      "q": "What are stop words?",
      "a": "Very common words such as the, and, is, आणि and है that are usually not useful keywords."
    },
    {
      "q": "Can I export the results?",
      "a": "Yes. Download a CSV, or copy the table and paste it into a spreadsheet."
    },
    {
      "q": "Is my text uploaded?",
      "a": "No. Analysis happens in your browser."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="word-frequency"
      title="Word Frequency Counter"
      lead="Find the most used words and 2–3 word phrases with count and keyword density, skip common words, and export to CSV."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <WordFrequency />
    </ToolPageLayout>
  )
}
