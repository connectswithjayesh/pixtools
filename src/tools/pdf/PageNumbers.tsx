"use client"
/**
 * Add Page Numbers — the whole tool in one file (UI, logic and helpers). Runs entirely in the browser.
 */
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { ClipboardPaste, Download, FileUp, Hash, Loader2, Plus, ShieldCheck, Upload, SlidersHorizontal } from "lucide-react"
import { PDFDocument, StandardFonts, degrees, rgb, type PDFPage } from "pdf-lib"
import * as pdfjs from "pdfjs-dist"
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
 * Tool layout. Desktop: work area + settings sidebar.
 * Phone/tablet: the main action sits in a bar fixed to the bottom of the screen, and the settings open
 * in a bottom sheet (mobile="sheet") or stay below the work area (mobile="inline").
 */
function ToolGrid({ main, side, action, mobile = "sheet", settingsLabel = "Settings" }: {
  main: React.ReactNode; side: React.ReactNode; action?: React.ReactNode; mobile?: "sheet" | "inline"; settingsLabel?: string
}) {
  const desktop = useSyncExternalStore(
    (cb) => { const m = window.matchMedia("(min-width: 1024px)"); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb) },
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => true,
  )
  const [open, setOpen] = useState(false)
  const sheet = !desktop && mobile === "sheet"
  const bar = !desktop && (sheet || !!action)

  // keep the end of the page clear of the fixed bar
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

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-4">{main}</div>
        {!sheet && <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">{side}</aside>}
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

/* ─── helpers (from components/common/PdfPageThumb.tsx) ─── */
function PdfPageThumb({ src, n, rotation = 0, selected, onClick, className, children }: {
  src: string | null; n: number; rotation?: number; selected?: boolean; onClick?: () => void; className?: string; children?: React.ReactNode
}) {
  return (
    <div onClick={onClick} className={cn("group relative rounded-xl border bg-card p-2 transition-all", onClick && "cursor-pointer", selected && "border-primary ring-2 ring-primary/30", className)}>
      <div className="grid aspect-[3/4] place-items-center overflow-hidden rounded-md bg-muted">
        {src ? <img src={src} alt={`Page ${n}`} draggable={false} className="size-full object-contain drop-shadow-sm transition-transform" style={{ transform: `rotate(${rotation}deg) scale(${rotation % 180 ? 0.75 : 1})` }} />
          : <Loader2 className="size-5 animate-spin text-muted-foreground" />}
      </div>
      <p className="mt-1.5 text-center text-xs font-medium text-muted-foreground">{n}</p>
      {children}
    </div>
  )
}

/* ─── helpers (from lib/pdfjs.ts) ─── */
if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc)
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString()

type PdfDoc = pdfjs.PDFDocumentProxy

async function openPdf(data: ArrayBuffer) {
  // pdf.js transfers the buffer to its worker, so give it a copy
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

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

/* ─── helpers (from lib/canvas.ts) ─── */
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
type Pos = "tl" | "tc" | "tr" | "bl" | "bc" | "br"
const FORMATS = [
  { v: "n", l: "1", f: (n: number) => `${n}` },
  { v: "page", l: "Page 1", f: (n: number) => `Page ${n}` },
  { v: "nN", l: "1 / 10", f: (n: number, t: number) => `${n} / ${t}` },
  { v: "pageof", l: "Page 1 of 10", f: (n: number, t: number) => `Page ${n} of ${t}` },
  { v: "dash", l: "- 1 -", f: (n: number) => `- ${n} -` },
  { v: "custom", l: "Custom text…", f: (n: number) => `${n}` },
]
const FONTS = { helv: StandardFonts.Helvetica, helvB: StandardFonts.HelveticaBold, times: StandardFonts.TimesRoman, timesB: StandardFonts.TimesRomanBold, cour: StandardFonts.Courier, courB: StandardFonts.CourierBold }
const hexRgb = (h: string) => { const n = parseInt(h.slice(1), 16); return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255) }

