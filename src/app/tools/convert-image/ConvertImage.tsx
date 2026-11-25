"use client"
/**
 * Convert Image — the whole tool in one file (UI, logic and helpers). Runs entirely in the browser.
 */
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import JSZip from "jszip"
import { ArrowRight, ClipboardPaste, Columns2, Download, FileArchive, Loader2, Plus, RefreshCw, ShieldCheck, Trash2, Upload, X, SlidersHorizontal } from "lucide-react"
import { useCallback, useEffect, useRef, useState, useMemo, useSyncExternalStore } from "react"
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

/* ─── helpers (from lib/encoders.ts) ─── */
/** 24-bit Windows BMP (transparent areas become the given background). */
function encodeBmp(c: HTMLCanvasElement, bg = "#ffffff"): Blob {
  const w = c.width, h = c.height
  const tmp = document.createElement("canvas"); tmp.width = w; tmp.height = h
  const t = tmp.getContext("2d")!; t.fillStyle = bg; t.fillRect(0, 0, w, h); t.drawImage(c, 0, 0)
  const px = t.getImageData(0, 0, w, h).data
  const row = Math.ceil((w * 3) / 4) * 4
  const size = 54 + row * h
  const buf = new ArrayBuffer(size), v = new DataView(buf)
  v.setUint8(0, 0x42); v.setUint8(1, 0x4d); v.setUint32(2, size, true); v.setUint32(10, 54, true)
  v.setUint32(14, 40, true); v.setInt32(18, w, true); v.setInt32(22, h, true); v.setUint16(26, 1, true); v.setUint16(28, 24, true)
  v.setUint32(34, row * h, true); v.setInt32(38, 2835, true); v.setInt32(42, 2835, true)
  const out = new Uint8Array(buf)
  for (let y = 0; y < h; y++) {
    const o = 54 + (h - 1 - y) * row
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      out[o + x * 3] = px[i + 2]; out[o + x * 3 + 1] = px[i + 1]; out[o + x * 3 + 2] = px[i]
    }
  }
  return new Blob([buf], { type: "image/bmp" })
}

/** Multi-size .ico (PNG-compressed entries, supported by all modern browsers & Windows Vista+). */
async function encodeIco(img: CanvasImageSource, w: number, h: number, sizes: number[]): Promise<Blob> {
  const pngs: Uint8Array[] = []
  for (const s of sizes) {
    const c = document.createElement("canvas"); c.width = c.height = s
    const ctx = c.getContext("2d")!; ctx.imageSmoothingQuality = "high"
    const k = Math.min(s / w, s / h)
    ctx.drawImage(img, (s - w * k) / 2, (s - h * k) / 2, w * k, h * k)
    const b: Blob = await new Promise((r) => c.toBlob((x) => r(x!), "image/png"))
    pngs.push(new Uint8Array(await b.arrayBuffer()))
  }
  const head = 6 + 16 * sizes.length
  const total = head + pngs.reduce((n, p) => n + p.length, 0)
  const buf = new ArrayBuffer(total), v = new DataView(buf), out = new Uint8Array(buf)
  v.setUint16(2, 1, true); v.setUint16(4, sizes.length, true)
  let off = head
  sizes.forEach((s, i) => {
    const e = 6 + i * 16
    v.setUint8(e, s >= 256 ? 0 : s); v.setUint8(e + 1, s >= 256 ? 0 : s)
    v.setUint16(e + 4, 1, true); v.setUint16(e + 6, 32, true)
    v.setUint32(e + 8, pngs[i].length, true); v.setUint32(e + 12, off, true)
    out.set(pngs[i], off); off += pngs[i].length
  })
  return new Blob([buf], { type: "image/x-icon" })
}

/* ═══════════════ Tool ═══════════════ */
type Fmt = "jpeg" | "png" | "webp" | "ico" | "bmp"
const FMT_EXT: Record<Fmt, string> = { jpeg: "jpg", png: "png", webp: "webp", ico: "ico", bmp: "bmp" }
const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256]
const HELP: Record<Fmt, string> = {
  jpeg: "Best for photos. No transparency — transparent areas get the background color.",
  png: "Lossless, keeps transparency. Larger files.",
  webp: "Modern format: small files, keeps transparency.",
  ico: "Favicon / Windows icon with several sizes inside one file.",
  bmp: "Uncompressed bitmap for old software. Very large files.",
}

