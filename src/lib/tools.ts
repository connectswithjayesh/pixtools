/**
 * Tool catalogue: names, text and icons for every tool and category.
 * The tool code itself lives in src/tools/<category>/<Tool>.tsx (one self-contained file per tool),
 * and src/tools/loader.tsx maps each slug to its file.
 */
import {
  ALargeSmall, ArrowDownAZ, Binary, CaseSensitive, ChartColumn, CopyMinus, Crop, Droplets, Eraser, FileImage, FileOutput, FileStack, FileText, Gauge, Hash, ImageDown, Laugh, Layers, LetterText, ListOrdered, Lock, LockOpen, Maximize2, Minimize2, PenLine, Pipette, RefreshCw, Repeat, Replace, RotateCw, Scissors, Smile, Space, SquareSplitVertical, Stamp, Undo2, Files, ImageIcon, Type,
  type LucideIcon,
} from "lucide-react"

export type Category = "image" | "pdf" | "text"

export interface CategoryInfo {
  key: Category
  slug: string
  name: string
  blurb: string
  description: string
  icon: LucideIcon
}

export interface Tool {
  slug: string
  name: string
  short: string
  description: string
  category: Category
  icon: LucideIcon
  steps: [string, string, string]
}

export const CATEGORIES: Record<Category, CategoryInfo> = {
  image: {
    key: "image", slug: "image-tools", name: "Image Tools", icon: ImageIcon,
    blurb: "Compress, resize, convert, crop and edit images.",
    description: "Free online image tools: compress JPG and PNG, resize for social media, convert to WEBP or AVIF, crop, rotate, add watermarks and more — right in your browser.",
  },
  pdf: {
    key: "pdf", slug: "pdf-tools", name: "PDF Tools", icon: Files,
    blurb: "Merge, split, organize and edit PDF files.",
    description: "Free online PDF tools: merge and split PDFs, reorder pages, convert PDF to images, add page numbers and watermarks, sign, compress and password-protect — without uploading your files.",
  },
  text: {
    key: "text", slug: "text-tools", name: "Text Tools", icon: Type,
    blurb: "Count, convert, clean and format text — English, मराठी and हिंदी.",
    description: "Free online text tools: word and character counter, case converter, remove duplicate lines, sort lines, find and replace, text cleaner, keyword density and more. Works with Marathi and Hindi.",
  },
}

