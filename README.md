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
| `/<tool-slug>` | One page per tool, e.g. `/image-to-pdf`, `/merge-pdf`, `/word-counter` |
| `/about`, `/contact`, `/privacy-policy`, `/terms` | Pages AdSense expects |

Every tool page has: H1 and description, ads (top, in-content, bottom), the tool, "how to use" steps, FAQ, related tools,
and JSON-LD (WebApplication, BreadcrumbList, FAQPage). Unknown URLs return a real 404 (`src/proxy.ts`).

## Tools (36)

- **Image (11):** Image to PDF, Image Optimizer (Squoosh-style: MozJPEG, WebP, AVIF, JPEG XL, OxiPNG, QOI), Compress, Resize, Convert, Crop, Rotate & Flip, Watermark, Image to Base64, Color Picker, Meme Generator
- **PDF (10):** Merge, Split, Organize, PDF to Image, Page Numbers, Watermark, Compress, Sign, Protect (password), Unlock
- **Text (15):** Word Counter, Case Converter, Character Counter, Remove Duplicate Lines, Sort Lines, Remove Extra Spaces, Line Break Remover, Lorem Ipsum (Latin / मराठी / हिंदी), Text Repeater, Reverse Text, Find & Replace, Text Cleaner, Word Frequency, Add Line Numbers, Emoji Remover

## Project structure

```
src/
  app/                   routes: home, /tools, [slug] (categories + tools), legal pages, sitemap, robots, ads.txt
  components/site/       header, footer, ad slot, tool card, home search, theme
  components/ui/         shadcn/ui primitives (Base UI)
  lib/tools.ts           tool & category catalogue (names, text, icons, steps)
  lib/site.ts            site settings and AdSense IDs
  tools/<category>/X.tsx one file per tool — UI, logic and helpers all inside that file
  tools/loader.tsx       slug → tool file (each tool is its own chunk, loaded only on its page)
  proxy.ts               404 for unknown URLs
```

### Adding a tool

1. Create `src/tools/<category>/MyTool.tsx` with `"use client"` and a default-exported component. Keep all its code in that file.
2. Add an entry to `TOOLS` in `src/lib/tools.ts` (slug, name, short, description, category, icon, steps).
3. Add the slug to `TOOL_COMPONENTS` in `src/tools/loader.tsx`.

The page, sitemap entry, menus and 404 handling pick it up automatically.

## Notes

- **WebAssembly:** PDF rendering (pdf.js), password protect/unlock (qpdf) and the Image Optimizer codecs (jSquash) run as WebAssembly in the browser.
  `next.config.ts` aliases Node's `fs` to an empty module for the browser build (qpdf mentions it but never uses it).
- **Single-thread codecs:** AVIF, JPEG XL and OxiPNG use their single-thread builds. The multi-thread builds need COOP/COEP headers, which would block AdSense.
- **Do not add COOP/COEP headers** — they break AdSense ads.
