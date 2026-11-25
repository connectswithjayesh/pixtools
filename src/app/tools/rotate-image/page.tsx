import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import RotateImage from "./RotateImage"

export const metadata: Metadata = {
  title: "Rotate & Flip Image Online Free",
  description: "Rotate images left, right or by any angle, and flip horizontally or vertically — one or many at once.",
  alternates: { canonical: "/tools/rotate-image" },
  openGraph: {
    title: "Rotate & Flip Image Online Free",
    description: "Rotate images left, right or by any angle, and flip horizontally or vertically — one or many at once.",
    url: "/tools/rotate-image",
  },
}

const steps = [
    "Add images",
    "Rotate or flip each one, or all together",
    "Save and download"
  ]

const intro = [
    "Rotate & Flip Image fixes sideways or upside-down photos and mirrors images horizontally or vertically. Rotate each picture individually or apply the same change to a whole batch with one click.",
    "A fine-angle control lets you straighten slightly tilted photos, such as horizons or scanned pages, and you can choose whether empty corners stay transparent or get filled with a colour."
  ]

const features = [
    "Rotate left or right by 90° for single images or all at once",
    "Flip horizontally (mirror) and vertically",
    "Straighten by any angle from −45° to +45°",
    "Transparent or coloured fill for empty corners",
    "Output to original format, JPG, PNG or WEBP",
    "Batch processing with ZIP download"
  ]

const uses = [
    "Fix photos that appear sideways on a computer",
    "Mirror a selfie so text reads correctly",
    "Straighten a tilted horizon or scanned document",
    "Rotate many product photos at once"
  ]

const faq: Faq[] = [
    {
      "q": "Why do my phone photos appear sideways?",
      "a": "Phones often store orientation separately. Some apps ignore it. Rotating here saves the pixels in the correct direction so they look right everywhere."
    },
    {
      "q": "Can I rotate by a custom angle?",
      "a": "Yes. Use the Straighten slider for small adjustments up to 45° in either direction, combined with the 90° buttons."
    },
    {
      "q": "What happens to the corners when I rotate by an angle?",
      "a": "The canvas grows to fit the rotated image. Corners are transparent for PNG/WEBP or filled with your chosen colour."
    },
    {
      "q": "Can I flip many images at once?",
      "a": "Yes. Use the buttons in the All images bar."
    },
    {
      "q": "Are images uploaded?",
      "a": "No. Everything runs in your browser."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="rotate-image"
      title="Rotate & Flip Image"
      lead="Rotate images left, right or by any angle, and flip horizontally or vertically — one or many at once."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <RotateImage />
    </ToolPageLayout>
  )
}
