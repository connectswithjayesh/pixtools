"use client"
/**
 * Resize Image — the whole tool in one file (UI, logic and helpers). Runs entirely in the browser.
 */
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import JSZip from "jszip"
import { ArrowRight, ClipboardPaste, Columns2, Download, FileArchive, Link2, Link2Off, Loader2, Maximize2, Plus, ShieldCheck, Trash2, Upload, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState, useMemo } from "react"
import { toast } from "sonner"

/* ─── helpers (from components/common/FileDrop.tsx) ─── */
interface FileDropProps {
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

function FileDrop({ accept, multiple = true, onFiles, title, hint, compact, paste, className }: FileDropProps) {
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

/* ─── helpers (from lib/images.ts) ─── */
const ACCEPTED = "image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp,image/svg+xml,image/avif"

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
type OutFormat = "jpeg" | "png" | "webp"
const MIME: Record<OutFormat, string> = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" }
const EXT: Record<OutFormat, string> = { jpeg: "jpg", png: "png", webp: "webp" }

function formatFromMime(mime: string): OutFormat {
  if (mime.includes("png")) return "png"
  if (mime.includes("webp")) return "webp"
  return "jpeg"
}

function newCanvas(w: number, h: number) {
  const c = document.createElement("canvas")
  c.width = Math.max(1, Math.round(w))
  c.height = Math.max(1, Math.round(h))
  const ctx = c.getContext("2d")!
  ctx.imageSmoothingQuality = "high"
  return { c, ctx }
}

function canvasToBlob(c: HTMLCanvasElement, fmt: OutFormat, quality = 0.9): Promise<Blob> {
  return new Promise((res, rej) =>
    c.toBlob((b) => (b ? res(b) : rej(new Error("Encoding failed"))), MIME[fmt], fmt === "png" ? undefined : quality)
  )
}

/** Load a File into an <img> and return it with its object URL. */
async function fileToImage(file: File) {
  const url = URL.createObjectURL(file)
  const img = await loadImage(url)
  return { img, url, w: img.naturalWidth || 1000, h: img.naturalHeight || 1000 }
}

const isImage = (f: File) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp|svg|avif)$/i.test(f.name)

/** Write a DPI value into a JPEG's JFIF header so print size is correct (e.g. passport photos). */
async function setJpegDpi(blob: Blob, dpi: number): Promise<Blob> {
  const b = new Uint8Array(await blob.arrayBuffer())
  // FFD8 FFE0 len(2) 'JFIF\0' ver(2) units(1) xd(2) yd(2)
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff && b[3] === 0xe0 && b[6] === 0x4a && b[7] === 0x46 && b[8] === 0x49 && b[9] === 0x46) {
    const d = Math.max(1, Math.min(65535, Math.round(dpi)))
    b[13] = 1; b[14] = d >> 8; b[15] = d & 255; b[16] = d >> 8; b[17] = d & 255
    return new Blob([b], { type: "image/jpeg" })
  }
  return blob
}

/* ─── helpers (from components/common/OutputFormat.tsx) ─── */
type FormatChoice = OutFormat | "keep"

function resolveFormat(choice: FormatChoice, mime: string): OutFormat {
  return choice === "keep" ? formatFromMime(mime) : choice
}

function OutputFormatFields({ format, setFormat, quality, setQuality, allowKeep = true }: {
  format: FormatChoice; setFormat: (f: FormatChoice) => void; quality: number; setQuality: (q: number) => void; allowKeep?: boolean
}) {
  const opts: { value: FormatChoice; label: string }[] = [
    ...(allowKeep ? [{ value: "keep" as const, label: "Original" }] : []),
    { value: "jpeg", label: "JPG" },
    { value: "png", label: "PNG" },
    { value: "webp", label: "WEBP" },
  ]
  return (
    <>
      <Field label="Output format"><Segmented value={format} onChange={setFormat} options={opts} /></Field>
      {format !== "png" && <SliderField label="Quality" value={quality} onChange={setQuality} min={10} max={100} step={5} suffix="%" />}
    </>
  )
}

