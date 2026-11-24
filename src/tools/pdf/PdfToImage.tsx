"use client"
/**
 * PDF to Image — the whole tool in one file (UI, logic and helpers). Runs entirely in the browser.
 */
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import JSZip from "jszip"
import { ClipboardPaste, Download, FileArchive, FileUp, ImageDown, Loader2, Plus, ShieldCheck, Upload, SlidersHorizontal } from "lucide-react"
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
type OutFormat = "jpeg" | "png" | "webp"
const MIME: Record<OutFormat, string> = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" }

function canvasToBlob(c: HTMLCanvasElement, fmt: OutFormat, quality = 0.9): Promise<Blob> {
  return new Promise((res, rej) =>
    c.toBlob((b) => (b ? res(b) : rej(new Error("Encoding failed"))), MIME[fmt], fmt === "png" ? undefined : quality)
  )
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

/** Parse "1-3, 5, 8-" into 0-based page indexes (in order, duplicates kept). Throws on invalid input. */
function parseRanges(input: string, total: number): number[][] {
  const groups: number[][] = []
  for (const raw of input.split(",")) {
    const part = raw.trim()
    if (!part) continue
    const m = part.match(/^(\d*)\s*-\s*(\d*)$/)
    let a: number, b: number
    if (m) {
      a = m[1] ? +m[1] : 1
      b = m[2] ? +m[2] : total
    } else if (/^\d+$/.test(part)) {
      a = b = +part
    } else throw new Error(`“${part}” is not a valid page range`)
    if (a < 1 || b > total || a > b) throw new Error(`“${part}” is outside 1–${total}`)
    const g: number[] = []
    for (let i = a; i <= b; i++) g.push(i - 1)
    groups.push(g)
  }
  if (!groups.length) throw new Error("Enter at least one page or range")
  return groups
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

async function zipBlobs(files: { name: string; blob: Blob }[]) {
  const zip = new JSZip()
  const used = new Map<string, number>()
  for (const f of files) {
    let name = f.name
    const n = used.get(name) ?? 0
    if (n) name = name.replace(/(\.[^.]+)?$/, `-${n}$1`)
    used.set(f.name, n + 1)
    zip.file(name, f.blob)
  }
  return zip.generateAsync({ type: "blob" })
}

const baseName = (n: string) => n.replace(/\.[^.]+$/, "")

/* ─── helpers (from tools/pdf/SplitPdf.tsx) ─── */

function Loading() {
  return <div className="grid h-64 place-items-center rounded-xl border bg-card"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
}

/** Shrink a canvas to 0×0 so the browser frees its memory right away (matters for big PDFs on phones). */
function releaseCanvas(c: HTMLCanvasElement) { c.width = 0; c.height = 0 }

/* ═══════════════ Tool ═══════════════ */
type Fmt = "jpeg" | "png" | "webp"
interface Out { page: number; blob: Blob; url: string; name: string }

export default function PdfToImage() {
  const { pdf, load, loading, reset } = usePdf(180)
  const [fmt, setFmt] = useState<Fmt>("jpeg")
  const [dpi, setDpi] = useState("150")
  const [quality, setQuality] = useState(90)
  const [which, setWhich] = useState<"all" | "range">("all")
  const [range, setRange] = useState("1")
  const [outs, setOuts] = useState<Out[]>([])
  const [gray, setGray] = useState(false)
  const [progress, setProgress] = useState<[number, number] | null>(null)

  const clearOuts = () => setOuts((o) => { o.forEach((x) => URL.revokeObjectURL(x.url)); return [] })

  const run = async () => {
    if (!pdf) return
    let pages: number[]
    try { pages = which === "all" ? Array.from({ length: pdf.pages }, (_, i) => i) : [...new Set(parseRanges(range, pdf.pages).flat())] }
    catch (e) { return toast.error((e as Error).message) }
    clearOuts()
    const scale = +dpi / 72
    const ext = fmt === "jpeg" ? "jpg" : fmt
    const base = baseName(pdf.file.name)
    try {
      for (let k = 0; k < pages.length; k++) {
        setProgress([k, pages.length])
        const c = await renderPage(pdf.doc, pages[k] + 1, scale)
        if (gray) {
          const ctx = c.getContext("2d")!, d = ctx.getImageData(0, 0, c.width, c.height), p = d.data
          for (let i = 0; i < p.length; i += 4) { const y = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]; p[i] = p[i + 1] = p[i + 2] = y }
          ctx.putImageData(d, 0, 0)
        }
        const blob = await canvasToBlob(c, fmt, quality / 100)
        releaseCanvas(c)
        setOuts((o) => [...o, { page: pages[k] + 1, blob, url: URL.createObjectURL(blob), name: `${base}-page-${pages[k] + 1}.${ext}` }])
      }
      toast.success(`${pages.length} image${pages.length > 1 ? "s" : ""} ready`)
    } catch { toast.error("Rendering failed — try a lower DPI") } finally { setProgress(null) }
  }

  const dlAll = async () => {
    if (outs.length === 1) return saveBlob(outs[0].blob, outs[0].name)
    const z = await zipBlobs(outs.map((o) => ({ name: o.name, blob: o.blob })))
    await saveBlob(z, `${baseName(pdf!.file.name)}-images.zip`)
  }

  if (!pdf) return loading ? <Loading /> : <FileDrop accept="application/pdf,.pdf" multiple={false} onFiles={(f) => { clearOuts(); load(f) }} title="Drop a PDF" hint="Every page becomes an image" />

  const runBtn = (
    <Button size="lg" className="w-full" disabled={!!progress} onClick={run}>
      {progress ? <><Loader2 className="animate-spin" /> Page {progress[0] + 1} of {progress[1]}</> : <><ImageDown /> Convert to {fmt === "jpeg" ? "JPG" : fmt.toUpperCase()}</>}
    </Button>
  )
  return (
    <ToolGrid
      action={runBtn}
      main={outs.length ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-accent/60 p-3">
            <span className="text-sm font-semibold">{outs.length} image{outs.length > 1 && "s"} · {formatBytes(outs.reduce((n, o) => n + o.blob.size, 0))}</span>
            <Button onClick={dlAll} disabled={!!progress}>{progress ? <Loader2 className="animate-spin" /> : outs.length > 1 ? <FileArchive /> : <Download />} {progress ? "Converting…" : outs.length > 1 ? "Download all (ZIP)" : "Download"}</Button>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
            {outs.map((o) => (
              <div key={o.name} className="rounded-xl border bg-card p-2">
                <div className="grid aspect-[3/4] place-items-center overflow-hidden rounded-md bg-muted"><img src={o.url} alt={`Page ${o.page}`} className="max-h-full max-w-full shadow-sm" /></div>
                <div className="mt-2 flex items-center justify-between gap-1">
                  <span className="text-xs text-muted-foreground">p{o.page} · {formatBytes(o.blob.size)}</span>
                  <Button variant="outline" size="icon-sm" aria-label={`Download page ${o.page}`} onClick={() => saveBlob(o.blob, o.name)}><Download /></Button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="px-1 text-sm"><b>{pdf.file.name}</b> <span className="text-muted-foreground">· {pdf.pages} pages</span></p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
            {pdf.thumbs.map((t, i) => <PdfPageThumb key={i} src={t} n={i + 1} />)}
          </div>
        </>
      )}
      side={<Panel title="Convert to image">
        <Field label="Format"><Segmented value={fmt} onChange={(v) => { setFmt(v); clearOuts() }} options={[{ value: "jpeg", label: "JPG" }, { value: "png", label: "PNG" }, { value: "webp", label: "WEBP" }]} /></Field>
        <Field label="Resolution">
          <Segmented value={dpi} onChange={(v) => { setDpi(v); clearOuts() }} options={[{ value: "72", label: "72" }, { value: "150", label: "150" }, { value: "300", label: "300" }, { value: "600", label: "600 dpi" }]} />
          <p className="text-xs text-muted-foreground">150 dpi for screens, 300 dpi for print or OCR.</p>
        </Field>
        {fmt !== "png" && <SliderField label="Quality" value={quality} onChange={(v) => { setQuality(v); clearOuts() }} min={30} max={100} step={5} suffix="%" />}
        <SwitchRow label="Black & white" checked={gray} onChange={(v) => { setGray(v); clearOuts() }} />
        <Field label="Pages">
          <Segmented value={which} onChange={(v) => { setWhich(v); clearOuts() }} options={[{ value: "all", label: `All ${pdf.pages}` }, { value: "range", label: "Choose" }]} />
          {which === "range" && <Input value={range} onChange={(e) => setRange(e.target.value)} placeholder="e.g. 1-3, 5" />}
        </Field>
        <div className="hidden lg:block">{runBtn}</div>
        <Button variant="outline" className="w-full" onClick={() => { reset(); clearOuts() }}><FileUp /> Choose another PDF</Button>
      </Panel>}
    />
  )
}
