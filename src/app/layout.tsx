import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: { default: "PixTools – Free Image & PDF Tools", template: "%s | PixTools" },
  description: "Free online image and PDF tools that run in your browser. No upload, no sign-up.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#7e22ce" },
    { media: "(prefers-color-scheme: dark)", color: "#120f1a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="min-h-screen font-sans">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