/* ─── helpers (from components/common/CompareDialog.tsx) ─── */
/** Before/after slider comparing the original image with the processed one. */
function CompareDialog({ open, onOpenChange, before, after, beforeSize, afterSize, title }: {
  open: boolean; onOpenChange: (o: boolean) => void; before: string; after: Blob | null; beforeSize: number; afterSize: number; title: string
}) {
  const [pos, setPos] = useState(50)
  const url = useMemo(() => (after ? URL.createObjectURL(after) : ""), [after])
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogTitle className="truncate pr-6">{title}</DialogTitle>
        <DialogDescription>Drag the slider to compare. Original {formatBytes(beforeSize)} → result {formatBytes(afterSize)}</DialogDescription>
        <div className="relative mx-auto w-full select-none overflow-hidden rounded-lg bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:16px_16px]">
          <img src={url} alt="After" className="block max-h-[65vh] w-full object-contain" draggable={false} />
          <img src={before} alt="Before" draggable={false} className="absolute inset-0 block size-full object-contain"
            style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
          <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,.3)]" style={{ left: `${pos}%` }}>
            <span className="absolute top-1/2 left-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-xs font-bold text-black shadow">⇆</span>
          </div>
          <span className="absolute top-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">Before</span>
          <span className="absolute top-2 right-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">After</span>
          <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(+e.target.value)} aria-label="Compare position"
            className="absolute inset-0 size-full cursor-ew-resize opacity-0" />
        </div>
      </DialogContent>
    </Dialog>
  )
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

/* ─── helpers (from components/common/ResultList.tsx) ─── */
interface ResultRow {
  id: string
  name: string            // original name
  preview: string         // image url for thumbnail
  inSize: number
  inDims?: string
  out?: { blob: Blob; name: string; dims?: string }
  error?: string
  busy?: boolean
}

function ResultList({ rows, onRemove, zipName, showSaving = true }: {
  rows: ResultRow[]; onRemove?: (id: string) => void; zipName: string; showSaving?: boolean
}) {
  const [zipping, setZipping] = useState(false)
  const [cmp, setCmp] = useState<ResultRow | null>(null)
  const done = rows.filter((r) => r.out)
  const totalIn = done.reduce((n, r) => n + r.inSize, 0)
  const totalOut = done.reduce((n, r) => n + r.out!.blob.size, 0)

  const dlAll = async () => {
    if (!done.length) return
    try {
      if (done.length === 1) return await saveBlob(done[0].out!.blob, done[0].out!.name)
      setZipping(true)
      const z = await zipBlobs(done.map((r) => ({ name: r.out!.name, blob: r.out!.blob })))
      await saveBlob(z, zipName)
    } catch { toast.error("Download failed") } finally { setZipping(false) }
  }

  return (
    <div className="space-y-3">
      {done.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-accent/60 p-3">
          <div className="text-sm">
            <span className="font-semibold">{done.length} file{done.length > 1 && "s"} ready</span>
            {showSaving && totalIn > 0 && (
              <span className="text-muted-foreground"> · {formatBytes(totalIn)} → {formatBytes(totalOut)}{" "}
                <SaveBadge a={totalIn} b={totalOut} />
              </span>
            )}
          </div>
          <Button onClick={dlAll} disabled={zipping}>
            {zipping ? <Loader2 className="animate-spin" /> : done.length > 1 ? <FileArchive /> : <Download />}
            {done.length > 1 ? "Download all (ZIP)" : "Download"}
          </Button>
        </div>
      )}
      <ul className="divide-y rounded-xl border bg-card">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-3 p-3">
            <img src={r.preview} alt="" className="size-14 shrink-0 rounded-md border bg-muted object-contain" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" title={r.name}>{r.out?.name ?? r.name}</p>
              <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                {formatBytes(r.inSize)}{r.inDims && ` · ${r.inDims}`}
                {r.out && <><ArrowRight className="size-3" /> <span className="font-medium text-foreground">{formatBytes(r.out.blob.size)}</span>{r.out.dims && ` · ${r.out.dims}`} {showSaving && <SaveBadge a={r.inSize} b={r.out.blob.size} />}</>}
                {r.error && <span className="text-destructive">{r.error}</span>}
              </p>
            </div>
            {r.busy && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            {r.out && r.out.blob.type.startsWith("image/") && (
              <Button variant="ghost" size="sm" onClick={() => setCmp(r)} aria-label="Compare before and after"><Columns2 /> <span className="hidden md:inline">Compare</span></Button>
            )}
            {r.out && (
              <Button variant="outline" size="sm" onClick={() => saveBlob(r.out!.blob, r.out!.name).catch(() => toast.error("Download failed"))}>
                <Download /> <span className="hidden sm:inline">Download</span>
              </Button>
            )}
            {onRemove && <Button variant="ghost" size="icon-sm" aria-label="Remove" onClick={() => onRemove(r.id)}><X /></Button>}
          </li>
        ))}
      </ul>
      <CompareDialog open={!!cmp} onOpenChange={(o) => !o && setCmp(null)} before={cmp?.preview ?? ""} after={cmp?.out?.blob ?? null}
        beforeSize={cmp?.inSize ?? 0} afterSize={cmp?.out?.blob.size ?? 0} title={cmp?.out?.name ?? ""} />
    </div>
  )
}