export const TOOLS: Tool[] = [
  {
    slug: "image-to-pdf", name: "Image to PDF", category: "image", icon: FileImage,
    short: "Turn JPG, PNG & more into one PDF.",
    description: "Arrange images on a drag-and-drop board, rotate them, choose page size and margins, and download a PDF.",
    steps: ["Add your images", "Reorder on the board and pick page settings", "Convert and download the PDF"],
  },
  {
    slug: "image-optimizer", name: "Image Optimizer", category: "image", icon: Gauge,
    short: "Compare codecs side by side, like Squoosh.",
    description: "Squeeze images with MozJPEG, WebP, AVIF, JPEG XL and OxiPNG. Compare two versions side by side with zoom, resize and reduce colours — all in your browser.",
    steps: ["Open an image", "Pick a format and tweak settings for each side", "Compare with the slider and download the best"],
  },
  {
    slug: "compress-image", name: "Compress Image", category: "image", icon: ImageDown,
    short: "Shrink JPG, PNG & WEBP file size.",
    description: "Reduce image file size by quality or to an exact target size in KB, with batch support.",
    steps: ["Add one or more images", "Pick a quality or a target size", "Compress and download"],
  },
  {
    slug: "resize-image", name: "Resize Image", category: "image", icon: Maximize2,
    short: "Change width & height in pixels or %.",
    description: "Resize images by exact pixels or percentage, keep the aspect ratio, or use social-media presets.",
    steps: ["Add images", "Enter new size, percentage or a preset", "Resize and download"],
  },
  {
    slug: "convert-image", name: "Convert Image", category: "image", icon: RefreshCw,
    short: "JPG ↔ PNG ↔ WEBP converter.",
    description: "Convert images between JPG, PNG and WEBP in bulk, with quality and background options.",
    steps: ["Add images in any format", "Choose the output format", "Convert and download"],
  },
  {
    slug: "crop-image", name: "Crop Image", category: "image", icon: Crop,
    short: "Crop to any size or aspect ratio.",
    description: "Crop an image freely or to fixed ratios like 1:1, 4:3, 16:9 and 9:16, with exact pixel output.",
    steps: ["Add an image", "Drag the crop box or pick a ratio", "Crop and download"],
  },
  {
    slug: "rotate-image", name: "Rotate & Flip Image", category: "image", icon: RotateCw,
    short: "Rotate by 90° or any angle, flip.",
    description: "Rotate images left, right or by any angle, and flip horizontally or vertically — one or many at once.",
    steps: ["Add images", "Rotate or flip each one, or all together", "Save and download"],
  },
  {
    slug: "watermark-image", name: "Watermark Image", category: "image", icon: Stamp,
    short: "Add text or logo watermark.",
    description: "Stamp text or your logo on images with position, size, opacity, rotation and tiling controls.",
    steps: ["Add images", "Set your text or logo and its style", "Apply and download"],
  },
  {
    slug: "image-to-base64", name: "Image to Base64", category: "image", icon: Binary,
    short: "Encode images to Base64 & back.",
    description: "Convert images to Base64 data URIs, CSS or HTML snippets, and decode Base64 back to an image.",
    steps: ["Add an image or paste Base64", "Pick the output style", "Copy or download"],
  },
  {
    slug: "color-picker", name: "Image Color Picker", category: "image", icon: Pipette,
    short: "Pick colors & palette from a photo.",
    description: "Click anywhere on an image to get HEX, RGB and HSL values, and extract its main color palette.",
    steps: ["Add an image", "Click to pick colors", "Copy HEX, RGB or HSL"],
  },
  {
    slug: "meme-generator", name: "Meme Generator", category: "image", icon: Laugh,
    short: "Add top & bottom text to images.",
    description: "Add classic meme text or custom captions to any image, with font, color, outline and position controls.",
    steps: ["Add an image", "Type your text and style it", "Download the meme"],
  },
  {
    slug: "merge-pdf", name: "Merge PDF", category: "pdf", icon: Layers,
    short: "Combine PDFs into one file.",
    description: "Combine multiple PDF files into one. Drag to set the order before merging.",
    steps: ["Add two or more PDFs", "Drag to set the order", "Merge and download"],
  },
  {
    slug: "split-pdf", name: "Split PDF", category: "pdf", icon: Scissors,
    short: "Extract pages or split by range.",
    description: "Extract selected pages, split by custom ranges, every N pages, or into single pages.",
    steps: ["Add a PDF", "Choose pages or ranges", "Split and download"],
  },
  {
    slug: "organize-pdf", name: "Organize PDF", category: "pdf", icon: FileStack,
    short: "Reorder, rotate & delete pages.",
    description: "Rearrange pages on a drag-and-drop board, rotate, duplicate or delete pages, and add pages from other PDFs.",
    steps: ["Add a PDF", "Drag, rotate or delete pages", "Save the new PDF"],
  },
  {
    slug: "pdf-to-image", name: "PDF to Image", category: "pdf", icon: FileOutput,
    short: "Convert pages to JPG or PNG.",
    description: "Turn every PDF page, or the pages you choose, into high-quality JPG or PNG images.",
    steps: ["Add a PDF", "Pick format, quality and pages", "Convert and download"],
  },
  {
    slug: "pdf-page-numbers", name: "Add Page Numbers", category: "pdf", icon: Hash,
    short: "Number the pages of a PDF.",
    description: "Add page numbers to a PDF with position, format, starting number, font size and color options.",
    steps: ["Add a PDF", "Choose position and format", "Apply and download"],
  },
  {
    slug: "watermark-pdf", name: "Watermark PDF", category: "pdf", icon: Droplets,
    short: "Stamp text over PDF pages.",
    description: "Add a text watermark to all or selected PDF pages with opacity, angle, size, color and tiling.",
    steps: ["Add a PDF", "Type the watermark and style it", "Apply and download"],
  },
  {
    slug: "compress-pdf", name: "Compress PDF", category: "pdf", icon: Minimize2,
    short: "Reduce PDF file size.",
    description: "Shrink PDF files for email, WhatsApp and upload forms — lossless optimisation or strong image compression.",
    steps: ["Add a PDF", "Pick a compression level", "Compress and download"],
  },
  {
    slug: "sign-pdf", name: "Sign PDF", category: "pdf", icon: PenLine,
    short: "Draw, type or upload a signature.",
    description: "Sign PDF documents online: draw, type or upload your signature, add the date, and place them anywhere on any page.",
    steps: ["Add a PDF", "Create your signature and drag it into place", "Save the signed PDF"],
  },
  {
    slug: "protect-pdf", name: "Protect PDF", category: "pdf", icon: Lock,
    short: "Add a password to a PDF.",
    description: "Encrypt a PDF with AES-256 password protection and control printing, copying and editing permissions.",
    steps: ["Add a PDF", "Set a password and permissions", "Download the protected PDF"],
  },
  {
    slug: "unlock-pdf", name: "Unlock PDF", category: "pdf", icon: LockOpen,
    short: "Remove a PDF password.",
    description: "Remove the password and printing/copying restrictions from a PDF you own.",
    steps: ["Add the protected PDF", "Enter its password", "Download the unlocked PDF"],
  },
  {
    slug: "word-counter", name: "Word Counter", category: "text", icon: LetterText,
    short: "Count words, characters & reading time.",
    description: "Count words, characters, sentences and paragraphs as you type, with reading time, speaking time and top keywords. Works with Marathi and Hindi.",
    steps: ["Type or paste your text", "See live counts and keyword stats", "Copy or keep editing"],
  },
  {
    slug: "case-converter", name: "Case Converter", category: "text", icon: CaseSensitive,
    short: "UPPER, lower, Title, camelCase & more.",
    description: "Change text to UPPER CASE, lower case, Title Case, Sentence case, camelCase, snake_case, kebab-case and more in one click.",
    steps: ["Paste your text", "Pick a case style", "Copy or download the result"],
  },
  {
    slug: "character-counter", name: "Character Counter", category: "text", icon: ALargeSmall,
    short: "Character limits for X, SEO, SMS & more.",
    description: "Count characters with and without spaces and check limits for X (Twitter), meta titles, Instagram, YouTube and SMS.",
    steps: ["Type or paste your text", "Check the limit bars for each platform", "Trim and copy if it's too long"],
  },
  {
    slug: "remove-duplicate-lines", name: "Remove Duplicate Lines", category: "text", icon: CopyMinus,
    short: "Delete repeated lines from a list.",
    description: "Remove duplicate lines from lists, keep the first or last copy, ignore case or spaces, or show only the duplicated lines.",
    steps: ["Paste your list", "Choose how duplicates are matched", "Copy the unique lines"],
  },
  {
    slug: "sort-lines", name: "Sort Lines", category: "text", icon: ArrowDownAZ,
    short: "Sort A–Z, by number, length or shuffle.",
    description: "Sort lines alphabetically, naturally, by number, length or word count, in any order — or shuffle them randomly.",
    steps: ["Paste your lines", "Choose how to sort", "Copy the sorted list"],
  },
  {
    slug: "remove-extra-spaces", name: "Remove Extra Spaces", category: "text", icon: Space,
    short: "Fix double spaces, tabs & empty lines.",
    description: "Remove extra spaces, tabs and blank lines, trim every line and fix spacing around punctuation.",
    steps: ["Paste your text", "Pick what to clean", "Copy the tidy text"],
  },
  {
    slug: "remove-line-breaks", name: "Line Break Remover", category: "text", icon: SquareSplitVertical,
    short: "Join lines copied from PDFs.",
    description: "Remove line breaks from text copied from PDFs and emails, keep paragraphs, and fix words split with hyphens.",
    steps: ["Paste your text", "Choose to keep paragraphs or remove all breaks", "Copy the joined text"],
  },
  {
    slug: "lorem-ipsum-generator", name: "Lorem Ipsum Generator", category: "text", icon: FileText,
    short: "Dummy text in Latin, Marathi or Hindi.",
    description: "Generate Lorem Ipsum placeholder paragraphs, sentences, words or lists — plus Marathi and Hindi dummy text, with optional HTML tags.",
    steps: ["Choose paragraphs, sentences, words or a list", "Pick the language and amount", "Copy the dummy text"],
  },
  {
    slug: "text-repeater", name: "Text Repeater", category: "text", icon: Repeat,
    short: "Repeat text many times instantly.",
    description: "Repeat any word or message up to 1,00,000 times with new lines, spaces, commas or a custom separator, and optional numbering.",
    steps: ["Type the text to repeat", "Set how many times and the separator", "Copy the result"],
  },
  {
    slug: "reverse-text", name: "Reverse Text", category: "text", icon: Undo2,
    short: "Reverse letters, words or lines.",
    description: "Reverse text backwards, reverse word order, reverse each word, flip line order or make upside-down text.",
    steps: ["Paste your text", "Pick a reverse style", "Copy the result"],
  },
  {
    slug: "find-and-replace", name: "Find & Replace", category: "text", icon: Replace,
    short: "Replace words with match case & regex.",
    description: "Find and replace text with match case, whole words and regular expressions, and see every match highlighted.",
    steps: ["Paste your text", "Type what to find and what to replace it with", "Copy the updated text"],
  },
  {
    slug: "text-cleaner", name: "Text Cleaner", category: "text", icon: Eraser,
    short: "Strip HTML, links, symbols & more.",
    description: "Clean messy text: strip HTML tags, decode entities, remove links, emails, emoji, numbers, special characters and invisible characters.",
    steps: ["Paste your messy text", "Tick what to remove", "Copy the clean text"],
  },
  {
    slug: "word-frequency", name: "Word Frequency Counter", category: "text", icon: ChartColumn,
    short: "Keyword density & phrase counts.",
    description: "Find the most used words and 2–3 word phrases with count and keyword density, skip common words, and export to CSV.",
    steps: ["Paste your article", "Pick words or phrases", "Read the table or export CSV"],
  },
  {
    slug: "add-line-numbers", name: "Add Line Numbers", category: "text", icon: ListOrdered,
    short: "Number every line, or remove numbers.",
    description: "Add line numbers in any format — 1. 1) [1] 01 — with a custom start and step, or remove existing line numbers.",
    steps: ["Paste your lines", "Pick a number format", "Copy the numbered text"],
  },
  {
    slug: "remove-emoji", name: "Emoji Remover", category: "text", icon: Smile,
    short: "Delete all emoji from text.",
    description: "Remove every emoji from text, including flags, skin tones and family emoji, while keeping Marathi, Hindi and normal symbols.",
    steps: ["Paste your text", "Choose what to replace emoji with", "Copy the clean text"],
  },
]

export const toolBySlug = (slug: string) => TOOLS.find((t) => t.slug === slug)
export const toolsIn = (c: Category) => TOOLS.filter((t) => t.category === c)
export const categoryBySlug = (slug: string) => Object.values(CATEGORIES).find((c) => c.slug === slug)
