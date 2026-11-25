import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import ImageBase64 from "./ImageBase64"

export const metadata: Metadata = {
  title: "Image to Base64 Converter & Decoder",
  description: "Convert images to Base64 data URIs, CSS or HTML snippets, and decode Base64 back to an image.",
  alternates: { canonical: "/tools/image-to-base64" },
  openGraph: {
    title: "Image to Base64 Converter & Decoder",
    description: "Convert images to Base64 data URIs, CSS or HTML snippets, and decode Base64 back to an image.",
    url: "/tools/image-to-base64",
  },
}

const steps = [
    "Add an image or paste Base64",
    "Pick the output style",
    "Copy or download"
  ]

const intro = [
    "Image to Base64 converts a picture into a Base64 text string that you can paste directly into HTML, CSS, JSON or Markdown. It also works in reverse: paste a Base64 string or data URI and get the image back.",
    "Developers use Base64 to embed small icons and logos without an extra file request, to send images through APIs, or to debug data URIs."
  ]

const features = [
    "Output as data URI, raw Base64, CSS background, HTML img tag or Markdown",
    "One-click copy and save as .txt",
    "Base64 to image decoder with automatic format detection",
    "Handles URL-safe Base64 and missing padding",
    "Shows file size vs Base64 size"
  ]

const uses = [
    "Embed a small icon in a CSS file",
    "Include an image inside a JSON API request",
    "Inline images in an HTML email or single-file page",
    "Recover an image from a data URI found in code"
  ]

const faq: Faq[] = [
    {
      "q": "What is Base64?",
      "a": "Base64 is a way of writing binary data, such as an image, using only text characters so it can be placed inside code or text formats."
    },
    {
      "q": "Why is the Base64 string bigger than the image?",
      "a": "Base64 adds about 33% overhead. That’s why it’s best for small images like icons, not large photos."
    },
    {
      "q": "How do I turn Base64 back into an image?",
      "a": "Open the Base64 → Image tab and paste the string. The image appears and can be downloaded."
    },
    {
      "q": "Is my image uploaded?",
      "a": "No. Encoding and decoding happen in your browser."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="image-to-base64"
      title="Image to Base64"
      lead="Convert images to Base64 data URIs, CSS or HTML snippets, and decode Base64 back to an image."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <ImageBase64 />
    </ToolPageLayout>
  )
}
