import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  // old URLs → /tools/<slug>
  async redirects() {
    return [
      { source: "/image", destination: "/tools/image-to-pdf", permanent: true },
      // tools used to live at the site root (e.g. /merge-pdf)
      { source: "/:slug(image-to-pdf|image-optimizer|compress-image|resize-image|convert-image|crop-image|rotate-image|watermark-image|image-to-base64|color-picker|meme-generator|merge-pdf|split-pdf|organize-pdf|pdf-to-image|pdf-page-numbers|watermark-pdf|compress-pdf|sign-pdf|protect-pdf|unlock-pdf|word-counter|case-converter|character-counter|remove-duplicate-lines|sort-lines|remove-extra-spaces|remove-line-breaks|lorem-ipsum-generator|text-repeater|reverse-text|find-and-replace|text-cleaner|word-frequency|add-line-numbers|remove-emoji)", destination: "/tools/:slug", permanent: true },
    ];
  },
  allowedDevOrigins: ['192.168.1.11'],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // qpdf-wasm (Protect / Unlock PDF) is an Emscripten build that mentions Node's fs; give the browser an empty module
    resolveAlias: {
      fs: { browser: "./src/lib/empty-module.ts" },
    },
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
