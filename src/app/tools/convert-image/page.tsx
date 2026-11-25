import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import ConvertImage from "./ConvertImage"

export const metadata: Metadata = {
  title: "Convert Image – JPG to PNG, PNG to WEBP & More",
  description: "Convert images between JPG, PNG and WEBP in bulk, with quality and background options.",
  alternates: { canonical: "/tools/convert-image" },
  openGraph: {
    title: "Convert Image – JPG to PNG, PNG to WEBP & More",
    description: "Convert images between JPG, PNG and WEBP in bulk, with quality and background options.",
    url: "/tools/convert-image",
  },
}

const steps = [
    "Add images in any format",
    "Choose the output format",
    "Convert and download"
  ]

const intro = [
    "Convert Image changes pictures from one format to another: JPG, PNG, WEBP, ICO and BMP. It reads almost any image your browser can open, including GIF, SVG and AVIF, and converts single files or large batches in seconds.",
    "Use it to turn modern WEBP downloads back into JPG, make transparent PNGs, create a multi-size favicon.ico for a website, or produce BMP files for older software."
  ]

const features = [
    "Output to JPG, PNG, WEBP, ICO (favicon) and BMP",
    "Input from JPG, PNG, WEBP, GIF, BMP, SVG and AVIF",
    "Quality control for JPG and WEBP",
    "Choose a background colour for transparent areas in JPG and BMP",
    "ICO files with up to seven sizes from 16 to 256 px in one file",
    "Batch conversion with ZIP download"
  ]

const uses = [
    "Convert WEBP to JPG for apps that don’t support WEBP",
    "Convert JPG to PNG or WEBP for websites",
    "Create a favicon.ico from your logo",
    "Prepare BMP images for legacy software or devices"
  ]

const faq: Faq[] = [
    {
      "q": "How do I convert WEBP to JPG?",
      "a": "Add your WEBP files, choose JPG and press Convert. Transparent parts will be filled with the background colour you choose."
    },
    {
      "q": "Will converting to PNG make my image better quality?",
      "a": "No. PNG is lossless, so it won’t lose more quality, but it can’t restore detail already lost in a JPG. It will usually be a bigger file."
    },
    {
      "q": "How do I make a favicon?",
      "a": "Choose ICO, keep the sizes 16, 32 and 48 selected (add larger ones for desktop shortcuts) and convert a square logo."
    },
    {
      "q": "Is there a file limit?",
      "a": "You can convert up to 100 images at a time."
    },
    {
      "q": "Are files uploaded?",
      "a": "No. Conversion happens entirely in your browser."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="convert-image"
      title="Convert Image"
      lead="Convert images between JPG, PNG and WEBP in bulk, with quality and background options."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <ConvertImage />
    </ToolPageLayout>
  )
}
