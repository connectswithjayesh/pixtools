"use client"

/**
 * Maps each tool slug to its own file. Every tool is a separate chunk, loaded only on its page,
 * and rendered in the browser only (tools use files, canvas, workers and local storage).
 */
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

const Loading = () => (
  <div className="grid h-64 place-items-center rounded-xl border border-dashed bg-card/50" aria-busy="true">
    <Loader2 className="size-6 animate-spin text-muted-foreground" />
  </div>
)

const load = (fn: () => Promise<{ default: React.ComponentType }>) => dynamic(fn, { ssr: false, loading: Loading })

const TOOL_COMPONENTS: Record<string, React.ComponentType> = {
  "image-to-pdf": load(() => import("./image/ImageToPdf")),
  "image-optimizer": load(() => import("./image/ImageOptimizer")),
  "compress-image": load(() => import("./image/CompressImage")),
  "resize-image": load(() => import("./image/ResizeImage")),
  "convert-image": load(() => import("./image/ConvertImage")),
  "crop-image": load(() => import("./image/CropImage")),
  "rotate-image": load(() => import("./image/RotateImage")),
  "watermark-image": load(() => import("./image/WatermarkImage")),
  "image-to-base64": load(() => import("./image/ImageBase64")),
  "color-picker": load(() => import("./image/ColorPicker")),
  "meme-generator": load(() => import("./image/MemeGenerator")),
  "merge-pdf": load(() => import("./pdf/MergePdf")),
  "split-pdf": load(() => import("./pdf/SplitPdf")),
  "organize-pdf": load(() => import("./pdf/OrganizePdf")),
  "pdf-to-image": load(() => import("./pdf/PdfToImage")),
  "pdf-page-numbers": load(() => import("./pdf/PageNumbers")),
  "watermark-pdf": load(() => import("./pdf/WatermarkPdf")),
  "compress-pdf": load(() => import("./pdf/CompressPdf")),
  "sign-pdf": load(() => import("./pdf/SignPdf")),
  "protect-pdf": load(() => import("./pdf/ProtectPdf")),
  "unlock-pdf": load(() => import("./pdf/UnlockPdf")),
  "word-counter": load(() => import("./text/WordCounter")),
  "case-converter": load(() => import("./text/CaseConverter")),
  "character-counter": load(() => import("./text/CharacterCounter")),
  "remove-duplicate-lines": load(() => import("./text/RemoveDuplicateLines")),
  "sort-lines": load(() => import("./text/SortLines")),
  "remove-extra-spaces": load(() => import("./text/RemoveExtraSpaces")),
  "remove-line-breaks": load(() => import("./text/RemoveLineBreaks")),
  "lorem-ipsum-generator": load(() => import("./text/LoremIpsum")),
  "text-repeater": load(() => import("./text/TextRepeater")),
  "reverse-text": load(() => import("./text/ReverseText")),
  "find-and-replace": load(() => import("./text/FindReplace")),
  "text-cleaner": load(() => import("./text/TextCleaner")),
  "word-frequency": load(() => import("./text/WordFrequency")),
  "add-line-numbers": load(() => import("./text/AddLineNumbers")),
  "remove-emoji": load(() => import("./text/EmojiRemover")),
}

export function ToolLoader({ slug }: { slug: string }) {
  const Tool = TOOL_COMPONENTS[slug]
  return Tool ? <Tool /> : null
}
