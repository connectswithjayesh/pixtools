# PixTools

Free online image, PDF and text tools that run entirely in the browser — files are never uploaded.
Built with Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4 and shadcn/ui (`base-nova`, Base UI).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm start          # serve the production build
```

## Before you deploy — edit `src/lib/site.ts`

| Setting | What to put |
|---|---|
| `url` | Your live domain, e.g. `https://www.pixtools.in` (used by the sitemap, canonical URLs and policy pages) |
| `email`, `owner`, `jurisdiction` | Shown on Contact, Privacy Policy and Terms |
| `ads.client` | Your AdSense publisher ID, e.g. `ca-pub-1234567890123456`. Empty → grey "Ad space" placeholders |
| `ads.slots` | Ad unit IDs for `top`, `inContent`, `sidebar`, `bottom` |

`/ads.txt`, `/sitemap.xml` and `/robots.txt` are generated from these values.

## Pages

| URL | Page |
|---|---|
| `/` | Home: search, popular tools, every category |
| `/tools` | All tools |
| `/image-tools`, `/pdf-tools`, `/text-tools` | Category pages |
| `/tools/<tool-slug>` | One page per tool, e.g. `/tools/image-to-pdf`, `/tools/merge-pdf`, `/tools/word-counter` |
| `/about`, `/contact`, `/privacy-policy`, `/terms` | Pages AdSense expects |

Every tool page has: its own meta title and description, H1, ads (top, in-content, bottom), the tool, "how to use" steps,
about/features/uses content, FAQ, related tools, and JSON-LD (WebApplication, HowTo, BreadcrumbList, FAQPage).
Old root URLs such as `/merge-pdf` redirect permanently to `/tools/merge-pdf` (`next.config.ts`).

## Tools (36)

- **Image (11):** Image to PDF, Image Optimizer (Squoosh-style: MozJPEG, WebP, AVIF, JPEG XL, OxiPNG, QOI), Compress, Resize, Convert, Crop, Rotate & Flip, Watermark, Image to Base64, Color Picker, Meme Generator
- **PDF (10):** Merge, Split, Organize, PDF to Image, Page Numbers, Watermark, Compress, Sign, Protect (password), Unlock
- **Text (15):** Word Counter, Case Converter, Character Counter, Remove Duplicate Lines, Sort Lines, Remove Extra Spaces, Line Break Remover, Lorem Ipsum (Latin / मराठी / हिंदी), Text Repeater, Reverse Text, Find & Replace, Text Cleaner, Word Frequency, Add Line Numbers, Emoji Remover

## Project structure

```
src/
  app/
    page.tsx                      home
    tools/page.tsx                all tools
    tools/<slug>/page.tsx         one tool page (server): metadata, steps, intro, features, uses, FAQ
    tools/<slug>/<Tool>.tsx       the tool itself ("use client"): UI, logic and helpers in one file
    image-tools/ pdf-tools/ text-tools/   category pages
    about/ contact/ privacy-policy/ terms/, sitemap.ts, robots.ts, ads.txt/
  components/site/                header, footer, ad slot, tool card, tool page layout, category view, theme
  components/ui/                  shadcn/ui primitives (Base UI)
  lib/tools.ts                    tool & category list (names, short text, icons) for menus, cards and the sitemap
  lib/site.ts                     site settings and AdSense IDs
```

Example:

```
src/app/tools/pdf-to-image/
  page.tsx         ← metadata, content, FAQ (server component)
  PdfToImage.tsx   ← the tool (client component)
```

### Adding a tool

1. Create `src/app/tools/my-tool/MyTool.tsx` with `"use client"` and a default-exported component. Keep all its code in that file.
2. Create `src/app/tools/my-tool/page.tsx` (copy any other tool's page): set `metadata`, `steps`, `intro`, `features`, `uses`, `faq`,
   and render `<MyTool />` inside `<ToolPageLayout slug="my-tool" …>`.
3. Add an entry to `TOOLS` in `src/lib/tools.ts` (slug, name, short, description, category, icon) so it shows in menus, cards and the sitemap.

## Notes

- **WebAssembly:** PDF rendering (pdf.js), password protect/unlock (qpdf) and the Image Optimizer codecs (jSquash) run as WebAssembly in the browser.
  `next.config.ts` aliases Node's `fs` to an empty module for the browser build (qpdf mentions it but never uses it).
- **Single-thread codecs:** AVIF, JPEG XL and OxiPNG use their single-thread builds. The multi-thread builds need COOP/COEP headers, which would block AdSense.
- **Do not add COOP/COEP headers** — they break AdSense ads.
