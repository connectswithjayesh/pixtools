import type { Metadata } from "next";
import ImageToPdf from "./component";

export const metadata: Metadata = {
  title: "Image to PDF Converter – JPG, PNG to PDF Online Free",
  description:
    "Convert JPG, PNG, WEBP and other images to PDF in your browser. Reorder pages, rotate, set page size and margins, add page numbers or a watermark. No upload.",
};

export default function ImageToPdfPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Image to PDF</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Turn JPG, PNG and other images into one PDF. Drag to reorder, rotate, and pick page size and margins — all in your browser.
        </p>
      </header>
      <ImageToPdf />
    </section>
  );
}
