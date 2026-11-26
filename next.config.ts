import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  // URL structure: /tools → /tools/<category> → /tools/<category>/<tool>. Old URLs redirect to it.
  async redirects() {
    return [
      { source: "/tool", destination: "/tools", permanent: true },
      { source: "/image", destination: "/tools/image/image-to-pdf", permanent: true },
      { source: "/image-tools", destination: "/tools/image", permanent: true },
      { source: "/pdf-tools", destination: "/tools/pdf", permanent: true },
      { source: "/text-tools", destination: "/tools/text", permanent: true },
      // image tools: old /<tool> and /tools/<tool> → /tools/image/<tool>
      { source: "/:slug(image-to-pdf|image-optimizer|compress-image|resize-image|convert-image|crop-image|rotate-image|watermark-image|image-to-base64|color-picker|meme-generator)", destination: "/tools/image/:slug", permanent: true },
      { source: "/tools/:slug(image-to-pdf|image-optimizer|compress-image|resize-image|convert-image|crop-image|rotate-image|watermark-image|image-to-base64|color-picker|meme-generator)", destination: "/tools/image/:slug", permanent: true },
      { source: "/tool/:slug(image-to-pdf|image-optimizer|compress-image|resize-image|convert-image|crop-image|rotate-image|watermark-image|image-to-base64|color-picker|meme-generator)", destination: "/tools/image/:slug", permanent: true },
      // pdf tools: old /<tool> and /tools/<tool> → /tools/pdf/<tool>
      { source: "/:slug(merge-pdf|split-pdf|organize-pdf|pdf-to-image|pdf-page-numbers|watermark-pdf|compress-pdf|sign-pdf|protect-pdf|unlock-pdf)", destination: "/tools/pdf/:slug", permanent: true },
      { source: "/tools/:slug(merge-pdf|split-pdf|organize-pdf|pdf-to-image|pdf-page-numbers|watermark-pdf|compress-pdf|sign-pdf|protect-pdf|unlock-pdf)", destination: "/tools/pdf/:slug", permanent: true },
      { source: "/tool/:slug(merge-pdf|split-pdf|organize-pdf|pdf-to-image|pdf-page-numbers|watermark-pdf|compress-pdf|sign-pdf|protect-pdf|unlock-pdf)", destination: "/tools/pdf/:slug", permanent: true },
      // text tools: old /<tool> and /tools/<tool> → /tools/text/<tool>
      { source: "/:slug(word-counter|case-converter|character-counter|remove-duplicate-lines|sort-lines|remove-extra-spaces|remove-line-breaks|lorem-ipsum-generator|text-repeater|reverse-text|find-and-replace|text-cleaner|word-frequency|add-line-numbers|remove-emoji)", destination: "/tools/text/:slug", permanent: true },
      { source: "/tools/:slug(word-counter|case-converter|character-counter|remove-duplicate-lines|sort-lines|remove-extra-spaces|remove-line-breaks|lorem-ipsum-generator|text-repeater|reverse-text|find-and-replace|text-cleaner|word-frequency|add-line-numbers|remove-emoji)", destination: "/tools/text/:slug", permanent: true },
      { source: "/tool/:slug(word-counter|case-converter|character-counter|remove-duplicate-lines|sort-lines|remove-extra-spaces|remove-line-breaks|lorem-ipsum-generator|text-repeater|reverse-text|find-and-replace|text-cleaner|word-frequency|add-line-numbers|remove-emoji)", destination: "/tools/text/:slug", permanent: true },
      { source: "/tool/:path*", destination: "/tools/:path*", permanent: true },
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
