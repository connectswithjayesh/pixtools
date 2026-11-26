import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import MemeGenerator from "./MemeGenerator"

export const metadata: Metadata = {
  title: "Meme Generator – Add Text to Images Free",
  description: "Add classic meme text or custom captions to any image, with font, color, outline and position controls.",
  alternates: { canonical: "/tools/meme-generator" },
  openGraph: {
    title: "Meme Generator – Add Text to Images Free",
    description: "Add classic meme text or custom captions to any image, with font, color, outline and position controls.",
    url: "/tools/meme-generator",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "TechSutraHub" }],
  },
}

const steps = [
    "Add an image",
    "Type your text and style it",
    "Download the meme"
  ]

const intro = [
    "Meme Generator adds bold captions to any image. Use the classic style with top and bottom text in white with a black outline, or the modern caption-bar style with text above the picture.",
    "Add extra movable text boxes, change the font, size and colours, and download a high-quality JPG or PNG ready for WhatsApp, Instagram or X."
  ]

const features = [
    "Classic top/bottom text and caption-bar styles",
    "Extra text boxes you can place by clicking on the image",
    "Impact, Arial Black, serif and comic fonts",
    "Text colour, outline colour and outline width",
    "Automatic line wrapping and ALL CAPS option",
    "High-resolution JPG or PNG download"
  ]

const uses = [
    "Make memes from your own photos",
    "Create funny captions for group chats",
    "Add titles to images for social posts",
    "Make reaction images"
  ]

const faq: Faq[] = [
    {
      "q": "How do I add more than two lines of text?",
      "a": "Click Add text box, type your text and click on the image to place it. You can add as many boxes as you like."
    },
    {
      "q": "Which font is used in classic memes?",
      "a": "Impact with a white fill and black outline. It’s the default here."
    },
    {
      "q": "Is there a watermark on my meme?",
      "a": "No. Downloads are clean, with no watermark."
    },
    {
      "q": "Is my image uploaded?",
      "a": "No. Memes are created in your browser."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="meme-generator"
      title="Meme Generator"
      lead="Add classic meme text or custom captions to any image, with font, color, outline and position controls."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <MemeGenerator />
    </ToolPageLayout>
  )
}
