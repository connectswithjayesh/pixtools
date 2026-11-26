import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/site/theme-provider";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { AdSlot } from "@/components/site/ad-slot";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} – Free Image, PDF & Text Tools Online`, template: `%s | ${SITE.name}` },
  description: "Free online image, PDF and text tools that run in your browser: compress, convert, merge, split, count words and more. No upload, no sign-up.",
  applicationName: SITE.name,
  openGraph: { siteName: SITE.name, type: "website", images: [{ url: "/og.png", width: 1200, height: 630, alt: "TechSutraHub" }] },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4338CA" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1020" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const { enabled, client } = SITE.ads;
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="flex min-h-screen flex-col font-sans">
        <ThemeProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:py-8">{children}</main>
          <div className="mx-auto w-full max-w-7xl px-4 pb-8"><AdSlot placement="bottom" /></div>
          <SiteFooter />
          <Toaster richColors position="top-center" />
        </ThemeProvider>
        {enabled && client && (
          <Script
            id="adsbygoogle"
            async
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
          />
        )}
      </body>
    </html>
  );
}