function SaveBadge({ a, b }: { a: number; b: number }) {
  const pct = Math.round((1 - b / a) * 100)
  return (
    <span className={cn("rounded px-1 py-0.5 text-[11px] font-semibold", pct > 0 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground")}>
      {pct > 0 ? `-${pct}%` : `+${Math.abs(pct)}%`}
    </span>
  )
}

/* ─── helpers (from hooks/useImageBatch.ts) ─── */
interface BatchItem { id: string; file: File; url: string; img: HTMLImageElement; w: number; h: number }
type Output = { blob: Blob; name: string; dims?: string }

let n = 0
const batchUid = () => `b${Date.now().toString(36)}${(n++).toString(36)}`

/** Manages a list of input images plus their processed outputs. Outputs reset when `deps` change. */
function useImageBatch(deps: unknown[] = [], max = 100) {
  const [items, setItems] = useState<BatchItem[]>([])
  const [outs, setOuts] = useState<Record<string, Output>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [running, setRunning] = useState(false)
  const ref = useRef(items)
  useEffect(() => { ref.current = items })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setOuts({}); setErrors({}) }, deps)

  const add = useCallback(async (files: File[]) => {
    const imgs = files.filter(isImage)
    if (imgs.length < files.length) toast.warning(`${files.length - imgs.length} non-image file(s) skipped`)
    const room = max - ref.current.length
    if (imgs.length > room) toast.warning(`Max ${max} images at once`)
    for (const f of imgs.slice(0, Math.max(0, room))) {
      try {
        const { img, url, w, h } = await fileToImage(f)
        setItems((p) => [...p, { id: batchUid(), file: f, url, img, w, h }])
      } catch { toast.error(`Could not read ${f.name}`) }
    }
  }, [max])

  const remove = useCallback((id: string) => {
    setItems((p) => { p.filter((i) => i.id === id).forEach((i) => URL.revokeObjectURL(i.url)); return p.filter((i) => i.id !== id) })
    setOuts((o) => { const c = { ...o }; delete c[id]; return c })
  }, [])

  const clear = useCallback(() => {
    ref.current.forEach((i) => URL.revokeObjectURL(i.url))
    setItems([]); setOuts({}); setErrors({})
  }, [])

  const run = useCallback(async (fn: (it: BatchItem) => Promise<Output>) => {
    setRunning(true); setOuts({}); setErrors({})
    for (const it of ref.current) {
      try {
        const o = await fn(it)
        setOuts((p) => ({ ...p, [it.id]: o }))
      } catch (e) {
        setErrors((p) => ({ ...p, [it.id]: (e as Error).message || "Failed" }))
      }
      await new Promise((r) => setTimeout(r, 0))
    }
    setRunning(false)
  }, [])

  const rows: ResultRow[] = items.map((i) => ({
    id: i.id, name: i.file.name, preview: i.url, inSize: i.file.size, inDims: `${i.w}×${i.h}`,
    out: outs[i.id], error: errors[i.id], busy: running && !outs[i.id] && !errors[i.id],
  }))

  return { items, add, remove, clear, run, running, rows, hasOutput: Object.keys(outs).length > 0 }
}

/* ═══════════════ Tool ═══════════════ */
type Mode = "pixels" | "percent" | "preset"
type PresetFit = "cover" | "contain"
type Unit = "px" | "cm" | "mm" | "in"
const toPx = (v: number, u: Unit, dpi: number) => (u === "px" ? v : u === "in" ? v * dpi : u === "cm" ? (v / 2.54) * dpi : (v / 25.4) * dpi)

