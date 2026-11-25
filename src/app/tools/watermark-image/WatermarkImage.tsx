"use client"
/**
 * Watermark Image — the whole tool in one file (UI, logic and helpers). Runs entirely in the browser.
 */
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import JSZip from "jszip"
import { ArrowRight, ClipboardPaste, Columns2, Download, FileArchive, ImagePlus, Loader2, Plus, ShieldCheck, Stamp, Trash2, Upload, X, SlidersHorizontal } from "lucide-react"
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
type Pos = "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br" | "custom"
const FONTS = [
  { v: "Inter, Arial, sans-serif", l: "Sans" },
  { v: "Georgia, 'Times New Roman', serif", l: "Serif" },
  { v: "'Courier New', monospace", l: "Mono" },
  { v: "Impact, 'Arial Black', sans-serif", l: "Impact" },
  { v: "'Brush Script MT', 'Segoe Script', cursive", l: "Script" },
]
interface WM {
  kind: "text" | "logo"; text: string; size: number; color: string; opacity: number; angle: number
  pos: Pos; tile: boolean; margin: number; shadow: boolean
  font: string; italic: boolean; bold: boolean; outline: boolean; gap: number; cx: number; cy: number
}

function paint(ctx: CanvasRenderingContext2D, W: number, H: number, s: WM, logo: HTMLImageElement | null) {
  const unit = Math.min(W, H)
  let ew: number, eh: number
  if (s.kind === "text") {
    ctx.font = `${s.italic ? "italic " : ""}${s.bold ? "bold " : ""}${Math.max(6, (unit * s.size) / 100)}px ${s.font}`
    ew = ctx.measureText(s.text).width
    eh = (unit * s.size) / 100
  } else {
    if (!logo) return
    ew = (W * s.size * 2.5) / 100
    eh = ew * (logo.naturalHeight / logo.naturalWidth)
  }
  const drawAt = (cx: number, cy: number) => {
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate((s.angle * Math.PI) / 180)
    ctx.globalAlpha = s.opacity / 100
    if (s.kind === "text") {
      ctx.textAlign = "center"; ctx.textBaseline = "middle"
      if (s.shadow) { ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = eh * 0.15; ctx.shadowOffsetY = eh * 0.05 }
      ctx.fillStyle = s.color
      ctx.fillText(s.text, 0, 0)
      if (s.outline) { ctx.shadowColor = "transparent"; ctx.lineWidth = Math.max(1, eh * 0.06); ctx.strokeStyle = isLightHex(s.color) ? "#000" : "#fff"; ctx.strokeText(s.text, 0, 0) }
    } else ctx.drawImage(logo!, -ew / 2, -eh / 2, ew, eh)
    ctx.restore()
  }
  if (s.tile) {
    const g = s.gap / 100
    const gx = ew * (1 + g) + unit * 0.03, gy = eh * (1 + g * 4) + unit * 0.03
    for (let y = gy / 2, row = 0; y < H + gy; y += gy, row++)
      for (let x = (row % 2 ? gx / 2 : 0); x < W + gx; x += gx) drawAt(x, y)
    return
  }
  if (s.pos === "custom") { drawAt(s.cx * W, s.cy * H); return }
  const m = (unit * s.margin) / 100
  const col = s.pos[1], row = s.pos[0]
  const cx = col === "l" ? m + ew / 2 : col === "r" ? W - m - ew / 2 : W / 2
  const cy = row === "t" ? m + eh / 2 : row === "b" ? H - m - eh / 2 : H / 2
  drawAt(cx, cy)
}

const isLightHex = (h: string) => { const n = parseInt(h.slice(1), 16); return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 > 150 }
const POS: Pos[] = ["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"]

