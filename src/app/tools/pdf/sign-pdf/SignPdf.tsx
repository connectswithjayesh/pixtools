"use client"
/**
 * Sign PDF — the whole tool in one file (UI, logic and helpers). Runs entirely in the browser.
 */
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { CalendarDays, ChevronLeft, ChevronRight, ClipboardPaste, Copy, Download, Eraser, FileUp, Loader2, PenLine, Plus, Save, ShieldCheck, Type, Upload, X, SlidersHorizontal } from "lucide-react"
import { PDFDocument, degrees, type PDFPage } from "pdf-lib"
import type { PDFDocumentProxy } from "pdfjs-dist"
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import { toast } from "sonner"

/* ─── helpers (from components/common/FileDrop.tsx) ─── */
interface Props {
  accept: string
  multiple?: boolean
  onFiles: (files: File[]) => void
  title?: string
  hint?: string
  compact?: boolean
  /** listen for Ctrl/⌘+V image paste */
  paste?: boolean
  className?: string
}

function FileDrop({ accept, multiple = true, onFiles, title, hint, compact, paste, className }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const cb = useRef(onFiles)
  useEffect(() => { cb.current = onFiles })

  useEffect(() => {
    if (!paste) return
    const h = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? [])
      if (files.length) { e.preventDefault(); cb.current(multiple ? files : files.slice(0, 1)) }
    }
    window.addEventListener("paste", h)
    return () => window.removeEventListener("paste", h)
  }, [paste, multiple])

  const take = (list: FileList | null) => {
    const files = Array.from(list ?? [])
    if (files.length) onFiles(multiple ? files : files.slice(0, 1))
  }

  const isPdf = accept.includes("pdf")

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files) }}
      onClick={compact ? () => input.current?.click() : undefined}
      className={cn(
        "rounded-xl border-2 border-dashed transition-colors",
        over ? "border-primary bg-accent" : "border-border bg-card hover:border-primary/50",
        compact ? "flex cursor-pointer items-center justify-center gap-2 p-4 text-sm font-medium text-muted-foreground" : "px-6 py-14 text-center",
        className
      )}
    >
      <input ref={input} type="file" accept={accept} multiple={multiple} className="hidden" onChange={(e) => { take(e.target.files); e.target.value = "" }} />
      {compact ? (
        <><Plus className="size-4" /> {title ?? "Add more files"}</>
      ) : (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4">
          <div className="grid size-16 place-items-center rounded-2xl bg-accent text-primary"><Upload className="size-8" /></div>
          <div>
            <h2 className="text-xl font-semibold">{title ?? `Drop ${isPdf ? "PDF" : "image"}${multiple ? "s" : ""} here`}</h2>
            {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
          </div>
          <Button size="lg" onClick={() => input.current?.click()}>
            <Upload /> Select {isPdf ? "PDF" : "image"}{multiple ? "s" : ""}
          </Button>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {paste && <span className="inline-flex items-center gap-1"><ClipboardPaste className="size-3.5" /> Ctrl / ⌘ + V to paste</span>}
            <span className="inline-flex items-center gap-1"><ShieldCheck className="size-3.5" /> Files never leave your device</span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── helpers (from components/common/form.tsx) ─── */
function Field({ label, hint, children, className }: { label: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label>{label}</Label>
        {hint !== undefined && <span className="text-xs text-muted-foreground tabular-nums">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Segmented<T extends string>({ value, onChange, options, className }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode }[]; className?: string
}) {
  return (
    <div className={cn("grid gap-1 rounded-lg bg-muted p-1", className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }}>
      {options.map((o) => (
        <button
          key={o.value} type="button" onClick={() => onChange(o.value)}
          className={cn(
            "flex cursor-pointer items-center justify-center gap-1 rounded-md px-1 py-1.5 text-xs font-medium transition-all",
            value === o.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function SwitchRow({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}

function SliderField({ label, value, onChange, min, max, step = 1, suffix = "" }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; suffix?: string
}) {
  return (
    <Field label={label} hint={`${value}${suffix}`}>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : (v as number))} />
    </Field>
  )
}

function ColorField({ label, value, onChange, swatches = ["#ffffff", "#000000", "#ef4444", "#f59e0b", "#22c55e", "#3b82f6"] }: {
  label: string; value: string; onChange: (v: string) => void; swatches?: string[]
}) {
  return (
    <Field label={label} hint={value}>
      <div className="flex flex-wrap items-center gap-2">
        {swatches.map((c) => (
          <button
            key={c} type="button" aria-label={c} onClick={() => onChange(c)}
            className={cn("size-7 cursor-pointer rounded-md border shadow-xs", value.toLowerCase() === c && "ring-2 ring-primary ring-offset-2 ring-offset-background")}
            style={{ background: c }}
          />
        ))}
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-7 w-9 cursor-pointer rounded-md border bg-transparent p-0.5" aria-label={`${label} custom`} />
      </div>
    </Field>
  )
}

/**
 * Tool layout.
 * Desktop: a full-width workspace that fills the screen — the view on the left (scrolls on its own) and a
 * settings panel on the right with a fixed heading, scrolling settings and the actions fixed at the bottom.
 * Phone/tablet: the actions sit in a bar fixed to the bottom of the screen, and the settings open in a
 * bottom sheet (mobile="sheet") or stay below the view (mobile="inline").
 */
function ToolGrid({ title, main, side, action, mobile = "sheet", settingsLabel = "Settings" }: {
  title: string; main: React.ReactNode; side: React.ReactNode; action?: React.ReactNode; mobile?: "sheet" | "inline"; settingsLabel?: string
}) {
  const desktop = useSyncExternalStore(
    (cb) => { const m = window.matchMedia("(min-width: 1024px)"); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb) },
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => true,
  )
  const [open, setOpen] = useState(false)
  const workspace = useRef<HTMLDivElement>(null)
  const sheet = !desktop && mobile === "sheet"
  const bar = !desktop && (sheet || !!action)

  // desktop: span the whole window width and fill the screen below the page heading
  useEffect(() => {
    if (!desktop) return
    const fit = () => {
      const root = document.documentElement
      root.style.setProperty("--sbw", `${window.innerWidth - root.clientWidth}px`)
      const el = workspace.current
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY
      el.style.height = `${Math.max(480, window.innerHeight - Math.min(top, 220) - 16)}px`
    }
    fit()
    window.addEventListener("resize", fit)
    return () => window.removeEventListener("resize", fit)
  }, [desktop])
  // phone: keep the end of the page clear of the fixed bar
  useEffect(() => {
    if (!bar) return
    const prev = document.body.style.paddingBottom
    document.body.style.paddingBottom = "calc(5.5rem + env(safe-area-inset-bottom))"
    return () => { document.body.style.paddingBottom = prev }
  }, [bar])
  // open sheet: Escape closes it, the page behind doesn't scroll
  useEffect(() => {
    if (!open || !sheet) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    const prev = document.body.style.overflow
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev }
  }, [open, sheet])

  if (desktop) {
    return (
      <div ref={workspace}
        // full window width without a transform (a transformed parent would break fixed-position drag previews)
        style={{ width: "calc(100vw - var(--sbw, 0px))", marginLeft: "calc(50% - (100vw - var(--sbw, 0px)) / 2)" }}
        className="grid h-[calc(100dvh-4.5rem)] grid-cols-[minmax(0,1fr)_400px] border-y bg-muted/40 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="min-w-0 overflow-y-auto overscroll-contain p-6 xl:p-8">
          <div className="mx-auto max-w-5xl space-y-4">{main}</div>
        </div>
        <aside aria-label={`${title} ${settingsLabel.toLowerCase()}`} className="flex min-h-0 flex-col border-l bg-background">
          <div className="shrink-0 border-b px-5 py-4">
            <h2 className="text-lg leading-tight font-semibold">{title}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{settingsLabel}</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 *:rounded-none *:border-0 *:bg-transparent *:px-0 *:py-5 *:shadow-none *:not-first:border-t">
            {side}
          </div>
          {action && <div className="shrink-0 space-y-2 border-t bg-background p-4 *:w-full">{action}</div>}
        </aside>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="min-w-0 space-y-4">{main}</div>
        {!sheet && <aside className="space-y-4">{side}</aside>}
      </div>

      {/* portalled to <body>: inside the page's spaced layout the fixed panels would pick up its margins */}
      {sheet && createPortal(
        <>
          <div aria-hidden onClick={() => setOpen(false)}
            className={cn("fixed inset-0 z-50 bg-black/40 transition-opacity duration-200", open ? "opacity-100" : "pointer-events-none opacity-0")} />
          {/* always mounted, so settings keep their state while the sheet is closed */}
          <div role="dialog" aria-modal="true" aria-label={settingsLabel} inert={!open}
            className={cn("fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-2xl border-t bg-background px-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl transition-transform duration-200",
              open ? "translate-y-0" : "translate-y-full")}>
            <div className="sticky top-0 z-10 -mx-4 mb-2 flex items-center justify-between gap-2 bg-background px-4 pt-1 pb-2">
              <span className="absolute top-0 left-1/2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-muted" aria-hidden />
              <p className="pt-3 font-semibold">{settingsLabel}</p>
              <Button variant="ghost" className="mt-2 h-9" onClick={() => setOpen(false)}>Done</Button>
            </div>
            <div className="space-y-4">{side}</div>
            <Button className="mt-4 h-11 w-full" onClick={() => setOpen(false)}>Done</Button>
          </div>
        </>,
        document.body,
      )}

      {bar && createPortal(
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur">
          <div className="mx-auto flex max-w-xl items-center gap-2">
            {sheet && (
              <Button variant="outline" className={cn("h-11 shrink-0 px-3", !action && "flex-1")} aria-expanded={open} onClick={() => setOpen(true)}>
                <SlidersHorizontal /> {settingsLabel}
              </Button>
            )}
            {action && <div className="flex min-w-0 flex-1 gap-2 *:h-11 *:min-w-0 *:flex-1">{action}</div>}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

function Panel({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-5 rounded-xl border bg-card p-5 shadow-xs", className)}>
      {title && <h2 className="font-semibold">{title}</h2>}
      {children}
    </div>
  )
}

/* ─── helpers (from lib/pdfjs.ts) ─── */
/** pdf.js is loaded on first use, in the browser only (never during server rendering). */
async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist")
  if (!pdfjs.GlobalWorkerOptions.workerSrc)
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString()
  return pdfjs
}

type PdfDoc = PDFDocumentProxy

async function openPdf(data: ArrayBuffer) {
  // pdf.js transfers the buffer to its worker, so give it a copy
  const pdfjs = await loadPdfjs()
  return pdfjs.getDocument({ data: new Uint8Array(data.slice(0)) }).promise
}

/** Render one page (1-based) to a canvas at the given scale (1 = 72 dpi). */
async function renderPage(doc: PdfDoc, pageNo: number, scale: number, rotation = 0) {
  const page = await doc.getPage(pageNo)
  const viewport = page.getViewport({ scale, rotation: (page.rotate + rotation) % 360 })
  const canvas = document.createElement("canvas")
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#fff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  await page.render({ canvas, canvasContext: ctx, viewport }).promise
  page.cleanup()
  return canvas
}

/** Render small thumbnails for every page, calling back as each finishes. */
async function renderThumbs(doc: PdfDoc, onThumb: (i: number, url: string) => void, maxWidth = 220) {
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const vp = page.getViewport({ scale: 1 })
    const c = await renderPage(doc, i, maxWidth / vp.width)
    onThumb(i - 1, c.toDataURL("image/jpeg", 0.75))
  }
}

/* ─── helpers (from lib/images.ts) ─── */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = "async"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Image load failed"))
    img.src = src
  })
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

/* ─── helpers (from lib/canvas.ts) ─── */

/** Load a File into an <img> and return it with its object URL. */
async function fileToImage(file: File) {
  const url = URL.createObjectURL(file)
  const img = await loadImage(url)
  return { img, url, w: img.naturalWidth || 1000, h: img.naturalHeight || 1000 }
}

const isPdf = (f: File) => f.type === "application/pdf" || /\.pdf$/i.test(f.name)
/* ─── helpers (from hooks/usePdf.ts) ─── */
interface LoadedPdf {
  file: File
  bytes: ArrayBuffer
  doc: PdfDoc
  pages: number
  thumbs: (string | null)[]
}

async function readPdf(file: File): Promise<{ bytes: ArrayBuffer; doc: PdfDoc }> {
  if (!isPdf(file)) throw new Error(`${file.name} is not a PDF`)
  const bytes = await file.arrayBuffer()
  try {
    return { bytes, doc: await openPdf(bytes) }
  } catch (e) {
    if ((e as { name?: string })?.name === "PasswordException") throw new Error(`${file.name} is password protected`)
    throw new Error(`${file.name} could not be opened`)
  }
}

/** Load one PDF and render its page thumbnails progressively. */
function usePdf(thumbWidth = 220) {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null)
  const [loading, setLoading] = useState(false)
  const token = useRef(0)

  const load = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    const t = ++token.current
    setLoading(true)
    try {
      const { bytes, doc } = await readPdf(file)
      if (t !== token.current) return
      setPdf({ file, bytes, doc, pages: doc.numPages, thumbs: Array(doc.numPages).fill(null) })
      setLoading(false)
      await renderThumbs(doc, (i, url) => {
        if (t !== token.current) return
        setPdf((p) => (p && p.doc === doc ? { ...p, thumbs: p.thumbs.map((x, j) => (j === i ? url : x)) } : p))
      }, thumbWidth)
    } catch (e) {
      if (t === token.current) { toast.error((e as Error).message); setLoading(false) }
    }
  }, [thumbWidth])

  const reset = useCallback(() => { token.current++; setPdf(null) }, [])
  return { pdf, load, loading, reset }
}

/* ─── helpers (from lib/pdfedit.ts) ─── */
async function loadPdfLib(data: ArrayBuffer) {
  try {
    return await PDFDocument.load(data)
  } catch (e) {
    if (String(e).toLowerCase().includes("encrypt")) throw new Error("This PDF is password protected. Unlock it first.")
    throw new Error("Could not read this PDF. It may be damaged.")
  }
}

async function pdfBytesToBlob(doc: PDFDocument) {
  const bytes = await doc.save()
  return new Blob([bytes as BlobPart], { type: "application/pdf" })
}

/* ─── helpers (from lib/pdfplace.ts) ─── */
/** Size of the page as the reader sees it (after /Rotate). */
function visualSize(page: PDFPage) {
  const { width, height } = page.getSize()
  const r = ((page.getRotation().angle % 360) + 360) % 360
  return r === 90 || r === 270 ? { w: height, h: width, r } : { w: width, h: height, r }
}

/**
 * Convert a point in visual coordinates (origin bottom-left of what the reader sees)
 * to the page's own coordinates, and give the extra rotation content needs to appear upright.
 */
function toPage(page: PDFPage, X: number, Y: number) {
  const { width: w, height: h } = page.getSize()
  const r = ((page.getRotation().angle % 360) + 360) % 360
  // origin of the media box may not be 0,0
  const { x: ox, y: oy } = page.getMediaBox()
  let x = X, y = Y
  if (r === 90) { x = w - Y; y = X }
  else if (r === 180) { x = w - X; y = h - Y }
  else if (r === 270) { x = Y; y = h - X }
  return { x: x + ox, y: y + oy, rotate: degrees(r) }
}

/* ─── helpers (from lib/download.ts) ─── */
/** Download a blob as a file. */
async function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

const baseName = (n: string) => n.replace(/\.[^.]+$/, "")

/* ─── helpers (from tools/pdf/SplitPdf.tsx) ─── */

function Loading() {
  return <div className="grid h-64 place-items-center rounded-xl border bg-card"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
}

/* ═══════════════ Tool ═══════════════ */
interface Sig { id: string; src: string; ratio: number } // ratio = h / w
interface Placed { id: string; sig: string; page: number; x: number; y: number; w: number } // fractions of page

const FONTS = ["Great Vibes", "Dancing Script", "Caveat", "Satisfy"]
let fontsLinked = false
function linkFonts() {
  if (fontsLinked) return
  fontsLinked = true
  const l = document.createElement("link")
  l.rel = "stylesheet"
  l.href = `https://fonts.googleapis.com/css2?${FONTS.map((f) => `family=${f.replace(/ /g, "+")}`).join("&")}&display=swap`
  document.head.appendChild(l)
}

/** Crop transparent/white margins from a canvas and return PNG + aspect ratio. */
function trim(c: HTMLCanvasElement): Sig | null {
  const ctx = c.getContext("2d")!
  const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height)
  let x0 = width, y0 = height, x1 = -1, y1 = -1
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  }
  if (x1 < 0) return null
  const pad = 6
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(width - 1, x1 + pad); y1 = Math.min(height - 1, y1 + pad)
  const out = document.createElement("canvas")
  out.width = x1 - x0 + 1; out.height = y1 - y0 + 1
  out.getContext("2d")!.drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height)
  return { id: crypto.randomUUID(), src: out.toDataURL("image/png"), ratio: out.height / out.width }
}

function textSig(text: string, font: string, color: string, size = 96) {
  const c = document.createElement("canvas")
  const ctx = c.getContext("2d")!
  ctx.font = `${size}px "${font}", cursive`
  c.width = Math.ceil(ctx.measureText(text).width + size); c.height = Math.ceil(size * 1.8)
  ctx.font = `${size}px "${font}", cursive`; ctx.fillStyle = color; ctx.textBaseline = "middle"
  ctx.fillText(text, size / 2, c.height / 2)
  return trim(c)
}

function DrawPad({ color, width, onDone }: { color: string; width: number; onDone: (s: Sig) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [empty, setEmpty] = useState(true)
  useEffect(() => {
    const c = ref.current!
    c.width = 1000; c.height = 360
  }, [])
  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    return [((e.clientX - r.left) / r.width) * 1000, ((e.clientY - r.top) / r.height) * 360] as const
  }
  return (
    <div className="space-y-3">
      <canvas
        ref={ref} className="h-44 w-full touch-none cursor-crosshair rounded-lg border-2 border-dashed bg-white"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId); drawing.current = true
          const ctx = ref.current!.getContext("2d")!
          ctx.strokeStyle = color; ctx.lineWidth = width * 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round"
          const [x, y] = pos(e); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 0.1, y); ctx.stroke(); setEmpty(false)
        }}
        onPointerMove={(e) => { if (!drawing.current) return; const ctx = ref.current!.getContext("2d")!; const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke() }}
        onPointerUp={() => (drawing.current = false)}
        onPointerCancel={() => (drawing.current = false)}
      />
      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => { const c = ref.current!; c.getContext("2d")!.clearRect(0, 0, c.width, c.height); setEmpty(true) }}><Eraser /> Clear</Button>
        <Button disabled={empty} onClick={() => { const s = trim(ref.current!); if (s) onDone(s) }}><Plus /> Use signature</Button>
      </div>
    </div>
  )
}

