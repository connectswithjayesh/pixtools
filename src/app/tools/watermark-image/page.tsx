import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import WatermarkImage from "./WatermarkImage"

export const metadata: Metadata = {
  title: "Watermark Image – Add Text or Logo to Photos",
  description: "Stamp text or your logo on images with position, size, opacity, rotation and tiling controls.",
  alternates: { canonical: "/tools/watermark-image" },
  openGraph: {
    title: "Watermark Image – Add Text or Logo to Photos",
    description: "Stamp text or your logo on images with position, size, opacity, rotation and tiling controls.",
    url: "/tools/watermark-image",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "TechSutraHub" }],
  },
}

const steps = [
    "Add images",
    "Set your text or logo and its style",
    "Apply and download"
  ]

const intro = [
    "Watermark Image protects your photos by adding your name, website or logo on top. Choose one of nine positions, click anywhere on the preview to place it exactly, or tile the watermark across the whole picture so it can’t be cropped out.",
    "Fine-tune size, opacity, rotation, font, bold, italic, shadow and outline, then apply the same watermark to many photos in one go."
  ]

const features = [
    "Text or logo/image watermark",
    "Nine preset positions or click-to-place anywhere",
    "Tiled pattern with adjustable spacing",
    "Five fonts with bold, italic, shadow and outline",
    "Size, opacity and rotation sliders with live preview",
    "Batch watermarking with ZIP download"
  ]

const uses = [
    "Protect photography before posting online",
    "Brand product photos for an online shop",
    "Mark documents as CONFIDENTIAL or SAMPLE",
    "Add your Instagram handle to images"
  ]

const faq: Faq[] = [
    {
      "q": "How do I add a logo as a watermark?",
      "a": "Choose Logo / image, upload a PNG with a transparent background, then set size, opacity and position."
    },
    {
      "q": "How can I stop people from removing the watermark?",
      "a": "Turn on Tile across image. A repeated, semi-transparent pattern is much harder to crop or edit out than a single corner mark."
    },
    {
      "q": "Can I watermark many photos at once?",
      "a": "Yes. Add all your images; the same watermark is applied to each, scaled to each image’s size."
    },
    {
      "q": "Does it reduce photo quality?",
      "a": "Only if you pick a low JPG quality. Keep quality at 90% or choose PNG for best results."
    },
    {
      "q": "Are my photos uploaded?",
      "a": "No. Watermarking happens in your browser."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="watermark-image"
      title="Watermark Image"
      lead="Stamp text or your logo on images with position, size, opacity, rotation and tiling controls."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <WatermarkImage />
    </ToolPageLayout>
  )
}
