"use client"
/**
 * Compress Image — the whole tool in one file (UI, logic and helpers). Runs entirely in the browser.
 */
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import JSZip from "jszip"
import { ArrowRight, ClipboardPaste, Columns2, Download, FileArchive, Loader2, Plus, ShieldCheck, Trash2, Upload, X, Zap } from "lucide-react"
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

/* ─── helpers (from lib/canvas.ts) ─── */
type OutFormat = "jpeg" | "png" | "webp"
const MIME: Record<OutFormat, string> = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" }
const EXT: Record<OutFormat, string> = { jpeg: "jpg", png: "png", webp: "webp" }

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

/** Draw an image onto a canvas, filling the background for formats without alpha. */
function drawToCanvas(img: CanvasImageSource, w: number, h: number, fmt: OutFormat, bg = "#ffffff") {
  const { c, ctx } = newCanvas(w, h)
  if (fmt === "jpeg") { ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height) }
  ctx.drawImage(img, 0, 0, c.width, c.height)
  return c
}

const isImage = (f: File) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp|svg|avif)$/i.test(f.name)
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
type Mode = "quality" | "target"
type Fmt = "auto" | OutFormat

function autoFormat(mime: string): OutFormat {
  if (mime.includes("png") || mime.includes("webp") || mime.includes("gif") || mime.includes("svg")) return "webp"
  return "jpeg"
}

export default function CompressImage() {
  const [mode, setMode] = useState<Mode>("quality")
  const [quality, setQuality] = useState(70)
  const [targetKb, setTargetKb] = useState("200")
  const [fmt, setFmt] = useState<Fmt>("auto")
  const [maxSide, setMaxSide] = useState("")
  const [neverLarger, setNeverLarger] = useState(true)
  const b = useImageBatch([mode, quality, targetKb, fmt, maxSide, neverLarger])

  const process = async (it: BatchItem) => {
    const out: OutFormat = fmt === "auto" ? autoFormat(it.file.type) : fmt
    const lim = parseInt(maxSide) || 0
    let k = lim && Math.max(it.w, it.h) > lim ? lim / Math.max(it.w, it.h) : 1
    const name = `${baseName(it.file.name)}-compressed.${EXT[out]}`
    const enc = (scale: number, q: number) => canvasToBlob(drawToCanvas(it.img, it.w * scale, it.h * scale, out), out, q)

    let blob: Blob
    if (mode === "quality" || out === "png") {
      blob = await enc(k, quality / 100)
    } else {
      const target = Math.max(5, parseFloat(targetKb) || 100) * 1024
      let best: Blob | null = null
      for (let round = 0; round < 8 && !best; round++) {
        let lo = 0.05, hi = 0.95
        for (let i = 0; i < 7; i++) {
          const mid = (lo + hi) / 2
          const t = await enc(k, mid)
          if (t.size <= target) { best = t; lo = mid } else hi = mid
        }
        if (!best) k *= 0.8 // still too big at lowest quality: shrink dimensions
      }
      blob = best ?? (await enc(k, 0.05))
    }
    const w = Math.round(it.w * k), h = Math.round(it.h * k)
    if (neverLarger && blob.size >= it.file.size && k === 1) {
      return { blob: it.file, name: it.file.name, dims: `${it.w}×${it.h} (original kept)` }
    }
    return { blob, name, dims: `${w}×${h}` }
  }

  if (!b.items.length) return <FileDrop accept={ACCEPTED} onFiles={b.add} paste hint="JPG, PNG, WEBP, GIF, BMP — compress many at once" />

  return (
    <ToolGrid
      main={<>
        <ResultList rows={b.rows} onRemove={b.remove} zipName="compressed-images.zip" />
        <FileDrop compact accept={ACCEPTED} onFiles={b.add} title="Add more images" paste />
      </>}
      side={<Panel title="Compression">
        <Field label="Mode">
          <Segmented value={mode} onChange={setMode} options={[{ value: "quality", label: "By quality" }, { value: "target", label: "Target size" }]} />
        </Field>
        {mode === "quality" ? (
          <SliderField label="Quality" value={quality} onChange={setQuality} min={10} max={95} step={5} suffix="%" />
        ) : (
          <Field label="Max file size">
            <div className="flex items-center gap-2"><Input type="number" min={5} value={targetKb} onChange={(e) => setTargetKb(e.target.value)} /><span className="text-sm text-muted-foreground">KB</span></div>
            <div className="flex flex-wrap gap-1.5">
              {["50", "100", "200", "500", "1000"].map((v) => (
                <Button key={v} type="button" size="sm" variant={targetKb === v ? "default" : "outline"} className="h-7 px-2 text-xs" onClick={() => setTargetKb(v)}>{+v >= 1000 ? `${+v / 1000} MB` : `${v} KB`}</Button>
              ))}
            </div>
          </Field>
        )}
        <Field label="Output format">
          <Segmented value={fmt} onChange={setFmt} options={[{ value: "auto", label: "Best" }, { value: "jpeg", label: "JPG" }, { value: "webp", label: "WEBP" }, { value: "png", label: "PNG" }]} />
          <p className="text-xs text-muted-foreground">“Best” keeps JPG as JPG and turns PNG into WEBP (keeps transparency, much smaller).</p>
        </Field>
        <Field label="Limit longest side" hint="optional">
          <div className="flex items-center gap-2"><Input type="number" min={16} placeholder="e.g. 1920" value={maxSide} onChange={(e) => setMaxSide(e.target.value)} /><span className="text-sm text-muted-foreground">px</span></div>
        </Field>
        <SwitchRow label="Never make it bigger" desc="Keep the original if compression doesn’t help" checked={neverLarger} onChange={setNeverLarger} />
        <div className="space-y-2">
          <Button size="lg" className="w-full" disabled={b.running} onClick={() => b.run(process)}>
            {b.running ? <Loader2 className="animate-spin" /> : <Zap />} Compress {b.items.length} image{b.items.length > 1 && "s"}
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={b.clear}><Trash2 /> Clear all</Button>
        </div>
      </Panel>}
    />
  )
}
