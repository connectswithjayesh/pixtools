import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  // the tool used to live at /image
  async redirects() {
    return [{ source: "/image", destination: "/image-to-pdf", permanent: true }];
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
