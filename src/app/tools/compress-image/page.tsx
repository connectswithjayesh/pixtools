import type { Metadata } from "next"
import { ToolPageLayout, type Faq } from "@/components/site/tool-page-layout"
import CompressImage from "./CompressImage"

export const metadata: Metadata = {
  title: "Compress Image – Reduce JPG & PNG Size in KB",
  description: "Reduce image file size by quality or to an exact target size in KB, with batch support.",
  alternates: { canonical: "/tools/compress-image" },
  openGraph: {
    title: "Compress Image – Reduce JPG & PNG Size in KB",
    description: "Reduce image file size by quality or to an exact target size in KB, with batch support.",
    url: "/tools/compress-image",
  },
}

const steps = [
    "Add one or more images",
    "Pick a quality or a target size",
    "Compress and download"
  ]

const intro = [
    "Compress Image reduces the file size of JPG, PNG and WEBP pictures so they upload faster, fit within size limits and take less space on your phone. Compress one photo or a whole batch at once and download them together as a ZIP file.",
    "You can compress by quality, or set an exact target such as 100 KB and let the tool find the best quality that fits. This is especially useful for online forms that reject files above a certain size."
  ]

const features = [
    "Batch compression with a single ZIP download",
    "Quality mode or exact target size in KB (50 KB, 100 KB, 200 KB and more)",
    "Smart format choice: keeps JPG as JPG and turns PNG into transparent WEBP",
    "Optional maximum width/height to shrink very large photos",
    "Never-bigger option keeps the original if compression wouldn’t help",
    "Before/after compare slider for every image"
  ]

const uses = [
    "Reduce a photo to under 100 KB or 200 KB for a government or job application",
    "Send many photos by email or WhatsApp without hitting size limits",
    "Speed up a website or blog by shrinking images",
    "Free up storage by compressing old photos"
  ]

const faq: Faq[] = [
    {
      "q": "How do I compress an image to exactly 100 KB?",
      "a": "Choose Target size, click 100 KB and press Compress. The tool tries different quality levels and, if needed, slightly reduces the dimensions until the file fits."
    },
    {
      "q": "Will compression reduce the quality?",
      "a": "Some detail is removed, but at 70–80% quality most photos look the same to the eye. Use the Compare button to check before downloading."
    },
    {
      "q": "Can I compress PNG files?",
      "a": "Yes. With the Best format option, PNGs are converted to WEBP, which keeps transparency and is usually much smaller. For PNG output specifically, try the Image Optimizer with OxiPNG."
    },
    {
      "q": "Is there a limit on the number of images?",
      "a": "You can compress up to 100 images in one go."
    },
    {
      "q": "Are my photos safe?",
      "a": "Yes. Compression happens in your browser and nothing is uploaded to any server."
    }
  ]

export default function Page() {
  return (
    <ToolPageLayout
      slug="compress-image"
      title="Compress Image"
      lead="Reduce image file size by quality or to an exact target size in KB, with batch support."
      steps={steps}
      intro={intro}
      features={features}
      uses={uses}
      faq={faq}
    >
      <CompressImage />
    </ToolPageLayout>
  )
}
