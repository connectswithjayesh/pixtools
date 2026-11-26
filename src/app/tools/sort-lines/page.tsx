import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import SortLines from "./SortLines"

export const metadata: Metadata = {
  title: "Sort Lines Alphabetically – A to Z Sorter",
  description: "Sort lines alphabetically, naturally, by number, length or word count, in any order — or shuffle them randomly.",
  alternates: { canonical: "/tools/sort-lines" },
  openGraph: {
    title: "Sort Lines Alphabetically – A to Z Sorter",
    description: "Sort lines alphabetically, naturally, by number, length or word count, in any order — or shuffle them randomly.",
    url: "/tools/sort-lines",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "TechSutraHub" }],
  },
}

const steps = [
    "Paste your lines",
    "Choose how to sort",
    "Copy the sorted list"
  ]

const intro = [
    "Sort Lines puts any list in order: alphabetically, in natural order (item2 before item10), by the number in each line, by length or by word count. You can also reverse the list or shuffle it randomly.",
    "Marathi and Hindi lines are sorted in proper अ, आ, इ order. Everything runs in your browser."
  ]

const features = [
    "Alphabetical, natural, numeric, length and word-count sorting",
    "Ascending or descending",
    "Reverse or shuffle",
    "Remove empty lines and duplicates while sorting",
    "Correct Devanagari ordering"
  ]

const uses = [
    "Alphabetise names and city lists",
    "Order file names or versions naturally",
    "Rank lines by the numbers in them",
    "Randomise a list for a draw or quiz"
  ]

const faq: Faq[] = [
    {
      "q": "What is natural sort?",
      "a": "Natural sort orders numbers by value, so item2 comes before item10, the way people expect."
    },
    {
      "q": "Can I sort by numbers?",
      "a": "Yes. By number in line sorts on the first number found in each line."
    },
    {
      "q": "How do I shuffle a list?",
      "a": "Choose Shuffle randomly. Press Shuffle again for a new order."
    },
    {
      "q": "Is my text uploaded?",
      "a": "No. Sorting happens in your browser."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="sort-lines"
      title="Sort Lines"
      lead="Sort lines alphabetically, naturally, by number, length or word count, in any order — or shuffle them randomly."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <SortLines />
    </ToolPageLayout>
  )
}
