import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import ResizeImage from "./ResizeImage"

export const metadata: Metadata = {
  title: "Resize Image – Change Width & Height in Pixels",
  description: "Resize images by exact pixels or percentage, keep the aspect ratio, or use social-media presets.",
  alternates: { canonical: "/tools/resize-image" },
  openGraph: {
    title: "Resize Image – Change Width & Height in Pixels",
    description: "Resize images by exact pixels or percentage, keep the aspect ratio, or use social-media presets.",
    url: "/tools/resize-image",
  },
}

const steps = [
    "Add images",
    "Enter new size, percentage or a preset",
    "Resize and download"
  ]

const intro = [
    "Resize Image changes the width and height of your pictures in pixels, centimetres, millimetres, inches or by percentage. Keep the aspect ratio locked to avoid stretching, or set an exact size when a form or platform demands it.",
    "Ready-made presets cover Instagram, Facebook, YouTube, X, LinkedIn and passport photos, and you can resize a whole batch of images at once. When you resize in cm or inches, the chosen DPI is saved into the JPG so it prints at the right size."
  ]

const features = [
    "Resize by pixels, cm, mm, inches (with DPI) or percentage",
    "Aspect-ratio lock, or stretch to an exact size",
    "Social media and passport presets with fill (crop) or fit (border) modes",
    "Don’t-enlarge option to keep small images sharp",
    "Output as original format, JPG, PNG or WEBP with quality control",
    "Batch resize with ZIP download and before/after comparison"
  ]

const uses = [
    "Make a 35×45 mm passport-size photo for a form",
    "Prepare images for an Instagram post, story or YouTube thumbnail",
    "Shrink photos for a website or online store",
    "Print a photo at an exact size in centimetres"
  ]

const faq: Faq[] = [
    {
      "q": "How do I resize an image without stretching it?",
      "a": "Keep the chain (lock) icon on. Enter just the width or the height and the other side is calculated automatically."
    },
    {
      "q": "How do I make a passport-size photo?",
      "a": "Use the Presets tab and choose Passport photo (35×45 mm), or switch to cm, enter 3.5 × 4.5 and choose 300 DPI."
    },
    {
      "q": "What is DPI and why does it matter?",
      "a": "DPI (dots per inch) links pixels to printed size. At 300 DPI, 3.5 cm becomes 413 pixels. The tool saves the DPI in JPG files so printers use the right size."
    },
    {
      "q": "Can I resize many images at once?",
      "a": "Yes. Add as many images as you need, choose the size once, and download them all as a ZIP."
    },
    {
      "q": "Does resizing upload my images?",
      "a": "No. Everything happens in your browser."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="resize-image"
      title="Resize Image"
      lead="Resize images by exact pixels or percentage, keep the aspect ratio, or use social-media presets."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <ResizeImage />
    </ToolPageLayout>
  )
}
