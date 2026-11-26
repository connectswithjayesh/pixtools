import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import ImageOptimizer from "./ImageOptimizer"

export const metadata: Metadata = {
  title: "Image Optimizer – Compress to WebP, AVIF, MozJPEG",
  description: "Squeeze images with MozJPEG, WebP, AVIF, JPEG XL and OxiPNG. Compare two versions side by side with zoom, resize and reduce colours — all in your browser.",
  alternates: { canonical: "/tools/image/image-optimizer" },
  openGraph: {
    title: "Image Optimizer – Compress to WebP, AVIF, MozJPEG",
    description: "Squeeze images with MozJPEG, WebP, AVIF, JPEG XL and OxiPNG. Compare two versions side by side with zoom, resize and reduce colours — all in your browser.",
    url: "/tools/image/image-optimizer",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "TechSutraHub" }],
  },
}

const steps = [
    "Open an image",
    "Pick a format and tweak settings for each side",
    "Compare with the slider and download the best"
  ]

const intro = [
    "Image Optimizer is an advanced compressor for people who want the smallest possible file at a quality they choose. It shows two versions of your image side by side with a slider, so you can zoom in and judge the quality yourself before downloading.",
    "It uses the same open-source codecs found in professional tools — MozJPEG, WebP, AVIF, JPEG XL and OxiPNG — compiled to WebAssembly and run in a background worker in your browser. You get expert-level control without installing anything or uploading your photos."
  ]

const features = [
    "Split-screen comparison with zoom, pan, pinch and a draggable divider",
    "MozJPEG, WebP, AVIF, JPEG XL, OxiPNG, QOI and browser JPEG/WebP/PNG encoders",
    "Every codec's advanced settings: quality, effort, chroma subsampling, lossless modes and more",
    "High-quality resizing with Lanczos3, Mitchell, Catmull-Rom, Magic Kernel and hqx",
    "Reduce palette to 2–256 colours with adjustable dithering for tiny PNGs",
    "Live file size, percentage saved and encode time, with separate settings for each side"
  ]

const uses = [
    "Make website images load faster and improve Core Web Vitals",
    "Pick the best format (AVIF vs WebP vs JPEG) for a specific photo",
    "Shrink PNG logos and icons without visible loss",
    "Check compression artefacts at 400% zoom before publishing"
  ]

const faq: Faq[] = [
    {
      "q": "Which format gives the smallest file?",
      "a": "For photos, AVIF is usually smallest, followed by WebP and MozJPEG. For logos and graphics with few colours, OxiPNG with a reduced palette often wins. The side-by-side view lets you check for your own image."
    },
    {
      "q": "What is the difference between MozJPEG and Browser JPEG?",
      "a": "MozJPEG is a smarter JPEG encoder that produces noticeably smaller files at the same visual quality, while still creating a normal JPG that opens everywhere."
    },
    {
      "q": "Can everyone open AVIF and JPEG XL files?",
      "a": "AVIF is supported by all modern browsers. JPEG XL support is still limited, so use it only where you know it is supported; the tool decodes it for you to preview."
    },
    {
      "q": "Why is encoding slow for some formats?",
      "a": "AVIF and JPEG XL at high effort do a lot of work to find the smallest file. Lower the Effort slider for faster results."
    },
    {
      "q": "Are my images uploaded?",
      "a": "No. All encoding happens in your browser using WebAssembly. Your images never leave your device."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="image-optimizer"
      title="Image Optimizer"
      lead="Squeeze images with MozJPEG, WebP, AVIF, JPEG XL and OxiPNG. Compare two versions side by side with zoom, resize and reduce colours — all in your browser."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <ImageOptimizer />
    </ToolPageLayout>
  )
}