export default function PageNumbers() {
  const { pdf, load, loading, reset } = usePdf(160)
  const [pos, setPos] = useState<Pos>("bc")
  const [fmt, setFmt] = useState("n")
  const [start, setStart] = useState(1)
  const [size, setSize] = useState(11)
  const [margin, setMargin] = useState(12)
  const [color, setColor] = useState("#333333")
  const [skipFirst, setSkipFirst] = useState(false)
  const [bold, setBold] = useState(false)
  const [family, setFamily] = useState<"helv" | "times" | "cour">("helv")
  const [tpl, setTpl] = useState("Page {n} of {total}")
  const [startPage, setStartPage] = useState(1)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Blob | null>(null)
  const dirty = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setResult(null) }

  const label = (i: number, total: number) =>
    fmt === "custom" ? tpl.replace(/\{n\}/g, String(i)).replace(/\{total\}/g, String(total)) : FORMATS.find((f) => f.v === fmt)!.f(i, total)
  // first page that gets a number (1-based); "skip first page" is the same as starting at page 2
  const firstPage = Math.max(skipFirst ? 2 : 1, startPage)

  const run = async () => {
    if (!pdf) return
    setBusy(true)
    try {
      const doc = await loadPdfLib(pdf.bytes)
      const font = await doc.embedFont(FONTS[`${family}${bold ? "B" : ""}` as keyof typeof FONTS])
      const pages = doc.getPages()
      const counted = Math.max(0, pages.length - firstPage + 1)
      const total = counted + start - 1
      const mm = (margin * 72) / 25.4
      pages.forEach((page, i) => {
        if (i + 1 < firstPage) return
        const num = i + 2 - firstPage + start - 1
        const text = label(num, total).replace(/[^\x20-\x7E]/g, "")
        const tw = font.widthOfTextAtSize(text, size)
        const { w, h } = visualSize(page)
        const X = pos[1] === "l" ? mm : pos[1] === "r" ? w - mm - tw : (w - tw) / 2
        const Y = pos[0] === "t" ? h - mm - size * 0.75 : mm
        const p = toPage(page, X, Y)
        page.drawText(text, { x: p.x, y: p.y, size, font, color: hexRgb(color), rotate: p.rotate })
      })
      setResult(await pdfBytesToBlob(doc))
      toast.success("Page numbers added")
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }

  const name = pdf ? `${baseName(pdf.file.name)}-numbered.pdf` : ""
  if (!pdf) return loading ? <Loading /> : <FileDrop accept="application/pdf,.pdf" multiple={false} onFiles={(f) => { setResult(null); load(f) }} title="Drop a PDF" />

  const preview = (i: number) => {
    if (i + 1 < firstPage) return null
    const total = Math.max(0, pdf.pages - firstPage + 1) + start - 1
    return label(i + 2 - firstPage + start - 1, total)
  }

  const downloadBtn = result && (
    <Button size="lg" className="w-full" onClick={() => saveBlob(result, name)}><Download /> Download PDF</Button>
  )
  const runBtn = (
    <Button size="lg" className="w-full" disabled={busy} onClick={run}>{busy ? <Loader2 className="animate-spin" /> : <Hash />} Add page numbers</Button>
  )
  return (
    <ToolGrid
      action={result ? downloadBtn : runBtn}
      main={<>
        <p className="px-1 text-sm"><b>{pdf.file.name}</b> <span className="text-muted-foreground">· {pdf.pages} pages · preview</span></p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3">
          {pdf.thumbs.slice(0, 24).map((t, i) => (
            <PdfPageThumb key={i} src={t} n={i + 1}>
              {preview(i) && (
                <span className={cn("absolute rounded bg-primary px-1 text-[10px] font-semibold text-primary-foreground shadow",
                  pos[0] === "t" ? "top-3" : "bottom-9", pos[1] === "l" ? "left-3" : pos[1] === "r" ? "right-3" : "left-1/2 -translate-x-1/2")}>{preview(i)}</span>
              )}
            </PdfPageThumb>
          ))}
        </div>
        {pdf.pages > 24 && <p className="text-center text-xs text-muted-foreground">+{pdf.pages - 24} more pages</p>}
      </>}
      side={<Panel title="Page numbers">
        <Field label="Position">
          <div className="grid w-40 grid-cols-3 gap-1.5 rounded-lg border p-2">
            {(["tl", "tc", "tr"] as Pos[]).map((p) => <button key={p} aria-label={p} onClick={() => dirty(setPos)(p)} className={cn("h-8 cursor-pointer rounded sm:h-5", pos === p ? "bg-primary" : "bg-muted hover:bg-accent")} />)}
            <div className="col-span-3 h-10" />
            {(["bl", "bc", "br"] as Pos[]).map((p) => <button key={p} aria-label={p} onClick={() => dirty(setPos)(p)} className={cn("h-8 cursor-pointer rounded sm:h-5", pos === p ? "bg-primary" : "bg-muted hover:bg-accent")} />)}
          </div>
        </Field>
        <Field label="Format">
          <Select items={FORMATS.map((f) => ({ value: f.v, label: f.l }))} value={fmt} onValueChange={(v) => v && dirty(setFmt)(v)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{FORMATS.map((f) => <SelectItem key={f.v} value={f.v}>{f.l}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        {fmt === "custom" && (
          <Field label="Custom text" hint="{n} = number, {total} = total">
            <Input value={tpl} onChange={(e) => dirty(setTpl)(e.target.value)} maxLength={60} />
            <p className="text-xs text-muted-foreground">e.g. “Invoice #2026 – {"{n}"}/{"{total}"}”. English letters & symbols only.</p>
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="First number"><Input type="number" min={0} value={start} onChange={(e) => dirty(setStart)(+e.target.value || 0)} /></Field>
          <Field label="Start on page"><Input type="number" min={1} max={pdf.pages} value={startPage} onChange={(e) => dirty(setStartPage)(Math.max(1, +e.target.value || 1))} /></Field>
        </div>
        <Field label="Font"><Segmented value={family} onChange={dirty(setFamily)} options={[{ value: "helv", label: "Sans" }, { value: "times", label: "Serif" }, { value: "cour", label: "Mono" }]} /></Field>
        <SliderField label="Font size" value={size} onChange={dirty(setSize)} min={6} max={28} suffix="pt" />
        <SliderField label="Distance from edge" value={margin} onChange={dirty(setMargin)} min={4} max={40} suffix=" mm" />
        <ColorField label="Color" value={color} onChange={dirty(setColor)} swatches={["#333333", "#000000", "#6b7280", "#ef4444", "#2563eb"]} />
        <SwitchRow label="Bold" checked={bold} onChange={dirty(setBold)} />
        <SwitchRow label="Skip first page" desc="Leave the cover page without a number" checked={skipFirst} onChange={dirty(setSkipFirst)} />
        {result ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{name} · {formatBytes(result.size)}</p>
            <div className="hidden lg:block">{downloadBtn}</div>
          </div>
        ) : (
          <div className="hidden lg:block">{runBtn}</div>
        )}
        <Button variant="outline" className="w-full" onClick={() => { reset(); setResult(null) }}><FileUp /> Choose another PDF</Button>
      </Panel>}
    />
  )
}
