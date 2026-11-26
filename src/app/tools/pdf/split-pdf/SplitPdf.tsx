"use client"
/**
 * Split PDF — the whole tool in one file (UI, logic and helpers). Runs entirely in the browser.
 */
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import JSZip from "jszip"
import { Check, ClipboardPaste, Download, FileUp, Loader2, Plus, Scissors, ShieldCheck, Upload, SlidersHorizontal } from "lucide-react"
import { PDFDocument } from "pdf-lib"
import type { PDFDocumentProxy } from "pdfjs-dist"
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
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

/* ═══════════════ Tool ═══════════════ */
type Mode = "select" | "ranges" | "every" | "parts" | "all"

function SplitPdfTool() {
  const { pdf, load, loading, reset } = usePdf(180)
  const [mode, setMode] = useState<Mode>("select")
  const [sel, setSel] = useState<Set<number>>(new Set())
  const [ranges, setRanges] = useState("1-2, 3-")
  const [mergeRanges, setMergeRanges] = useState(false)
  const [every, setEvery] = useState(2)
  const [parts, setParts] = useState(2)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ blob: Blob; name: string; files: number } | null>(null)

  const N = pdf?.pages ?? 0
  const groups = useMemo((): { groups: number[][] } | { error: string } => {
    if (!N) return { groups: [] }
    try {
      if (mode === "select") {
        const s = [...sel].sort((a, b) => a - b)
        return { groups: s.length ? [s] : [] }
      }
      if (mode === "ranges") { const g = parseRanges(ranges, N); return { groups: mergeRanges ? [g.flat()] : g } }
      if (mode === "every") {
        const k = Math.max(1, every | 0), g: number[][] = []
        for (let i = 0; i < N; i += k) g.push(Array.from({ length: Math.min(k, N - i) }, (_, j) => i + j))
        return { groups: g }
      }
      if (mode === "parts") {
        const k = Math.min(N, Math.max(1, parts | 0)), g: number[][] = []
        for (let i = 0; i < k; i++) {
          const a = Math.round((i * N) / k), b = Math.round(((i + 1) * N) / k)
          g.push(Array.from({ length: b - a }, (_, j) => a + j))
        }
        return { groups: g }
      }
      return { groups: Array.from({ length: N }, (_, i) => [i]) }
    } catch (e) { return { error: (e as Error).message } }
  }, [mode, sel, ranges, mergeRanges, every, parts, N])

  const highlighted = new Set("groups" in groups ? groups.groups.flat() : [])
  const toggle = (i: number) => { setResult(null); setSel((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n }) }

  const run = async () => {
    if (!pdf || !("groups" in groups) || !groups.groups.length) return
    setBusy(true)
    try {
      const src = await loadPdfLib(pdf.bytes)
      const base = baseName(pdf.file.name)
      const outs: { name: string; blob: Blob }[] = []
      for (const g of groups.groups) {
        const d = await PDFDocument.create()
        ;(await d.copyPages(src, g)).forEach((p) => d.addPage(p))
        const label = g.length === 1 ? `page-${g[0] + 1}` : isRun(g) ? `pages-${g[0] + 1}-${g[g.length - 1] + 1}` : `${g.length}-pages`
        outs.push({ name: `${base}-${label}.pdf`, blob: await pdfBytesToBlob(d) })
      }
      const r = outs.length === 1 ? { ...outs[0], files: 1 } : { blob: await zipBlobs(outs), name: `${base}-split.zip`, files: outs.length }
      setResult(r)
      toast.success(outs.length === 1 ? "PDF ready" : `${outs.length} PDFs ready`)
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }

  if (!pdf) return loading ? <Loading /> : <FileDrop accept="application/pdf,.pdf" multiple={false} onFiles={(f) => { setSel(new Set()); setResult(null); load(f) }} title="Drop a PDF to split" />

  const count = "groups" in groups ? groups.groups.length : 0

  const downloadBtn = result && (
    <Button size="lg" className="w-full" onClick={() => saveBlob(result.blob, result.name)}><Download /> Download {result.files > 1 ? "ZIP" : "PDF"}</Button>
  )
  const runBtn = (
    <Button size="lg" className="w-full" disabled={busy || !count} onClick={run}>{busy ? <Loader2 className="animate-spin" /> : <Scissors />} Split PDF</Button>
  )
  return (
    <ToolGrid title="Split PDF" settingsLabel="Split options"
      action={result ? downloadBtn : runBtn}
      main={<>
        <div className="flex items-center justify-between gap-2 px-1 text-sm">
          <span><b>{pdf.file.name}</b> <span className="text-muted-foreground">· {N} pages</span></span>
          {mode === "select" && (
            <span className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setResult(null); setSel(new Set(Array.from({ length: N }, (_, i) => i))) }}>Select all</Button>
              <Button variant="ghost" size="sm" onClick={() => { setResult(null); setSel(new Set()) }}>None</Button>
            </span>
          )}
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
          {pdf.thumbs.map((t, i) => (
            <PdfPageThumb key={i} src={t} n={i + 1} selected={highlighted.has(i)} onClick={mode === "select" ? () => toggle(i) : undefined}
              className={cn(mode !== "select" && !highlighted.has(i) && "opacity-50")}>
              {mode === "select" && highlighted.has(i) && <span className="absolute top-3 right-3 grid size-5 place-items-center rounded bg-primary text-primary-foreground"><Check className="size-3.5" /></span>}
            </PdfPageThumb>
          ))}
        </div>
      </>}
      side={<Panel title="Split">
        <Field label="Mode">
          <div className="grid grid-cols-2 gap-1.5">
            {([["select", "Pick pages"], ["ranges", "Custom ranges"], ["every", "Every N pages"], ["parts", "Equal parts"], ["all", "Every page"]] as [Mode, string][]).map(([v, l]) => (
              <Button key={v} size="sm" variant={mode === v ? "default" : "outline"} onClick={() => { setMode(v); setResult(null) }}>{l}</Button>
            ))}
          </div>
        </Field>
        {mode === "select" && <p className="text-sm text-muted-foreground">Click pages to pick them. They’re saved together as one new PDF.</p>}
        {mode === "ranges" && (
          <>
            <Field label="Page ranges" hint="e.g. 1-3, 5, 8-">
              <Input value={ranges} onChange={(e) => { setRanges(e.target.value); setResult(null) }} />
            </Field>
            <SwitchRow label="Merge ranges into one PDF" desc="Off: one PDF per range" checked={mergeRanges} onChange={(v) => { setMergeRanges(v); setResult(null) }} />
          </>
        )}
        {mode === "every" && (
          <Field label="Pages per file">
            <Input type="number" min={1} max={N} value={every} onChange={(e) => { setEvery(Math.max(1, +e.target.value || 1)); setResult(null) }} />
          </Field>
        )}
        {mode === "parts" && (
          <Field label="Number of files">
            <Input type="number" min={1} max={N} value={parts} onChange={(e) => { setParts(Math.max(1, +e.target.value || 1)); setResult(null) }} />
          </Field>
        )}
        {"error" in groups && <p className="text-sm text-destructive">{groups.error}</p>}
        {"groups" in groups && <p className="rounded-lg bg-muted p-3 text-sm">Result: <b>{count}</b> PDF file{count !== 1 && "s"}{count > 1 && " (as ZIP)"}</p>}
        {result ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{result.name} · {formatBytes(result.blob.size)}</p>
            <></>
          </div>
        ) : (
          <></>
        )}
        <Button variant="outline" className="w-full" onClick={() => { reset(); setResult(null); setSel(new Set()) }}><FileUp /> Choose another PDF</Button>
      </Panel>}
    />
  )
}

const isRun = (g: number[]) => g.every((v, i) => i === 0 || v === g[i - 1] + 1)

function Loading() {
  return <div className="grid h-64 place-items-center rounded-xl border bg-card"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
}

/** Tools use files, canvas, workers and local storage, so they render only in the browser. */
const subscribeNothing = () => () => {}
export default function SplitPdf() {
  const inBrowser = useSyncExternalStore(subscribeNothing, () => true, () => false)
  if (!inBrowser) {
    return (
      <div className="grid h-64 place-items-center rounded-xl border border-dashed bg-card/50" aria-busy="true">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  return <SplitPdfTool />
}
