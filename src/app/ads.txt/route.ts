import { SITE } from "@/lib/site"

/** /ads.txt for Google AdSense, generated from the publisher ID in src/lib/site.ts */
export function GET() {
  const pub = SITE.ads.client.replace(/^ca-/, "")
  const body = pub ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` : "# Set ads.client in src/lib/site.ts\n"
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } })
}
