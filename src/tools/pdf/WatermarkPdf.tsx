"use client"
/**
 * Watermark PDF — the whole tool in one file (UI, logic and helpers). Runs entirely in the browser.
 */
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { ClipboardPaste, Download, Droplets, FileUp, ImagePlus, Loader2, Plus, ShieldCheck, Upload } from "lucide-react"
import { PDFDocument, degrees, type PDFPage } from "pdf-lib"
import * as pdfjs from "pdfjs-dist"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
/** Render text to a transparent PNG so any language/script works (Hindi, Marathi, etc.). */
async function textPng(text: string, color: string, bold: boolean) {
  const px = 160
  const c = document.createElement("canvas")
  const ctx = c.getContext("2d")!
  const font = `${bold ? "bold " : ""}${px}px Inter, "Noto Sans", "Noto Sans Devanagari", Arial, sans-serif`
  ctx.font = font
  const w = Math.ceil(ctx.measureText(text).width) + px * 0.2
  c.width = w; c.height = Math.ceil(px * 1.35)
  ctx.font = font; ctx.fillStyle = color; ctx.textBaseline = "middle"; ctx.textAlign = "center"
  ctx.fillText(text, w / 2, c.height / 2)
  const blob: Blob = await new Promise((r) => c.toBlob((b) => r(b!), "image/png"))
  return { bytes: new Uint8Array(await blob.arrayBuffer()), ratio: c.height / c.width }
}

const posStyle = (p: string) => ({
  left: p[1] === "l" ? "22%" : p[1] === "r" ? "78%" : "50%",
  top: p[0] === "t" ? "15%" : p[0] === "b" ? "85%" : "50%",
})

