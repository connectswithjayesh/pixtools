"use client"
/**
 * Compress PDF — the whole tool in one file (UI, logic and helpers). Runs entirely in the browser.
 */
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { ArrowRight, ClipboardPaste, Download, FileUp, Loader2, Minimize2, Plus, ShieldCheck, TriangleAlert, Upload } from "lucide-react"
import { PDFDocument } from "pdf-lib"
import * as pdfjs from "pdfjs-dist"
import { useCallback, useEffect, useRef, useState } from "react"
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

/** Simple two-column tool layout: work area + settings sidebar. */
function ToolGrid({ main, side }: { main: React.ReactNode; side: React.ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-4">{main}</div>
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        {side}
      </aside>
    </div>
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

/* ─── helpers (from lib/qpdf.ts) ─── */
// qpdf (C++ PDF toolkit) compiled to WebAssembly — used for password protect / unlock.
// Loaded lazily (~1.3 MB) only on the pages that need it.

interface Qpdf {
  callMain: (args: string[]) => number
  FS: { writeFile: (p: string, d: Uint8Array) => void; readFile: (p: string) => Uint8Array; unlink: (p: string) => void }
}

interface QpdfResult { code: number; out: Uint8Array | null; log: string }

/** Run qpdf once on `input`. `args` receives the in/out paths. Exit 0 = ok, 3 = ok with warnings, 2 = error. */
async function runQpdf(input: Uint8Array, args: (inp: string, out: string) => string[]): Promise<QpdfResult> {
  const { default: createModule } = await import("@neslinesli93/qpdf-wasm")
  const lines: string[] = []
  // a fresh instance per run: emscripten programs are not re-entrant after main() returns
  const q = (await (createModule as unknown as (o: object) => Promise<Qpdf>)({
    locateFile: () => new URL("@neslinesli93/qpdf-wasm/dist/qpdf.wasm", import.meta.url).href,
    print: (s: string) => lines.push(s),
    printErr: (s: string) => lines.push(s),
    noExitRuntime: true,
  }))
  q.FS.writeFile("/in.pdf", input)
  let code = 2
  try { code = q.callMain(args("/in.pdf", "/out.pdf")) } catch (e) {
    const status = (e as { status?: number })?.status
    code = typeof status === "number" ? status : 2
  }
  let out: Uint8Array | null = null
  if (code === 0 || code === 3) { try { out = q.FS.readFile("/out.pdf") } catch { out = null } }
  return { code, out, log: lines.join("\n") }
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
type Level = "light" | "medium" | "strong" | "extreme"
const LEVELS: { v: Level; t: string; d: string; dpi: number; q: number }[] = [
  { v: "light", t: "Lossless", d: "Optimise structure only. Text stays selectable, no quality loss.", dpi: 0, q: 0 },
  { v: "medium", t: "Recommended", d: "Pages as 150 dpi images, good quality. Best for scans & photos.", dpi: 150, q: 0.72 },
  { v: "strong", t: "Strong", d: "110 dpi, smaller file. Fine for reading on screen.", dpi: 110, q: 0.6 },
  { v: "extreme", t: "Extreme", d: "80 dpi, smallest file. Text may look soft.", dpi: 80, q: 0.45 },
]

export default function CompressPdf() {
  const { pdf, load, loading, reset } = usePdf(160)
  const [level, setLevel] = useState<Level>("medium")
  const [gray, setGray] = useState(false)
  const [progress, setProgress] = useState<[number, number] | null>(null)
  const [result, setResult] = useState<{ blob: Blob; kept: boolean } | null>(null)

  const run = async () => {
    if (!pdf) return
    const L = LEVELS.find((l) => l.v === level)!
    setResult(null)
    try {
      let out: Uint8Array
      if (!L.dpi) {
        setProgress([0, 1])
        const r = await runQpdf(new Uint8Array(pdf.bytes), (i, o) => [i, "--object-streams=generate", "--compress-streams=y", "--recompress-flate", "--compression-level=9", "--remove-unreferenced-resources=yes", o])
        if (!r.out) throw new Error("Could not optimise this PDF")
        out = r.out
      } else {
        const doc = await PDFDocument.create()
        for (let i = 1; i <= pdf.pages; i++) {
          setProgress([i - 1, pdf.pages])
          const page = await pdf.doc.getPage(i)
          const vp = page.getViewport({ scale: 1 }) // points, after /Rotate
          const c = await renderPage(pdf.doc, i, L.dpi / 72)
          if (gray) {
            const ctx = c.getContext("2d")!; const d = ctx.getImageData(0, 0, c.width, c.height); const p = d.data
            for (let k = 0; k < p.length; k += 4) { const y = 0.299 * p[k] + 0.587 * p[k + 1] + 0.114 * p[k + 2]; p[k] = p[k + 1] = p[k + 2] = y }
            ctx.putImageData(d, 0, 0)
          }
          const jpg = await canvasToBlob(c, "jpeg", L.q)
          c.width = c.height = 0
          const img = await doc.embedJpg(new Uint8Array(await jpg.arrayBuffer()))
          const pg = doc.addPage([vp.width, vp.height])
          pg.drawImage(img, { x: 0, y: 0, width: vp.width, height: vp.height })
        }
        out = await doc.save({ useObjectStreams: true })
      }
      const blob = new Blob([out as BlobPart], { type: "application/pdf" })
      // never hand back a bigger file
      setResult(blob.size < pdf.file.size ? { blob, kept: false } : { blob: pdf.file, kept: true })
    } catch (e) { toast.error((e as Error).message || "Compression failed") } finally { setProgress(null) }
  }

  if (!pdf) return loading ? <Loading /> : <FileDrop accept="application/pdf,.pdf" multiple={false} onFiles={(f) => { setResult(null); load(f) }} title="Drop a PDF to compress" hint="Make large PDFs small enough for email, WhatsApp or upload forms" />

  const name = `${baseName(pdf.file.name)}-compressed.pdf`
  const saved = result ? Math.round((1 - result.blob.size / pdf.file.size) * 100) : 0

  return (
    <ToolGrid
      main={<>
        {result && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-accent/60 p-4">
            <div>
              <p className="flex items-center gap-2 text-lg font-semibold">{formatBytes(pdf.file.size)} <ArrowRight className="size-4" /> {formatBytes(result.blob.size)}
                {!result.kept && <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-sm text-emerald-600 dark:text-emerald-400">-{saved}%</span>}
              </p>
              {result.kept && <p className="text-sm text-muted-foreground">This PDF is already well optimised — try a stronger level.</p>}
            </div>
            <Button size="lg" onClick={() => saveBlob(result.blob, name)}><Download /> Download</Button>
          </div>
        )}
        <p className="px-1 text-sm"><b>{pdf.file.name}</b> <span className="text-muted-foreground">· {pdf.pages} pages · {formatBytes(pdf.file.size)}</span></p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-3">
          {pdf.thumbs.slice(0, 18).map((t, i) => <PdfPageThumb key={i} src={t} n={i + 1} />)}
        </div>
      </>}
      side={<Panel title="Compression level">
        <div className="space-y-2">
          {LEVELS.map((l) => (
            <button key={l.v} type="button" onClick={() => { setLevel(l.v); setResult(null) }}
              className={cn("w-full cursor-pointer rounded-lg border p-3 text-left transition-colors", level === l.v ? "border-primary bg-accent" : "hover:bg-muted")}>
              <p className="text-sm font-semibold">{l.t}</p>
              <p className="text-xs text-muted-foreground">{l.d}</p>
            </button>
          ))}
        </div>
        {level !== "light" && (
          <>
            <SwitchRow label="Black & white" desc="Even smaller for text documents" checked={gray} onChange={(v) => { setGray(v); setResult(null) }} />
            <p className="flex gap-2 text-xs text-muted-foreground"><TriangleAlert className="size-4 shrink-0 text-amber-500" /> Pages become images, so text can’t be selected or searched afterwards.</p>
          </>
        )}
        <Button size="lg" className="w-full" disabled={!!progress} onClick={run}>
          {progress ? <><Loader2 className="animate-spin" /> {level === "light" ? "Optimising…" : `Page ${progress[0] + 1} of ${progress[1]}`}</> : <><Minimize2 /> Compress PDF</>}
        </Button>
        <Button variant="outline" className="w-full" onClick={() => { reset(); setResult(null) }}><FileUp /> Choose another PDF</Button>
      </Panel>}
    />
  )
}