function WatermarkImageTool() {
  const [s, setS] = useState<WM>({ kind: "text", text: "© Your Brand", size: 6, color: "#ffffff", opacity: 60, angle: 0, pos: "br", tile: false, margin: 3, shadow: true, font: FONTS[0].v, italic: false, bold: true, outline: false, gap: 60, cx: 0.5, cy: 0.5 })
  const [logo, setLogo] = useState<HTMLImageElement | null>(null)
  const [format, setFormat] = useState<FormatChoice>("keep")
  const [quality, setQuality] = useState(92)
  const [active, setActive] = useState(0)
  const b = useImageBatch([s, logo, format, quality])
  const canvas = useRef<HTMLCanvasElement>(null)
  const logoInput = useRef<HTMLInputElement>(null)
  const set = <K extends keyof WM>(k: K, v: WM[K]) => setS((p) => ({ ...p, [k]: v }))

  const cur = b.items[Math.min(active, b.items.length - 1)]

  useEffect(() => {
    if (!cur || !canvas.current) return
    const k = Math.min(1, 900 / Math.max(cur.w, cur.h))
    const c = canvas.current
    c.width = Math.round(cur.w * k); c.height = Math.round(cur.h * k)
    const ctx = c.getContext("2d")!
    ctx.drawImage(cur.img, 0, 0, c.width, c.height)
    paint(ctx, c.width, c.height, s, logo)
  }, [cur, s, logo])

  const process = async (it: BatchItem) => {
    const out = resolveFormat(format, it.file.type)
    const { c, ctx } = newCanvas(it.w, it.h)
    if (out === "jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, it.w, it.h) }
    ctx.drawImage(it.img, 0, 0, it.w, it.h)
    paint(ctx, it.w, it.h, s, logo)
    const blob = await canvasToBlob(c, out, quality / 100)
    return { blob, name: `${baseName(it.file.name)}-watermarked.${EXT[out]}`, dims: `${it.w}×${it.h}` }
  }

  if (!b.items.length) return <FileDrop accept={ACCEPTED} onFiles={b.add} paste hint="Add the photos you want to protect" />

  const runBtn = (
    <Button size="lg" className="w-full" disabled={b.running || (s.kind === "logo" && !logo) || (s.kind === "text" && !s.text.trim())} onClick={() => b.run(process)}>
      {b.running ? <Loader2 className="animate-spin" /> : <Stamp />} Watermark {b.items.length} image{b.items.length > 1 && "s"}
    </Button>
  )
  return (
    <ToolGrid settingsLabel="Watermark"
      action={runBtn}
      main={<>
        <div className="grid place-items-center rounded-xl border bg-muted p-4">
          <canvas ref={canvas} className={cn("max-h-[65vh] max-w-full rounded shadow", !s.tile && "cursor-crosshair")} title={s.tile ? undefined : "Click to place the watermark here"}
            onClick={(e) => { if (s.tile) return; const r = e.currentTarget.getBoundingClientRect(); setS((p) => ({ ...p, pos: "custom", cx: (e.clientX - r.left) / r.width, cy: (e.clientY - r.top) / r.height })) }} />
          {!s.tile && <p className="mt-2 text-xs text-muted-foreground">Tip: click on the image to place the watermark exactly.</p>}
        </div>
        {b.items.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {b.items.map((it, i) => (
              <button key={it.id} onClick={() => setActive(i)} className={cn("size-16 shrink-0 cursor-pointer overflow-hidden rounded-md border-2", i === active ? "border-primary" : "border-transparent opacity-70")}>
                <img src={it.url} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <FileDrop compact accept={ACCEPTED} onFiles={b.add} title="Add more images" paste />
        {b.hasOutput && <ResultList rows={b.rows} onRemove={b.remove} zipName="watermarked-images.zip" showSaving={false} />}
      </>}
      side={<Panel title="Watermark">
        <Segmented value={s.kind} onChange={(v) => set("kind", v)} options={[{ value: "text", label: "Text" }, { value: "logo", label: "Logo / image" }]} />
        {s.kind === "text" ? (
          <>
            <Field label="Text"><Input value={s.text} onChange={(e) => set("text", e.target.value)} maxLength={80} /></Field>
            <Field label="Font"><Segmented value={s.font} onChange={(v) => set("font", v)} options={FONTS.map((f) => ({ value: f.v, label: <span style={{ fontFamily: f.v }}>{f.l}</span> }))} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Button variant={s.bold ? "default" : "outline"} size="sm" onClick={() => set("bold", !s.bold)} className="font-bold">B Bold</Button>
              <Button variant={s.italic ? "default" : "outline"} size="sm" onClick={() => set("italic", !s.italic)} className="italic">I Italic</Button>
            </div>
            <ColorField label="Color" value={s.color} onChange={(v) => set("color", v)} />
            <SwitchRow label="Shadow" desc="Keeps text readable on any photo" checked={s.shadow} onChange={(v) => set("shadow", v)} />
            <SwitchRow label="Outline" desc="Thin contrasting border around letters" checked={s.outline} onChange={(v) => set("outline", v)} />
          </>
        ) : (
          <Field label="Logo">
            <input ref={logoInput} type="file" accept="image/*" className="hidden" onChange={async (e) => {
              const f = e.target.files?.[0]; e.target.value = ""
              if (!f) return
              try { setLogo((await fileToImage(f)).img) } catch { toast.error("Could not read logo") }
            }} />
            <Button variant="outline" className="w-full" onClick={() => logoInput.current?.click()}><ImagePlus /> {logo ? "Change logo" : "Upload logo (PNG works best)"}</Button>
          </Field>
        )}
        <SliderField label="Size" value={s.size} onChange={(v) => set("size", v)} min={1} max={30} suffix="%" />
        <SliderField label="Opacity" value={s.opacity} onChange={(v) => set("opacity", v)} min={5} max={100} suffix="%" />
        <SliderField label="Rotation" value={s.angle} onChange={(v) => set("angle", v)} min={-90} max={90} suffix="°" />
        <SwitchRow label="Tile across image" desc="Repeat the watermark everywhere" checked={s.tile} onChange={(v) => set("tile", v)} />
        {s.tile && <SliderField label="Tile spacing" value={s.gap} onChange={(v) => set("gap", v)} min={10} max={200} suffix="%" />}
        {!s.tile && (
          <>
            <Field label="Position">
              <div className="grid w-32 grid-cols-3 gap-1">
                {POS.map((p) => (
                  <button key={p} aria-label={p} onClick={() => set("pos", p)} className={cn("aspect-square cursor-pointer rounded-md border", s.pos === p ? "border-primary bg-primary" : "bg-muted hover:bg-accent")} />
                ))}
              </div>
            </Field>
            {s.pos === "custom" && <p className="text-xs text-muted-foreground">Custom position set by clicking the image.</p>}
            <SliderField label="Edge margin" value={s.margin} onChange={(v) => set("margin", v)} min={0} max={15} suffix="%" />
          </>
        )}
        <OutputFormatFields format={format} setFormat={setFormat} quality={quality} setQuality={setQuality} />
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
export default function WatermarkImage() {
  const inBrowser = useSyncExternalStore(subscribeNothing, () => true, () => false)
  if (!inBrowser) {
    return (
      <div className="grid h-64 place-items-center rounded-xl border border-dashed bg-card/50" aria-busy="true">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  return <WatermarkImageTool />
}