export default function WatermarkPdf() {
  const { pdf, load, loading, reset } = usePdf(200)
  const [text, setText] = useState("CONFIDENTIAL")
  const [color, setColor] = useState("#ef4444")
  const [opacity, setOpacity] = useState(25)
  const [angle, setAngle] = useState(45)
  const [size, setSize] = useState(60) // % of page width
  const [layout, setLayout] = useState<"center" | "tile">("center")
  const [kind, setKind] = useState<"text" | "image">("text")
  const [logo, setLogo] = useState<{ bytes: Uint8Array; png: boolean; ratio: number; url: string } | null>(null)
  const [pos, setPos] = useState("mc")
  const logoInput = useRef<HTMLInputElement>(null)
  const [bold, setBold] = useState(true)
  const [which, setWhich] = useState<"all" | "range">("all")
  const [range, setRange] = useState("1")
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Blob | null>(null)
  const dirty = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setResult(null) }

  const run = async () => {
    if (!pdf || (kind === "text" ? !text.trim() : !logo)) return
    setBusy(true)
    try {
      const pagesSel = which === "all" ? null : new Set(parseRanges(range, pdf.pages).flat())
      const doc = await loadPdfLib(pdf.bytes)
      const src = kind === "text" ? await textPng(text.trim(), color, bold) : { bytes: logo!.bytes, ratio: logo!.ratio }
      const ratio = src.ratio
      const img = kind === "image" && !logo!.png ? await doc.embedJpg(src.bytes) : await doc.embedPng(src.bytes)
      const a = (angle * Math.PI) / 180
      doc.getPages().forEach((page, i) => {
        if (pagesSel && !pagesSel.has(i)) return
        const { w, h } = visualSize(page)
        const iw = (w * (layout === "tile" ? size / 2.5 : size)) / 100
        const ih = iw * ratio
        const place = (cx: number, cy: number) => {
          // bottom-left corner such that the rotated image is centred on (cx, cy)
          const X = cx - (iw / 2) * Math.cos(a) + (ih / 2) * Math.sin(a)
          const Y = cy - (iw / 2) * Math.sin(a) - (ih / 2) * Math.cos(a)
          const p = toPage(page, X, Y)
          page.drawImage(img, { x: p.x, y: p.y, width: iw, height: ih, opacity: opacity / 100, rotate: degrees(p.rotate.angle + angle) })
        }
        if (layout === "center") {
          // 9-grid position, keeping the (rotated) mark inside the page
          const a2 = Math.abs(a), bw = iw * Math.cos(a2) + ih * Math.sin(a2), bh = iw * Math.sin(a2) + ih * Math.cos(a2)
          const m = Math.min(w, h) * 0.05
          const cx = pos[1] === "l" ? m + bw / 2 : pos[1] === "r" ? w - m - bw / 2 : w / 2
          const cy = pos[0] === "t" ? h - m - bh / 2 : pos[0] === "b" ? m + bh / 2 : h / 2
          place(cx, cy)
        }
        else {
          const gx = iw * 1.3, gy = Math.max(ih * 4, iw * 0.6)
          for (let y = gy / 2, r = 0; y < h + gy; y += gy, r++)
            for (let x = r % 2 ? gx / 2 : 0; x < w + gx; x += gx) place(x, y)
        }
      })
      setResult(await pdfBytesToBlob(doc))
      toast.success("Watermark added")
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }

  const pv = useMemo(() => ({ color, opacity: opacity / 100, transform: `translate(-50%,-50%) rotate(${-angle}deg)` }), [color, opacity, angle])
  const name = pdf ? `${baseName(pdf.file.name)}-watermarked.pdf` : ""
  if (!pdf) return loading ? <Loading /> : <FileDrop accept="application/pdf,.pdf" multiple={false} onFiles={(f) => { setResult(null); load(f) }} title="Drop a PDF" />

  return (
    <ToolGrid
      main={<>
        <p className="px-1 text-sm"><b>{pdf.file.name}</b> <span className="text-muted-foreground">· {pdf.pages} pages · preview</span></p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
          {pdf.thumbs.slice(0, 12).map((t, i) => (
            <PdfPageThumb key={i} src={t} n={i + 1}>
              <div className="pointer-events-none absolute inset-2 bottom-7 overflow-hidden">
                {kind === "image" && logo ? (
                  layout === "center" ? <img src={logo.url} alt="" className="absolute" style={{ ...pv, ...posStyle(pos), width: `${size}%` }} />
                    : Array.from({ length: 9 }).map((_, k) => <img key={k} src={logo.url} alt="" className="absolute" style={{ ...pv, left: `${(k % 3) * 35 + 15}%`, top: `${Math.floor(k / 3) * 33 + 15}%`, width: `${size / 2.5}%` }} />)
                ) : layout === "center" ? (
                  <span className="absolute font-bold whitespace-nowrap" style={{ ...pv, ...posStyle(pos), fontSize: `${size / 9}px`, fontWeight: bold ? 700 : 400 }}>{text}</span>
                ) : (
                  Array.from({ length: 12 }).map((_, k) => (
                    <span key={k} className="absolute whitespace-nowrap" style={{ ...pv, left: `${(k % 3) * 40 + 10}%`, top: `${Math.floor(k / 3) * 28 + 8}%`, fontSize: `${size / 22}px`, fontWeight: bold ? 700 : 400 }}>{text}</span>
                  ))
                )}
              </div>
            </PdfPageThumb>
          ))}
        </div>
      </>}
      side={<Panel title="Watermark">
        <Segmented value={kind} onChange={dirty(setKind)} options={[{ value: "text", label: "Text" }, { value: "image", label: "Logo / image" }]} />
        {kind === "text" ? (
          <>
            <Field label="Text"><Input value={text} onChange={(e) => dirty(setText)(e.target.value)} maxLength={60} /></Field>
            <p className="-mt-3 text-xs text-muted-foreground">Any language works — English, हिंदी, मराठी…</p>
          </>
        ) : (
          <Field label="Logo">
            <input ref={logoInput} type="file" accept="image/png,image/jpeg" className="hidden" onChange={async (e) => {
              const f = e.target.files?.[0]; e.target.value = ""
              if (!f) return
              const bytes = new Uint8Array(await f.arrayBuffer())
              const url = URL.createObjectURL(f)
              const im = new Image(); im.src = url; await im.decode().catch(() => null)
              if (!im.naturalWidth) return toast.error("Use a PNG or JPG image")
              setLogo({ bytes, png: f.type.includes("png"), ratio: im.naturalHeight / im.naturalWidth, url }); setResult(null)
            }} />
            <Button variant="outline" className="w-full" onClick={() => logoInput.current?.click()}><ImagePlus /> {logo ? "Change logo" : "Upload PNG / JPG"}</Button>
            {logo && <img src={logo.url} alt="Logo" className="mx-auto max-h-16" />}
          </Field>
        )}
        <Field label="Layout"><Segmented value={layout} onChange={dirty(setLayout)} options={[{ value: "center", label: "Single" }, { value: "tile", label: "Tiled" }]} /></Field>
        {layout === "center" && (
          <Field label="Position">
            <div className="grid w-28 grid-cols-3 gap-1">
              {["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"].map((p) => (
                <button key={p} aria-label={p} onClick={() => dirty(setPos)(p)} className={cn("aspect-square cursor-pointer rounded-md border", pos === p ? "border-primary bg-primary" : "bg-muted hover:bg-accent")} />
              ))}
            </div>
          </Field>
        )}
        {kind === "text" && <ColorField label="Color" value={color} onChange={dirty(setColor)} swatches={["#ef4444", "#000000", "#6b7280", "#2563eb", "#16a34a"]} />}
        <SliderField label="Size" value={size} onChange={dirty(setSize)} min={15} max={100} suffix="%" />
        <SliderField label="Opacity" value={opacity} onChange={dirty(setOpacity)} min={5} max={100} suffix="%" />
        <SliderField label="Angle" value={angle} onChange={dirty(setAngle)} min={-90} max={90} suffix="°" />
        {kind === "text" && <SwitchRow label="Bold" checked={bold} onChange={dirty(setBold)} />}
        <Field label="Pages">
          <Segmented value={which} onChange={dirty(setWhich)} options={[{ value: "all", label: "All pages" }, { value: "range", label: "Choose" }]} />
          {which === "range" && <Input value={range} onChange={(e) => dirty(setRange)(e.target.value)} placeholder="e.g. 1-3, 5" />}
        </Field>
        {result ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{name} · {formatBytes(result.size)}</p>
            <Button size="lg" className="w-full" onClick={() => saveBlob(result, name)}><Download /> Download PDF</Button>
          </div>
        ) : (
          <Button size="lg" className="w-full" disabled={busy || (kind === "text" ? !text.trim() : !logo)} onClick={run}>{busy ? <Loader2 className="animate-spin" /> : <Droplets />} Add watermark</Button>
        )}
        <Button variant="outline" className="w-full" onClick={() => { reset(); setResult(null) }}><FileUp /> Choose another PDF</Button>
      </Panel>}
    />
  )
}
