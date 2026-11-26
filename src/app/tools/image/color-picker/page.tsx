import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import ColorPicker from "./ColorPicker"

export const metadata: Metadata = {
  title: "Image Color Picker – Get HEX & RGB from Photo",
  description: "Click anywhere on an image to get HEX, RGB and HSL values, and extract its main color palette.",
  alternates: { canonical: "/tools/image/color-picker" },
  openGraph: {
    title: "Image Color Picker – Get HEX & RGB from Photo",
    description: "Click anywhere on an image to get HEX, RGB and HSL values, and extract its main color palette.",
    url: "/tools/image/color-picker",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "TechSutraHub" }],
  },
}

const steps = [
    "Add an image",
    "Click to pick colors",
    "Copy HEX, RGB or HSL"
  ]

const intro = [
    "Image Color Picker finds the exact colour of any pixel in a photo. Upload an image, hover with the magnifier and click to get the colour in HEX, RGB, HSL and CMYK, ready to copy.",
    "It also extracts the main colour palette of the image and suggests tints, shades and matching harmony colours — handy for designers, developers and anyone building a brand."
  ]

const features = [
    "Pixel-accurate magnifier loupe",
    "HEX, RGB, HSL and CMYK values with one-click copy",
    "Automatic palette of the image’s main colours",
    "Tints, shades, complementary, analogous and triadic colours",
    "Picked-colour history",
    "Screen eyedropper in Chrome and Edge"
  ]

const uses = [
    "Match a brand colour from a logo",
    "Build a website colour scheme from a photo",
    "Find the exact colour for CSS or design software",
    "Create a palette for social media posts"
  ]

const faq: Faq[] = [
    {
      "q": "How do I get the HEX code of a colour in an image?",
      "a": "Upload the image and click the spot you want. The HEX code appears on the right with a copy button."
    },
    {
      "q": "What is the difference between RGB and CMYK?",
      "a": "RGB is used for screens; CMYK is used for printing. The CMYK value here is a simple conversion and may differ slightly from professional print profiles."
    },
    {
      "q": "Can I pick colours outside the image?",
      "a": "In Chrome and Edge, the From screen button lets you pick a colour anywhere on your screen."
    },
    {
      "q": "Is my image uploaded?",
      "a": "No. Everything happens in your browser."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="color-picker"
      title="Image Color Picker"
      lead="Click anywhere on an image to get HEX, RGB and HSL values, and extract its main color palette."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <ColorPicker />
    </ToolPageLayout>
  )
}
