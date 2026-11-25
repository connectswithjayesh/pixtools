import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import CropImage from "./CropImage"

export const metadata: Metadata = {
  title: "Crop Image Online – Free Photo Cropper",
  description: "Crop an image freely or to fixed ratios like 1:1, 4:3, 16:9 and 9:16, with exact pixel output.",
  alternates: { canonical: "/tools/crop-image" },
  openGraph: {
    title: "Crop Image Online – Free Photo Cropper",
    description: "Crop an image freely or to fixed ratios like 1:1, 4:3, 16:9 and 9:16, with exact pixel output.",
    url: "/tools/crop-image",
  },
}

const steps = [
    "Add an image",
    "Drag the crop box or pick a ratio",
    "Crop and download"
  ]

const intro = [
    "Crop Image lets you cut out exactly the part of a photo you want. Drag the crop box freely, lock it to a common ratio such as 1:1, 4:3, 16:9 or 9:16, or type the exact width, height and position in pixels.",
    "You can also rotate or flip the image before cropping, and make round profile pictures with transparent corners. The cropped image downloads instantly in the format you choose."
  ]

const features = [
    "Free crop or fixed ratios: 1:1, 4:3, 3:4, 16:9, 9:16, 3:2, 2:3",
    "Exact pixel inputs for width, height, X and Y",
    "Circle crop for avatars with transparent PNG/WEBP output",
    "Rotate left/right and flip before cropping",
    "Rule-of-thirds grid to help composition",
    "Save as original format, JPG, PNG or WEBP"
  ]

const uses = [
    "Make a square profile picture or round avatar",
    "Crop a screenshot to just the important part",
    "Prepare a 16:9 thumbnail or 9:16 story image",
    "Crop a scanned document to remove borders"
  ]

const faq: Faq[] = [
    {
      "q": "How do I crop an image to a square?",
      "a": "Click 1:1. The crop box keeps a perfect square while you move or resize it."
    },
    {
      "q": "Can I enter an exact crop size?",
      "a": "Yes. With the Free ratio selected, type the width, height and position in pixels under Exact crop."
    },
    {
      "q": "How do I make a round profile photo?",
      "a": "Turn on Circle crop and download as PNG or WEBP so the corners stay transparent."
    },
    {
      "q": "Does cropping reduce quality?",
      "a": "No. Cropping only removes pixels outside the box; the rest keeps its original quality (unless you choose a lower JPG quality)."
    },
    {
      "q": "Is my photo uploaded?",
      "a": "No. Cropping happens in your browser."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="crop-image"
      title="Crop Image"
      lead="Crop an image freely or to fixed ratios like 1:1, 4:3, 16:9 and 9:16, with exact pixel output."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <CropImage />
    </ToolPageLayout>
  )
}