const PRESETS: { id: string; label: string; w: number; h: number }[] = [
  { id: "ig-post", label: "Instagram Post · 1080×1080", w: 1080, h: 1080 },
  { id: "ig-portrait", label: "Instagram Portrait · 1080×1350", w: 1080, h: 1350 },
  { id: "ig-story", label: "Instagram / WhatsApp Story · 1080×1920", w: 1080, h: 1920 },
  { id: "fb-post", label: "Facebook Post · 1200×630", w: 1200, h: 630 },
  { id: "fb-cover", label: "Facebook Cover · 820×312", w: 820, h: 312 },
  { id: "yt-thumb", label: "YouTube Thumbnail · 1280×720", w: 1280, h: 720 },
  { id: "x-post", label: "X / Twitter Post · 1600×900", w: 1600, h: 900 },
  { id: "li-banner", label: "LinkedIn Banner · 1584×396", w: 1584, h: 396 },
  { id: "passport", label: "Passport photo (35×45 mm) · 413×531", w: 413, h: 531 },
  { id: "hd", label: "Full HD · 1920×1080", w: 1920, h: 1080 },
]

export default function ResizeImage() {
  const [mode, setMode] = useState<Mode>("pixels")
  const [w, setW] = useState("1280")
  const [h, setH] = useState("")
  const [lock, setLock] = useState(true)
  const [percent, setPercent] = useState(50)
  const [preset, setPreset] = useState(PRESETS[0].id)
  const [fit, setFit] = useState<PresetFit>("cover")
  const [bg, setBg] = useState("#ffffff")
  const [unit, setUnit] = useState<Unit>("px")
  const [dpi, setDpi] = useState(300)
  const [noUpscale, setNoUpscale] = useState(false)
  const [format, setFormat] = useState<FormatChoice>("keep")
  const [quality, setQuality] = useState(90)
  const b = useImageBatch([mode, w, h, lock, percent, preset, fit, bg, format, quality, unit, dpi, noUpscale])

  const first = b.items[0]
  // when locked and the user edits one side, show the other for the first image as a hint
  const round = (n: number) => String(unit === "px" ? Math.round(n) : Math.round(n * 100) / 100)
  const onW = (v: string) => { setW(v); if (lock && first && v) setH(round((+v * first.h) / first.w)) }
  const onH = (v: string) => { setH(v); if (lock && first && v) setW(round((+v * first.w) / first.h)) }
  const changeUnit = (u: Unit) => {
    // convert the typed numbers to the new unit
    const conv = (v: string) => { if (!v) return v; const px = toPx(+v, unit, dpi); const n = u === "px" ? px : u === "in" ? px / dpi : u === "cm" ? (px / dpi) * 2.54 : (px / dpi) * 25.4; return String(u === "px" ? Math.round(n) : Math.round(n * 100) / 100) }
    setW(conv(w)); setH(conv(h)); setUnit(u)
  }

  const process = async (it: BatchItem) => {
    const out = resolveFormat(format, it.file.type)
    let cw: number, ch: number
    let draw = { x: 0, y: 0, w: 0, h: 0 }
    if (mode === "percent") {
      cw = it.w * percent / 100; ch = it.h * percent / 100
      draw = { x: 0, y: 0, w: cw, h: ch }
    } else if (mode === "pixels") {
      const tw = Math.round(toPx(parseFloat(w) || 0, unit, dpi)), th = Math.round(toPx(parseFloat(h) || 0, unit, dpi))
      if (!tw && !th) throw new Error("Enter a width or height")
      if (lock) {
        const k = tw && th ? Math.min(tw / it.w, th / it.h) : tw ? tw / it.w : th / it.h
        cw = it.w * k; ch = it.h * k
      } else { cw = tw || it.w; ch = th || it.h }
      draw = { x: 0, y: 0, w: cw, h: ch }
    } else {
      const p = PRESETS.find((x) => x.id === preset)!
      cw = p.w; ch = p.h
      const k = fit === "cover" ? Math.max(cw / it.w, ch / it.h) : Math.min(cw / it.w, ch / it.h)
      const dw = it.w * k, dh = it.h * k
      draw = { x: (cw - dw) / 2, y: (ch - dh) / 2, w: dw, h: dh }
    }
    if (noUpscale && mode !== "preset" && (cw > it.w || ch > it.h)) { cw = it.w; ch = it.h; draw = { x: 0, y: 0, w: cw, h: ch } }
    const { c, ctx } = newCanvas(cw, ch)
    if (out === "jpeg" || (mode === "preset" && fit === "contain")) { ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height) }
    ctx.drawImage(it.img, draw.x, draw.y, draw.w, draw.h)
    let blob = await canvasToBlob(c, out, quality / 100)
    if (out === "jpeg") blob = await setJpegDpi(blob, mode === "pixels" && unit !== "px" ? dpi : mode === "preset" && preset === "passport" ? 300 : 72)
    return { blob, name: `${baseName(it.file.name)}-${c.width}x${c.height}.${EXT[out]}`, dims: `${c.width}×${c.height}` }
  }

  if (!b.items.length) return <FileDrop accept={ACCEPTED} onFiles={b.add} paste hint="Resize one image or a whole batch" />

  return (
    <ToolGrid
      main={<>
        <ResultList rows={b.rows} onRemove={b.remove} zipName="resized-images.zip" showSaving={false} />
        <FileDrop compact accept={ACCEPTED} onFiles={b.add} title="Add more images" paste />
      </>}
      side={<Panel title="Resize">
        <Segmented value={mode} onChange={setMode} options={[{ value: "pixels", label: "Pixels" }, { value: "percent", label: "Percent" }, { value: "preset", label: "Presets" }]} />
        {mode === "pixels" && (
          <div className="space-y-2">
            <Segmented value={unit} onChange={changeUnit} options={[{ value: "px", label: "px" }, { value: "cm", label: "cm" }, { value: "mm", label: "mm" }, { value: "in", label: "inch" }]} />
            {unit !== "px" && (
              <Field label="Print resolution" hint="DPI">
                <Segmented value={String(dpi)} onChange={(v) => setDpi(+v)} options={[{ value: "72", label: "72" }, { value: "150", label: "150" }, { value: "200", label: "200" }, { value: "300", label: "300" }, { value: "600", label: "600" }]} />
              </Field>
            )}
            <div className="flex items-end gap-2">
              <Field label="Width" className="flex-1"><Input type="number" min={0} step="any" value={w} onChange={(e) => onW(e.target.value)} placeholder="auto" /></Field>
              <Button variant={lock ? "default" : "outline"} size="icon" aria-label="Lock aspect ratio" onClick={() => setLock((l) => !l)}>{lock ? <Link2 /> : <Link2Off />}</Button>
              <Field label="Height" className="flex-1"><Input type="number" min={0} step="any" value={h} onChange={(e) => onH(e.target.value)} placeholder="auto" /></Field>
            </div>
            <p className="text-xs text-muted-foreground">{lock ? "Aspect ratio locked — each image fits inside this size without distortion." : "Unlocked — every image is stretched to exactly this size."}{unit !== "px" && ` ${Math.round(toPx(parseFloat(w) || 0, unit, dpi))}×${Math.round(toPx(parseFloat(h) || 0, unit, dpi))} px at ${dpi} DPI.`}</p>
          </div>
        )}
        {mode !== "preset" && <SwitchRow label="Don’t enlarge small images" desc="Keep images that are already smaller" checked={noUpscale} onChange={setNoUpscale} />}
        {mode === "percent" && <SliderField label="Scale" value={percent} onChange={setPercent} min={5} max={300} step={5} suffix="%" />}
        {mode === "preset" && (
          <>
            <Field label="Size">
              <Select items={PRESETS.map((p) => ({ value: p.id, label: p.label }))} value={preset} onValueChange={(v) => v && setPreset(v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{PRESETS.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Fit">
              <Segmented value={fit} onChange={setFit} options={[{ value: "cover", label: "Fill (crop)" }, { value: "contain", label: "Fit (add border)" }]} />
            </Field>
            {fit === "contain" && <ColorField label="Border color" value={bg} onChange={setBg} />}
          </>
        )}
        <OutputFormatFields format={format} setFormat={setFormat} quality={quality} setQuality={setQuality} />
        <div className="space-y-2">
          <Button size="lg" className="w-full" disabled={b.running} onClick={() => b.run(process)}>
            {b.running ? <Loader2 className="animate-spin" /> : <Maximize2 />} Resize {b.items.length} image{b.items.length > 1 && "s"}
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={b.clear}><Trash2 /> Clear all</Button>
        </div>
      </Panel>}
    />
  )
}