function SignPdfTool() {
  const { pdf, load, loading, reset } = usePdf(90)
  const [page, setPage] = useState(0)
  const [pageImg, setPageImg] = useState<string | null>(null)
  const [sigs, setSigs] = useState<Sig[]>([])
  const [placed, setPlaced] = useState<Placed[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [color, setColor] = useState("#1e3a8a")
  const [penW, setPenW] = useState(4)
  const [typed, setTyped] = useState("")
  const [font, setFont] = useState(FONTS[0])
  const [removeBg, setRemoveBg] = useState(true)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Blob | null>(null)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => { linkFonts() }, [])
  useEffect(() => {
    if (!pdf) return
    let live = true
    // clear the old page right away so a signature is never placed on the wrong page while the next one renders
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPageImg(null)
    ;(async () => {
      const p = await pdf.doc.getPage(page + 1)
      const vp = p.getViewport({ scale: 1 })
      const c = await renderPage(pdf.doc, page + 1, Math.min(2, 1100 / vp.width))
      if (live) setPageImg(c.toDataURL("image/jpeg", 0.85))
    })()
    return () => { live = false }
  }, [pdf, page])

  const sigById = (id: string) => sigs.find((s) => s.id === id)!
  const change = (fn: (p: Placed[]) => Placed[]) => { setPlaced(fn); setResult(null) }

  const addSig = (s: Sig | null) => {
    if (!s) return toast.error("Nothing to add")
    setSigs((p) => [...p, s]); setOpen(false); place(s)
  }
  const place = (s: Sig) => {
    const id = crypto.randomUUID()
    // stagger new items so they don't land on top of each other
    change((p) => {
      const n = p.filter((q) => q.page === page).length
      return [...p, { id, sig: s.id, page, x: 0.5 - (n % 3) * 0.08, y: Math.max(0.05, 0.78 - n * 0.1), w: 0.3 }]
    })
    setActive(id)
  }

  const addDate = async () => {
    await document.fonts.ready
    const d = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    const s = textSig(d, "Inter", "#111111", 60)
    if (s) { setSigs((p) => [...p, s]); place(s) }
  }

  const fromUpload = async (f: File) => {
    try {
      const { img, w, h } = await fileToImage(f)
      const c = document.createElement("canvas"); const k = Math.min(1, 1200 / w)
      c.width = w * k; c.height = h * k
      const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0, c.width, c.height)
      if (removeBg) {
        const d = ctx.getImageData(0, 0, c.width, c.height); const p = d.data
        for (let i = 0; i < p.length; i += 4) { const l = (p[i] + p[i + 1] + p[i + 2]) / 3; if (l > 200) p[i + 3] = Math.max(0, Math.round(((255 - l) / 55) * 255)) }
        ctx.putImageData(d, 0, 0)
      }
      addSig(trim(c))
    } catch { toast.error("Could not read image") }
  }

  // drag + resize
  const startDrag = (e: React.PointerEvent, p: Placed, mode: "move" | "size") => {
    e.preventDefault(); e.stopPropagation(); setActive(p.id)
    const r = box.current!.getBoundingClientRect()
    const sx = e.clientX, sy = e.clientY, o = { ...p }
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - sx) / r.width, dy = (ev.clientY - sy) / r.height
      change((all) => all.map((q) => {
        if (q.id !== p.id) return q
        if (mode === "move") {
          const hFrac = (o.w * sigById(o.sig).ratio * r.width) / r.height
          return { ...q, x: Math.min(1 - o.w, Math.max(0, o.x + dx)), y: Math.min(1 - hFrac, Math.max(0, o.y + dy)) }
        }
        return { ...q, w: Math.min(1 - o.x, Math.max(0.04, o.w + dx)) }
      }))
    }
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up) }
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up)
  }

  const save = async () => {
    if (!pdf || !placed.length) return
    setBusy(true)
    try {
      const doc = await loadPdfLib(pdf.bytes)
      const cache = new Map<string, Awaited<ReturnType<typeof doc.embedPng>>>()
      for (const p of placed) {
        const s = sigById(p.sig)
        if (!cache.has(s.id)) cache.set(s.id, await doc.embedPng(await (await fetch(s.src)).arrayBuffer()))
        const pg = doc.getPage(p.page)
        const { w, h } = visualSize(pg)
        const width = p.w * w, height = width * s.ratio
        const pt = toPage(pg, p.x * w, h - p.y * h - height)
        pg.drawImage(cache.get(s.id)!, { x: pt.x, y: pt.y, width, height, rotate: pt.rotate })
      }
      setResult(await pdfBytesToBlob(doc))
      toast.success("Signed PDF ready")
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }

  if (!pdf) return loading ? <Loading /> : <FileDrop accept="application/pdf,.pdf" multiple={false} onFiles={(f) => { setPlaced([]); setPage(0); setResult(null); load(f) }} title="Drop a PDF to sign" hint="Draw, type or upload your signature and place it anywhere" />

  const onPage = placed.filter((p) => p.page === page)
  const name = `${baseName(pdf.file.name)}-signed.pdf`

  const downloadBtn = result && (
    <Button size="lg" className="w-full" onClick={() => saveBlob(result, name)}><Download /> Download signed PDF</Button>
  )
  const runBtn = (
    <Button size="lg" className="w-full" disabled={busy || !placed.length} onClick={save}>{busy ? <Loader2 className="animate-spin" /> : <Save />} Save signed PDF</Button>
  )
  return (
    <ToolGrid title="Sign PDF" mobile="inline"
      action={result ? downloadBtn : runBtn}
      main={<>
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft /> Prev</Button>
          <span className="text-sm font-medium">Page {page + 1} of {pdf.pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pdf.pages - 1} onClick={() => setPage((p) => p + 1)}>Next <ChevronRight /></Button>
        </div>
        <div className="grid place-items-center rounded-xl border bg-muted p-3" onPointerDown={() => setActive(null)}>
          {pageImg ? (
            <div ref={box} className="relative w-full max-w-[800px] shadow-lg select-none">
              <img src={pageImg} alt={`Page ${page + 1}`} className="block w-full" draggable={false} />
              {onPage.map((p) => {
                const s = sigById(p.sig)
                return (
                  <div key={p.id} onPointerDown={(e) => startDrag(e, p, "move")}
                    className={cn("absolute cursor-move touch-none", active === p.id ? "outline-2 outline-primary outline-dashed" : "hover:outline-1 hover:outline-primary/50 hover:outline-dashed")}
                    style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, width: `${p.w * 100}%`, aspectRatio: `1 / ${s.ratio}` }}>
                    <img src={s.src} alt="Signature" className="size-full" draggable={false} />
                    {active === p.id && (
                      <>
                        <button aria-label="Remove" onPointerDown={(e) => e.stopPropagation()} onClick={() => change((a) => a.filter((q) => q.id !== p.id))}
                          className="absolute -top-3 -right-3 grid size-6 cursor-pointer place-items-center rounded-full bg-destructive text-white shadow"><X className="size-3.5" /></button>
                        <button aria-label="Copy to all pages" title="Copy to all pages" onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => change((a) => [...a, ...Array.from({ length: pdf.pages }, (_, i) => i).filter((i) => i !== p.page).map((i) => ({ ...p, id: crypto.randomUUID(), page: i }))])}
                          className="absolute -top-3 -left-3 grid size-6 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground shadow"><Copy className="size-3.5" /></button>
                        <span onPointerDown={(e) => startDrag(e, p, "size")} className="absolute -right-2 -bottom-2 size-4 cursor-nwse-resize rounded-sm border-2 border-primary bg-background" />
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          ) : <Loader2 className="my-24 size-6 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {pdf.thumbs.map((t, i) => (
            <button key={i} onClick={() => setPage(i)} className={cn("relative w-14 shrink-0 cursor-pointer overflow-hidden rounded border-2 bg-white", i === page ? "border-primary" : "border-transparent opacity-70")}>
              {t ? <img src={t} alt={`Page ${i + 1}`} /> : <span className="block aspect-[3/4]" />}
              {placed.some((p) => p.page === i) && <span className="absolute top-0.5 right-0.5 size-2 rounded-full bg-primary" />}
            </button>
          ))}
        </div>
      </>}
      side={<>
        <Panel title="Your signatures">
          <Button className="w-full" onClick={() => setOpen(true)}><PenLine /> Create signature</Button>
          {sigs.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Click to place on page {page + 1}:</p>
              <div className="grid grid-cols-2 gap-2">
                {sigs.map((s) => (
                  <button key={s.id} onClick={() => place(s)} className="grid h-16 cursor-pointer place-items-center rounded-lg border bg-white p-2 hover:border-primary">
                    <img src={s.src} alt="Saved signature" className="max-h-full max-w-full" />
                  </button>
                ))}
              </div>
            </div>
          )}
          <Button variant="outline" className="w-full" onClick={addDate}><CalendarDays /> Add today’s date</Button>
          <p className="text-xs text-muted-foreground">Drag to move · corner handle to resize · <Copy className="inline size-3" /> copies to every page.</p>
        </Panel>
        <Panel>
          <p className="text-sm text-muted-foreground">{placed.length} item{placed.length !== 1 && "s"} placed on {new Set(placed.map((p) => p.page)).size} page(s)</p>
          {result ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{name} · {formatBytes(result.size)}</p>
              <></>
            </div>
          ) : (
            <></>
          )}
          <Button variant="outline" className="w-full" onClick={() => { reset(); setPlaced([]); setResult(null) }}><FileUp /> Choose another PDF</Button>
        </Panel>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogTitle>Create your signature</DialogTitle>
            <DialogDescription>Draw it, type it, or upload a photo of it.</DialogDescription>
            <Tabs defaultValue="draw" className="gap-4">
              <TabsList className="w-full">
                <TabsTrigger value="draw"><PenLine /> Draw</TabsTrigger>
                <TabsTrigger value="type"><Type /> Type</TabsTrigger>
                <TabsTrigger value="upload"><Upload /> Upload</TabsTrigger>
              </TabsList>
              <div className="grid gap-4 sm:grid-cols-2">
                <ColorField label="Ink color" value={color} onChange={setColor} swatches={["#1e3a8a", "#000000", "#0f766e", "#b91c1c"]} />
                <TabsContent value="draw" className="mt-0"><SliderField label="Pen width" value={penW} onChange={setPenW} min={1} max={10} /></TabsContent>
              </div>
              <TabsContent value="draw"><DrawPad color={color} width={penW} onDone={addSig} /></TabsContent>
              <TabsContent value="type" className="space-y-4">
                <Field label="Your name"><Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Type your name" maxLength={40} /></Field>
                <Segmented value={font} onChange={setFont} options={FONTS.map((f) => ({ value: f, label: <span style={{ fontFamily: `"${f}", cursive`, fontSize: 16 }}>{typed.split(" ")[0] || "Signature"}</span> }))} />
                <div className="grid h-24 place-items-center rounded-lg border bg-white text-4xl" style={{ fontFamily: `"${font}", cursive`, color }}>{typed || "Your name"}</div>
                <Button className="w-full" disabled={!typed.trim()} onClick={async () => { await document.fonts.load(`96px "${font}"`); addSig(textSig(typed.trim(), font, color)) }}><Plus /> Use signature</Button>
              </TabsContent>
              <TabsContent value="upload" className="space-y-4">
                <SwitchRow label="Remove white background" desc="Best for a photo of a signature on white paper" checked={removeBg} onChange={setRemoveBg} />
                <FileDrop accept="image/*" multiple={false} onFiles={(f) => fromUpload(f[0])} title="Drop signature image" />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </>}
    />
  )
}

/** Tools use files, canvas, workers and local storage, so they render only in the browser. */
const subscribeNothing = () => () => {}
export default function SignPdf() {
  const inBrowser = useSyncExternalStore(subscribeNothing, () => true, () => false)
  if (!inBrowser) {
    return (
      <div className="grid h-64 place-items-center rounded-xl border border-dashed bg-card/50" aria-busy="true">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  return <SignPdfTool />
}