function ConvertImageTool() {
  const [format, setFormat] = useState<Fmt>("jpeg")
  const [quality, setQuality] = useState(92)
  const [bg, setBg] = useState("#ffffff")
  const [sizes, setSizes] = useState<number[]>([16, 32, 48, 64, 128, 256])
  const b = useImageBatch([format, quality, bg, sizes])

  const process = async (it: BatchItem) => {
    let blob: Blob
    if (format === "ico") {
      if (!sizes.length) throw new Error("Pick at least one icon size")
      blob = await encodeIco(it.img, it.w, it.h, [...sizes].sort((a, b) => a - b))
    } else if (format === "bmp") {
      blob = encodeBmp(drawToCanvas(it.img, it.w, it.h, "png"), bg)
    } else {
      blob = await canvasToBlob(drawToCanvas(it.img, it.w, it.h, format, bg), format, quality / 100)
    }
    return { blob, name: `${baseName(it.file.name)}.${FMT_EXT[format]}`, dims: format === "ico" ? `${sizes.length} sizes` : `${it.w}×${it.h}` }
  }

  if (!b.items.length) return <FileDrop accept={ACCEPTED} onFiles={b.add} paste hint="JPG, PNG, WEBP, GIF, BMP, SVG, AVIF → JPG, PNG, WEBP, ICO or BMP" />

  const runBtn = (
    <Button size="lg" className="w-full" disabled={b.running} onClick={() => b.run(process)}>
      {b.running ? <Loader2 className="animate-spin" /> : <RefreshCw />} Convert {b.items.length} to {FMT_EXT[format].toUpperCase()}
    </Button>
  )
  return (
    <ToolGrid
      action={runBtn}
      main={<>
        <ResultList rows={b.rows} onRemove={b.remove} zipName={`converted-${FMT_EXT[format]}.zip`} showSaving={false} />
        <FileDrop compact accept={ACCEPTED} onFiles={b.add} title="Add more images" paste />
      </>}
      side={<Panel title="Convert to">
        <Field label="Format">
          <Segmented value={format} onChange={setFormat} options={[{ value: "jpeg", label: "JPG" }, { value: "png", label: "PNG" }, { value: "webp", label: "WEBP" }, { value: "ico", label: "ICO" }, { value: "bmp", label: "BMP" }]} />
          <p className="text-xs text-muted-foreground">{HELP[format]}</p>
        </Field>
        {(format === "jpeg" || format === "webp") && <SliderField label="Quality" value={quality} onChange={setQuality} min={10} max={100} step={1} suffix="%" />}
        {(format === "jpeg" || format === "bmp") && <ColorField label="Background for transparent areas" value={bg} onChange={setBg} />}
        {format === "ico" && (
          <Field label="Icon sizes" hint="px">
            <div className="flex flex-wrap gap-1.5">
              {ICO_SIZES.map((s) => (
                <button key={s} type="button" onClick={() => setSizes((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))}
                  className={cn("h-8 min-w-11 cursor-pointer rounded-md border px-2 text-xs font-medium", sizes.includes(s) ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}>{s}</button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Square images give the best icons. Non-square images are centred.</p>
          </Field>
        )}
        <div className="space-y-2">
          <div className="hidden lg:block">{runBtn}</div>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={b.clear}><Trash2 /> Clear all</Button>
        </div>
      </Panel>}
    />
  )
}

/** Tools use files, canvas, workers and local storage, so they render only in the browser. */
const subscribeNothing = () => () => {}
export default function ConvertImage() {
  const inBrowser = useSyncExternalStore(subscribeNothing, () => true, () => false)
  if (!inBrowser) {
    return (
      <div className="grid h-64 place-items-center rounded-xl border border-dashed bg-card/50" aria-busy="true">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  return <ConvertImageTool />
}
