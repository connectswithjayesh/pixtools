"use client"
/**
 * Crop Image — the whole tool in one file (UI, logic and helpers). Runs entirely in the browser.
 */
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { ClipboardPaste, Crop as CropIcon, Download, FlipHorizontal2, FlipVertical2, ImageUp, Loader2, Plus, RotateCcw, RotateCw, ShieldCheck, Undo2, Upload, SlidersHorizontal } from "lucide-react"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import ReactCrop, { centerCrop, makeAspectCrop, type PercentCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
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

/** Turn a canvas back into an <img> (object URL) for further editing. */
async function loadImageFromCanvas(c: HTMLCanvasElement) {
  const blob = await canvasToBlob(c, "png")
  const url = URL.createObjectURL(blob)
  return { img: await loadImage(url), url }
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

/* ═══════════════ Tool ═══════════════ */
const RATIOS: { label: string; v: number | undefined }[] = [
  { label: "Free", v: undefined }, { label: "1:1", v: 1 }, { label: "4:3", v: 4 / 3 }, { label: "3:4", v: 3 / 4 },
  { label: "16:9", v: 16 / 9 }, { label: "9:16", v: 9 / 16 }, { label: "3:2", v: 3 / 2 }, { label: "2:3", v: 2 / 3 },
]

const full: PercentCrop = { unit: "%", x: 0, y: 0, width: 100, height: 100 }

export default function CropImage() {
  const [src, setSrc] = useState<{ file: File; url: string; img: HTMLImageElement; w: number; h: number } | null>(null)
  const [crop, setCrop] = useState<PercentCrop>(full)
  const [ratio, setRatio] = useState("Free")
  const [circle, setCircle] = useState(false)
  const [format, setFormat] = useState<FormatChoice>("keep")
  const [quality, setQuality] = useState(92)
  const [busy, setBusy] = useState(false)
  const [working, setWorking] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const load = async (files: File[]) => {
    try {
      const r = await fileToImage(files[0])
      if (src) URL.revokeObjectURL(src.url)
      setSrc({ file: files[0], ...r }); setCrop(full); setRatio("Free")
    } catch { toast.error("Could not read this image") }
  }

  const applyRatio = (label: string) => {
    setRatio(label)
    const v = RATIOS.find((r) => r.label === label)?.v
    if (!src || !v) { if (!v) setCrop(full); return }
    setCrop(centerCrop(makeAspectCrop({ unit: "%", width: 90 }, v, src.w, src.h), src.w, src.h))
  }

  const aspect = circle ? 1 : RATIOS.find((r) => r.label === ratio)?.v

  const px = src ? {
    x: Math.round((crop.x / 100) * src.w), y: Math.round((crop.y / 100) * src.h),
    w: Math.max(1, Math.round((crop.width / 100) * src.w)), h: Math.max(1, Math.round((crop.height / 100) * src.h)),
  } : null

  /** Bake a rotation/flip into the source image. */
  const transform = async (kind: "l" | "r" | "h" | "v") => {
    if (!src || working) return
    setWorking(true)
    const swap = kind === "l" || kind === "r"
    const { c, ctx } = newCanvas(swap ? src.h : src.w, swap ? src.w : src.h)
    ctx.translate(c.width / 2, c.height / 2)
    if (kind === "l") ctx.rotate(-Math.PI / 2)
    if (kind === "r") ctx.rotate(Math.PI / 2)
    if (kind === "h") ctx.scale(-1, 1)
    if (kind === "v") ctx.scale(1, -1)
    ctx.drawImage(src.img, -src.w / 2, -src.h / 2, src.w, src.h)
    const { img, url } = await loadImageFromCanvas(c)
    URL.revokeObjectURL(src.url)
    setSrc({ ...src, img, url, w: c.width, h: c.height }); setCrop(full); setRatio("Free")
    setWorking(false)
  }

  /** Set crop from exact pixel values typed by the user. */
  const setPx = (k: "x" | "y" | "w" | "h", v: number) => {
    if (!src || !px) return
    const n = { ...px, [k]: Math.max(k === "w" || k === "h" ? 1 : 0, Math.round(v || 0)) }
    n.w = Math.min(n.w, src.w); n.h = Math.min(n.h, src.h)
    n.x = Math.min(n.x, src.w - n.w); n.y = Math.min(n.y, src.h - n.h)
    setRatio("Free")
    setCrop({ unit: "%", x: (n.x / src.w) * 100, y: (n.y / src.h) * 100, width: (n.w / src.w) * 100, height: (n.h / src.h) * 100 })
  }

  const doCrop = async () => {
    if (!src || !px) return
    setBusy(true)
    try {
      const out = circle ? (format === "jpeg" ? "png" : resolveFormat(format === "keep" ? "png" : format, src.file.type)) : resolveFormat(format, src.file.type)
      const { c, ctx } = newCanvas(px.w, px.h)
      if (out === "jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height) }
      if (circle) { ctx.beginPath(); ctx.ellipse(px.w / 2, px.h / 2, px.w / 2, px.h / 2, 0, 0, Math.PI * 2); ctx.clip() }
      ctx.drawImage(src.img, px.x, px.y, px.w, px.h, 0, 0, px.w, px.h)
      const blob = await canvasToBlob(c, out, quality / 100)
      await saveBlob(blob, `${baseName(src.file.name)}-cropped.${EXT[out]}`)
      toast.success(`Cropped to ${px.w}×${px.h} · ${formatBytes(blob.size)}`)
    } catch { toast.error("Crop failed") } finally { setBusy(false) }
  }

  if (!src) return <FileDrop accept={ACCEPTED} multiple={false} onFiles={load} paste hint="JPG, PNG, WEBP and more" />

  const runBtn = (
    <Button size="lg" className="w-full" disabled={busy || working} onClick={doCrop}>{busy ? <Loader2 className="animate-spin" /> : <><CropIcon /><Download /></>} Crop &amp; download</Button>
  )
  return (
    <ToolGrid settingsLabel="Crop options"
      action={runBtn}
      main={<div className="grid place-items-center rounded-xl border bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:20px_20px] p-4">
        <ReactCrop key={src.url}
          crop={crop} aspect={aspect} circularCrop={circle} keepSelection ruleOfThirds
          onChange={(_, pc) => setCrop(pc)}
        >
          <img ref={imgRef} src={src.url} alt="To crop" className="max-h-[70vh] w-auto" />
        </ReactCrop>
      </div>}
      side={<Panel title="Crop">
        <Field label="Aspect ratio">
          <div className="grid grid-cols-4 gap-1.5">
            {RATIOS.map((r) => (
              <Button key={r.label} size="sm" variant={ratio === r.label && !circle ? "default" : "outline"} disabled={circle} onClick={() => applyRatio(r.label)}>{r.label}</Button>
            ))}
          </div>
        </Field>
        <SwitchRow label="Circle crop" desc="Round avatar with transparent corners (PNG/WEBP)" checked={circle} onChange={(v) => { setCircle(v); if (v) { setRatio("1:1"); applyRatio("1:1") } }} />
        {px && (
          <Field label="Exact crop (pixels)" hint={`image ${src.w}×${src.h}`}>
            <div className="grid grid-cols-2 gap-2">
              {([["w", "Width"], ["h", "Height"], ["x", "Left (X)"], ["y", "Top (Y)"]] as const).map(([k, l]) => (
                <label key={k} className="space-y-1 text-xs text-muted-foreground">{l}
                  <Input type="number" min={0} value={px[k]} disabled={working || (!!aspect && (k === "w" || k === "h"))} onChange={(e) => setPx(k, +e.target.value)} className="h-8" />
                </label>
              ))}
            </div>
            {aspect && <p className="text-xs text-muted-foreground">Choose “Free” to type width & height.</p>}
          </Field>
        )}
        <Field label="Rotate / flip image">
          <div className="grid grid-cols-4 gap-1.5">
            <Button variant="outline" size="sm" aria-label="Rotate left" disabled={working} onClick={() => transform("l")}><RotateCcw /></Button>
            <Button variant="outline" size="sm" aria-label="Rotate right" disabled={working} onClick={() => transform("r")}><RotateCw /></Button>
            <Button variant="outline" size="sm" aria-label="Flip horizontal" disabled={working} onClick={() => transform("h")}><FlipHorizontal2 /></Button>
            <Button variant="outline" size="sm" aria-label="Flip vertical" disabled={working} onClick={() => transform("v")}><FlipVertical2 /></Button>
          </div>
        </Field>
        {circle ? (
          <Field label="Output format"><Segmented value={format === "webp" ? "webp" : "png"} onChange={(v) => setFormat(v)} options={[{ value: "png", label: "PNG" }, { value: "webp", label: "WEBP" }]} /></Field>
        ) : (
          <OutputFormatFields format={format} setFormat={setFormat} quality={quality} setQuality={setQuality} />
        )}
        <div className="space-y-2">
          <div className="hidden lg:block">{runBtn}</div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => { setCrop(full); setRatio("Free"); setCircle(false) }}><Undo2 /> Reset</Button>
            <Button variant="outline" onClick={() => setSrc(null)}><ImageUp /> New image</Button>
          </div>
        </div>
      </Panel>}
    />
  )
}
