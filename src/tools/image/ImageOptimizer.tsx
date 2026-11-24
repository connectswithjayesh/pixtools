"use client"
/**
 * Image Optimizer — the whole tool in one file (UI, logic and helpers). Runs entirely in the browser.
 */
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { ArrowLeftRight, ChevronDown, ClipboardPaste, Download, ImageUp, Import, Link2, Link2Off, Loader2, Maximize, Minus, Plus, RotateCw, Save, ShieldCheck, SquareDashed, TriangleAlert, Upload } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
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

/* ─── helpers (from lib/images.ts) ─── */

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
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

/* ─── helpers (from tools/image/optimizer/codecs.ts) ─── */
// Codec catalogue for the Image Optimizer. Each codec declares its option fields,
// so the settings UI is generated automatically (like Squoosh).

type EncoderType =
  | "original" | "mozjpeg" | "webp" | "avif" | "jxl" | "oxipng" | "qoi"
  | "browser-jpeg" | "browser-png" | "browser-webp"

type Opts = Record<string, number | boolean>

interface FieldBase { key: string; label: string; advanced?: boolean; show?: (o: Opts) => boolean; hint?: string }
interface RangeField extends FieldBase { type: "range"; min: number; max: number; step?: number; invert?: boolean }
interface ToggleField extends FieldBase { type: "toggle"; numeric?: boolean } // numeric: stored as 0/1
interface SelectField extends FieldBase { type: "select"; options: { value: number; label: string }[] }
type CodecField = RangeField | ToggleField | SelectField

interface Codec {
  type: EncoderType
  label: string
  ext: string
  mime: string
  /** browser can show the result directly with <img> */
  displayable: boolean
  defaults: Opts
  fields: CodecField[]
}

const CODECS: Codec[] = [
  { type: "original", label: "Original image", ext: "", mime: "", displayable: true, defaults: {}, fields: [] },
  {
    type: "mozjpeg", label: "MozJPEG", ext: "jpg", mime: "image/jpeg", displayable: true,
    defaults: {
      quality: 75, baseline: false, arithmetic: false, progressive: true, optimize_coding: true, smoothing: 0,
      color_space: 3, quant_table: 3, trellis_multipass: false, trellis_opt_zero: false, trellis_opt_table: false,
      trellis_loops: 1, auto_subsample: true, chroma_subsample: 2, separate_chroma_quality: false, chroma_quality: 75,
    },
    fields: [
      { key: "quality", label: "Quality", type: "range", min: 0, max: 100 },
      { key: "color_space", label: "Channels", type: "select", advanced: true, options: [{ value: 3, label: "YCbCr" }, { value: 2, label: "RGB" }, { value: 1, label: "Grayscale" }] },
      { key: "quant_table", label: "Quantization", type: "select", advanced: true, options: [
        { value: 0, label: "JPEG Annex K" }, { value: 1, label: "Flat" }, { value: 2, label: "MSSIM-tuned Kodak" }, { value: 3, label: "ImageMagick" },
        { value: 4, label: "PSNR-HVS-M-tuned Kodak" }, { value: 5, label: "Klein et al." }, { value: 6, label: "Watson et al." }, { value: 7, label: "Ahumada et al." }, { value: 8, label: "Peterson et al." },
      ] },
      { key: "progressive", label: "Progressive rendering", type: "toggle", advanced: true },
      { key: "optimize_coding", label: "Optimize Huffman table", type: "toggle", advanced: true, show: (o) => !o.arithmetic },
      { key: "arithmetic", label: "Arithmetic coding (low support)", type: "toggle", advanced: true },
      { key: "smoothing", label: "Smoothing", type: "range", min: 0, max: 100, advanced: true },
      { key: "auto_subsample", label: "Auto subsample chroma", type: "toggle", advanced: true, show: (o) => o.color_space === 3 },
      { key: "chroma_subsample", label: "Subsample chroma by", type: "range", min: 1, max: 4, advanced: true, show: (o) => o.color_space === 3 && !o.auto_subsample },
      { key: "separate_chroma_quality", label: "Separate chroma quality", type: "toggle", advanced: true, show: (o) => o.color_space === 3 },
      { key: "chroma_quality", label: "Chroma quality", type: "range", min: 0, max: 100, advanced: true, show: (o) => o.color_space === 3 && !!o.separate_chroma_quality },
      { key: "trellis_multipass", label: "Trellis multipass", type: "toggle", advanced: true },
      { key: "trellis_opt_zero", label: "Optimize zero block runs", type: "toggle", advanced: true, show: (o) => !!o.trellis_multipass },
      { key: "trellis_opt_table", label: "Optimize after trellis quantization", type: "toggle", advanced: true },
      { key: "trellis_loops", label: "Trellis quantization passes", type: "range", min: 1, max: 50, advanced: true },
    ],
  },
  {
    type: "webp", label: "WebP", ext: "webp", mime: "image/webp", displayable: true,
    defaults: {
      quality: 75, target_size: 0, target_PSNR: 0, method: 4, sns_strength: 50, filter_strength: 60, filter_sharpness: 0,
      filter_type: 1, partitions: 0, segments: 4, pass: 1, show_compressed: 0, preprocessing: 0, autofilter: 0,
      partition_limit: 0, alpha_compression: 1, alpha_filtering: 1, alpha_quality: 100, lossless: 0, exact: 0,
      image_hint: 0, emulate_jpeg_size: 0, thread_level: 0, low_memory: 0, near_lossless: 100, use_delta_palette: 0, use_sharp_yuv: 0,
    },
    fields: [
      { key: "lossless", label: "Lossless", type: "toggle", numeric: true },
      { key: "method", label: "Effort", type: "range", min: 0, max: 6 },
      { key: "quality", label: "Quality", type: "range", min: 0, max: 100, show: (o) => !o.lossless },
      { key: "near_lossless", label: "Slight loss", type: "range", min: 0, max: 100, invert: true, show: (o) => !!o.lossless, hint: "0 = lossless" },
      { key: "image_hint", label: "Discrete tone image", type: "select", show: (o) => !!o.lossless, options: [{ value: 0, label: "Off" }, { value: 3, label: "On (graphics/screenshots)" }] },
      { key: "alpha_quality", label: "Alpha quality", type: "range", min: 0, max: 100, advanced: true, show: (o) => !o.lossless },
      { key: "exact", label: "Preserve transparent data", type: "toggle", numeric: true, advanced: true },
      { key: "use_sharp_yuv", label: "Sharp RGB→YUV conversion", type: "toggle", numeric: true, advanced: true, show: (o) => !o.lossless },
      { key: "autofilter", label: "Auto adjust filter strength", type: "toggle", numeric: true, advanced: true, show: (o) => !o.lossless },
      { key: "filter_strength", label: "Filter strength", type: "range", min: 0, max: 100, advanced: true, show: (o) => !o.lossless && !o.autofilter },
      { key: "filter_sharpness", label: "Filter sharpness", type: "range", min: 0, max: 7, invert: true, advanced: true, show: (o) => !o.lossless },
      { key: "filter_type", label: "Strong filter", type: "toggle", numeric: true, advanced: true, show: (o) => !o.lossless },
      { key: "sns_strength", label: "Spatial noise shaping", type: "range", min: 0, max: 100, advanced: true, show: (o) => !o.lossless },
      { key: "segments", label: "Segments", type: "range", min: 1, max: 4, advanced: true, show: (o) => !o.lossless },
      { key: "partitions", label: "Partitions", type: "range", min: 0, max: 3, advanced: true, show: (o) => !o.lossless },
      { key: "pass", label: "Passes", type: "range", min: 1, max: 10, advanced: true, show: (o) => !o.lossless },
    ],
  },
  {
    type: "avif", label: "AVIF", ext: "avif", mime: "image/avif", displayable: true,
    defaults: {
      quality: 50, qualityAlpha: -1, denoiseLevel: 0, tileColsLog2: 0, tileRowsLog2: 0, speed: 6, subsample: 1,
      chromaDeltaQ: false, sharpness: 0, tune: 0, enableSharpYUV: false, bitDepth: 8, lossless: false,
    },
    fields: [
      { key: "lossless", label: "Lossless", type: "toggle" },
      { key: "quality", label: "Quality", type: "range", min: 0, max: 100, show: (o) => !o.lossless },
      { key: "speed", label: "Effort", type: "range", min: 0, max: 10, invert: true, hint: "higher = slower, smaller" },
      { key: "subsample", label: "Subsample chroma", type: "select", advanced: true, show: (o) => !o.lossless, options: [{ value: 1, label: "Half resolution (4:2:0)" }, { value: 2, label: "Half horizontal (4:2:2)" }, { value: 3, label: "Full resolution (4:4:4)" }] },
      { key: "qualityAlpha", label: "Alpha quality (-1 = same)", type: "range", min: -1, max: 100, advanced: true, show: (o) => !o.lossless },
      { key: "chromaDeltaQ", label: "Extra chroma compression", type: "toggle", advanced: true, show: (o) => !o.lossless },
      { key: "sharpness", label: "Sharpness", type: "range", min: 0, max: 7, advanced: true, show: (o) => !o.lossless },
      { key: "denoiseLevel", label: "Noise synthesis", type: "range", min: 0, max: 50, advanced: true, show: (o) => !o.lossless },
      { key: "tune", label: "Tuning", type: "select", advanced: true, show: (o) => !o.lossless, options: [{ value: 0, label: "Auto" }, { value: 1, label: "PSNR" }, { value: 2, label: "SSIM" }] },
      { key: "enableSharpYUV", label: "Sharp YUV downsampling", type: "toggle", advanced: true, show: (o) => !o.lossless },
      { key: "tileRowsLog2", label: "Log2 of tile rows", type: "range", min: 0, max: 6, advanced: true },
      { key: "tileColsLog2", label: "Log2 of tile cols", type: "range", min: 0, max: 6, advanced: true },
    ],
  },
  {
    type: "jxl", label: "JPEG XL (beta)", ext: "jxl", mime: "image/jxl", displayable: false,
    defaults: { effort: 7, quality: 75, progressive: false, epf: -1, lossyPalette: false, decodingSpeedTier: 0, photonNoiseIso: 0, lossyModular: false, lossless: false },
    fields: [
      { key: "lossless", label: "Lossless", type: "toggle" },
      { key: "lossyPalette", label: "Slight loss", type: "toggle", show: (o) => !!o.lossless },
      { key: "quality", label: "Quality", type: "range", min: 0, max: 100, show: (o) => !o.lossless },
      { key: "effort", label: "Effort", type: "range", min: 1, max: 9 },
      { key: "progressive", label: "Progressive rendering", type: "toggle", advanced: true },
      { key: "epf", label: "Edge preserving filter (-1 auto)", type: "range", min: -1, max: 3, advanced: true, show: (o) => !o.lossless },
      { key: "lossyModular", label: "Alternative lossy mode", type: "toggle", advanced: true, show: (o) => !o.lossless },
      { key: "photonNoiseIso", label: "Noise equivalent to ISO", type: "range", min: 0, max: 50000, step: 100, advanced: true, show: (o) => !o.lossless },
      { key: "decodingSpeedTier", label: "Optimise for decoding speed", type: "range", min: 0, max: 4, advanced: true, show: (o) => !o.lossless },
    ],
  },
  {
    type: "oxipng", label: "OxiPNG", ext: "png", mime: "image/png", displayable: true,
    defaults: { level: 2, interlace: false, optimiseAlpha: false },
    fields: [
      { key: "level", label: "Effort", type: "range", min: 0, max: 6 },
      { key: "interlace", label: "Interlace", type: "toggle" },
      { key: "optimiseAlpha", label: "Optimise transparent pixels", type: "toggle", advanced: true },
    ],
  },
  { type: "qoi", label: "QOI", ext: "qoi", mime: "image/qoi", displayable: false, defaults: {}, fields: [] },
  { type: "browser-jpeg", label: "Browser JPEG", ext: "jpg", mime: "image/jpeg", displayable: true, defaults: { quality: 75 }, fields: [{ key: "quality", label: "Quality", type: "range", min: 0, max: 100 }] },
  { type: "browser-webp", label: "Browser WebP", ext: "webp", mime: "image/webp", displayable: true, defaults: { quality: 75 }, fields: [{ key: "quality", label: "Quality", type: "range", min: 0, max: 100 }] },
  { type: "browser-png", label: "Browser PNG", ext: "png", mime: "image/png", displayable: true, defaults: {}, fields: [] },
]

const codec = (t: EncoderType) => CODECS.find((c) => c.type === t)!

type ResizeMethod = "lanczos3" | "mitchell" | "catrom" | "triangle" | "hqx" | "magicKernel" | "magicKernelSharp2013" | "magicKernelSharp2021" | "browser-high" | "browser-pixelated"
const RESIZE_METHODS: { value: ResizeMethod; label: string }[] = [
  { value: "lanczos3", label: "Lanczos3" },
  { value: "mitchell", label: "Mitchell" },
  { value: "catrom", label: "Catmull-Rom" },
  { value: "triangle", label: "Triangle (bilinear)" },
  { value: "magicKernelSharp2021", label: "Magic Kernel Sharp 2021" },
  { value: "magicKernelSharp2013", label: "Magic Kernel Sharp 2013" },
  { value: "magicKernel", label: "Magic Kernel" },
  { value: "hqx", label: "hqx (pixel art, upscale)" },
  { value: "browser-high", label: "Browser high quality" },
  { value: "browser-pixelated", label: "Browser pixelated" },
]

interface SideSettings {
  resize: { enabled: boolean; width: number; height: number; method: ResizeMethod; fit: "stretch" | "contain"; premultiply: boolean; linearRGB: boolean; keepAspect: boolean }
  palette: { enabled: boolean; colors: number; dither: number }
  encoder: { type: EncoderType; options: Opts }
}

function defaultSide(type: EncoderType, w = 1, h = 1): SideSettings {
  return {
    resize: { enabled: false, width: w, height: h, method: "lanczos3", fit: "stretch", premultiply: true, linearRGB: true, keepAspect: true },
    palette: { enabled: false, colors: 256, dither: 1 },
    encoder: { type, options: { ...codec(type).defaults } },
  }
}

// Messages between the page and ImageOptimizer.worker.ts
type WorkerIn =
  | { type: "init"; image: ImageData }
  | { type: "run"; id: number; settings: SideSettings }
type WorkerOut =
  | { id: number; ok: true; buffer: ArrayBuffer; width: number; height: number; ms: number; decoded?: ImageData }
  | { id: number; ok: false; error: string }

/* ─── helpers (from tools/image/optimizer/SidePanel.tsx) ─── */
interface SideResult { blob: Blob; url: string; width: number; height: number; ms: number }

function Range({ label, value, min, max, step = 1, onChange, hint }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm">{label}{hint && <span className="ml-1 text-xs text-muted-foreground">({hint})</span>}</span>
        <Input type="number" value={value} min={min} max={max} step={step}
          onChange={(e) => { const v = +e.target.value; if (!Number.isNaN(v)) onChange(Math.min(max, Math.max(min, v))) }}
          className="h-7 w-20 px-2 text-right text-xs tabular-nums" />
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : (v as number))} />
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-0.5 text-sm">
      {label}<Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}

function Section({ title, on, onToggle, children }: { title: string; on?: boolean; onToggle?: (v: boolean) => void; children?: React.ReactNode }) {
  return (
    <div className="border-t pt-3">
      {onToggle ? <Toggle label={title} checked={!!on} onChange={onToggle} /> : <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</p>}
      {(on === undefined || on) && children && <div className="mt-3 space-y-3">{children}</div>}
    </div>
  )
}

function FieldView({ f, opts, set }: { f: CodecField; opts: Opts; set: (k: string, v: number | boolean) => void }) {
  if (f.show && !f.show(opts)) return null
  const v = opts[f.key]
  if (f.type === "toggle") return <Toggle label={f.label} checked={f.numeric ? !!v : !!v} onChange={(c) => set(f.key, f.numeric ? (c ? 1 : 0) : c)} />
  if (f.type === "select") return (
    <div className="space-y-1.5">
      <span className="text-sm">{f.label}</span>
      <Select items={f.options.map((o) => ({ value: String(o.value), label: o.label }))} value={String(v)} onValueChange={(x) => x != null && set(f.key, +x)}>
        <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
        <SelectContent>{f.options.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  )
  const shown = f.invert ? f.min + f.max - (v as number) : (v as number)
  return <Range label={f.label} hint={f.hint} value={shown} min={f.min} max={f.max} step={f.step} onChange={(n) => set(f.key, f.invert ? f.min + f.max - n : n)} />
}

interface SidePanelProps {
  side: "left" | "right"
  s: SideSettings
  onChange: (s: SideSettings) => void
  srcW: number
  srcH: number
  originalSize: number
  result: SideResult | null
  busy: boolean
  error: string | null
  onDownload: () => void
  onCopyToOther: () => void
}

function SidePanel({ side, s, onChange, srcW, srcH, originalSize, result, busy, error, onDownload, onCopyToOther }: SidePanelProps) {
  const [adv, setAdv] = useState(false)
  const c = codec(s.encoder.type)
  const isOriginal = s.encoder.type === "original"
  const set = <K extends keyof SideSettings>(k: K, v: Partial<SideSettings[K]>) => onChange({ ...s, [k]: { ...s[k], ...v } })
  const setOpt = (k: string, v: number | boolean) => onChange({ ...s, encoder: { ...s.encoder, options: { ...s.encoder.options, [k]: v } } })
  const r = s.resize

  const setW = (w: number) => set("resize", r.keepAspect ? { width: w, height: Math.max(1, Math.round((w * srcH) / srcW)) } : { width: w })
  const setH = (h: number) => set("resize", r.keepAspect ? { height: h, width: Math.max(1, Math.round((h * srcW) / srcH)) } : { height: h })
  const pct = (p: number) => set("resize", { width: Math.max(1, Math.round((srcW * p) / 100)), height: Math.max(1, Math.round((srcH * p) / 100)) })

  const storeKey = `optimizer-saved-${side}`
  const save = () => { try { localStorage.setItem(storeKey, JSON.stringify(s)) } catch { /* ignore */ } }
  const load = () => { try { const v = localStorage.getItem(storeKey); if (v) onChange({ ...JSON.parse(v), resize: { ...JSON.parse(v).resize, width: srcW, height: srcH } }) } catch { /* ignore */ } }

  const size = result?.blob.size
  const diff = size !== undefined && originalSize ? Math.round((size / originalSize - 1) * 100) : null
  const basic = c.fields.filter((f) => !f.advanced)
  const advanced = c.fields.filter((f) => f.advanced)

  return (
    <div className="flex flex-col rounded-xl border bg-card shadow-xs">
      {/* result header */}
      <div className={cn("flex items-center gap-3 rounded-t-xl border-b p-3", side === "left" ? "bg-sky-500/5" : "bg-primary/5")}>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{side === "left" ? "Left" : "Right"} · {c.label}</p>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-2xl font-bold tabular-nums">{busy ? "…" : size !== undefined ? formatBytes(size) : "—"}</span>
            {!busy && diff !== null && !isOriginal && (
              <span className={cn("rounded px-1.5 py-0.5 text-xs font-semibold", diff < 0 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-destructive/15 text-destructive")}>
                {diff < 0 ? `${-diff}% smaller` : `${diff}% bigger`}
              </span>
            )}
          </div>
          {result && !busy && <p className="text-xs text-muted-foreground">{result.width}×{result.height}px{!isOriginal && ` · ${result.ms} ms`}</p>}
        </div>
        {busy && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
        <Button onClick={onDownload} disabled={!result || busy} aria-label={`Download ${side} image`}><Download /> <span className="hidden sm:inline">Download</span></Button>
      </div>
      {error && <p className="flex gap-2 border-b bg-destructive/10 p-3 text-sm text-destructive"><TriangleAlert className="size-4 shrink-0" /> {error}</p>}

      <div className="space-y-3 p-4">
        {!isOriginal && (
          <>
            <Section title="Resize" on={r.enabled} onToggle={(v) => set("resize", { enabled: v, width: v ? r.width : srcW, height: v ? r.height : srcH })}>
              <div className="flex flex-wrap gap-1">
                {[25, 33.33, 50, 75, 100, 150, 200].map((p) => (
                  <Button key={p} size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => pct(p)}>{Math.round(p)}%</Button>
                ))}
              </div>
              <div className="flex items-end gap-2">
                <label className="flex-1 space-y-1 text-xs text-muted-foreground">Width<Input type="number" min={1} value={r.width} onChange={(e) => setW(Math.max(1, +e.target.value || 1))} className="h-8" /></label>
                <Button variant={r.keepAspect ? "default" : "outline"} size="icon-sm" className="mb-0.5" aria-label="Keep aspect ratio" onClick={() => set("resize", { keepAspect: !r.keepAspect })}>{r.keepAspect ? <Link2 /> : <Link2Off />}</Button>
                <label className="flex-1 space-y-1 text-xs text-muted-foreground">Height<Input type="number" min={1} value={r.height} onChange={(e) => setH(Math.max(1, +e.target.value || 1))} className="h-8" /></label>
              </div>
              <div className="space-y-1.5">
                <span className="text-sm">Method</span>
                <Select items={RESIZE_METHODS} value={r.method} onValueChange={(v) => v && set("resize", { method: v as typeof r.method })}>
                  <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{RESIZE_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {!r.method.startsWith("browser") && r.method !== "hqx" && (
                <>
                  {!r.keepAspect && <Toggle label="Fit (no stretching)" checked={r.fit === "contain"} onChange={(v) => set("resize", { fit: v ? "contain" : "stretch" })} />}
                  <Toggle label="Premultiply alpha" checked={r.premultiply} onChange={(v) => set("resize", { premultiply: v })} />
                  <Toggle label="Linear RGB" checked={r.linearRGB} onChange={(v) => set("resize", { linearRGB: v })} />
                </>
              )}
            </Section>

            <Section title="Reduce palette" on={s.palette.enabled} onToggle={(v) => set("palette", { enabled: v })}>
              <Range label="Colors" value={s.palette.colors} min={2} max={256} onChange={(v) => set("palette", { colors: v })} />
              <Range label="Dithering" value={s.palette.dither} min={0} max={1} step={0.1} onChange={(v) => set("palette", { dither: v })} />
            </Section>
          </>
        )}

        <Section title="Compress">
          <Select items={CODECS.map((x) => ({ value: x.type, label: x.label }))} value={s.encoder.type} onValueChange={(t) => t && onChange({ ...s, encoder: { type: t as EncoderType, options: { ...codec(t as EncoderType).defaults } } })}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{CODECS.map((x) => <SelectItem key={x.type} value={x.type}>{x.label}</SelectItem>)}</SelectContent>
          </Select>
          {basic.map((f) => <FieldView key={f.key} f={f} opts={s.encoder.options} set={setOpt} />)}
          {!c.displayable && !isOriginal && <p className="text-xs text-muted-foreground">Most browsers can’t open .{c.ext} files yet — the preview is decoded for you.</p>}
          {advanced.length > 0 && (
            <div className="rounded-lg border">
              <button type="button" onClick={() => setAdv((a) => !a)} className="flex w-full cursor-pointer items-center justify-between p-2.5 text-sm font-medium">
                Advanced settings <ChevronDown className={cn("size-4 transition-transform", adv && "rotate-180")} />
              </button>
              {adv && <div className="space-y-3 border-t p-3">{advanced.map((f) => <FieldView key={f.key} f={f} opts={s.encoder.options} set={setOpt} />)}</div>}
            </div>
          )}
        </Section>

        <div className="flex flex-wrap gap-2 border-t pt-3">
          <Button variant="outline" size="sm" onClick={onCopyToOther}><ArrowLeftRight /> Copy to {side === "left" ? "right" : "left"}</Button>
          <Button variant="ghost" size="sm" onClick={save} title="Remember these settings in this browser"><Save /> Save</Button>
          <Button variant="ghost" size="sm" onClick={load} title="Load saved settings"><Import /> Load</Button>
        </div>
      </div>
    </div>
  )
}

/* ─── helpers (from tools/image/optimizer/Viewer.tsx) ─── */
type Bg = "checker" | "light" | "dark"

interface ViewerProps {
  width: number   // original image size; both sides are drawn at this size
  height: number
  left: string | null
  right: string | null
  leftLabel?: React.ReactNode
  rightLabel?: React.ReactNode
  onRotate: () => void
  onDropFile: (f: File) => void
}

function Viewer({ width, height, left, right, leftLabel, rightLabel, onRotate, onDropFile }: ViewerProps) {
  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const touched = useRef(false) // user zoomed/panned → stop auto-fitting
  const [view, setView] = useState({ z: 1, x: 0, y: 0 })
  const [split, setSplit] = useState(0.5)
  const [bg, setBg] = useState<Bg>("checker")
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{ dist: number; z: number; mx: number; my: number; x: number; y: number } | null>(null)

  const fit = useCallback((w = size.w, h = size.h) => {
    if (!w || !h) return
    const z = Math.min(1, (w * 0.92) / width, (h * 0.92) / height)
    setView({ z, x: (w - width * z) / 2, y: (h - height * z) / 2 })
  }, [width, height, size.w, size.h])

  useEffect(() => {
    const el = box.current!
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // new image → fit; box resized (layout, rotation, window) → refit unless the user is zoomed/panned
  useEffect(() => { touched.current = false; fit() }, [width, height]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!touched.current) fit(size.w, size.h) }, [size.w, size.h]) // eslint-disable-line react-hooks/exhaustive-deps

  const zoomAt = (factor: number, cx = size.w / 2, cy = size.h / 2) => { touched.current = true; setView((v) => {
    const z = Math.min(32, Math.max(0.02, v.z * factor))
    const k = z / v.z
    return { z, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k }
  }) }

  // wheel zoom must be non-passive to stop the page scrolling
  useEffect(() => {
    const el = box.current!
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      const f = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015))
      zoomAt(f, e.clientX - r.left, e.clientY - r.top)
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  })

  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-nopan]")) return
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      const r = box.current!.getBoundingClientRect()
      gesture.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), z: view.z, mx: (a.x + b.x) / 2 - r.left, my: (a.y + b.y) / 2 - r.top, x: view.x, y: view.y }
    }
  }
  const onMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2 && gesture.current) {
      const [a, b] = [...pointers.current.values()]
      const g = gesture.current
      const z = Math.min(32, Math.max(0.02, g.z * (Math.hypot(a.x - b.x, a.y - b.y) / g.dist)))
      const k = z / g.z
      touched.current = true
      setView({ z, x: g.mx - (g.mx - g.x) * k, y: g.my - (g.my - g.y) * k })
    } else if (pointers.current.size === 1) {
      touched.current = true
      setView((v) => ({ ...v, x: v.x + e.clientX - prev.x, y: v.y + e.clientY - prev.y }))
    }
  }
  const onUp = (e: React.PointerEvent) => { pointers.current.delete(e.pointerId); if (pointers.current.size < 2) gesture.current = null }

  const dragSplit = (e: React.PointerEvent) => {
    e.stopPropagation()
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    const r = box.current!.getBoundingClientRect()
    const move = (ev: PointerEvent) => setSplit(Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)))
    const up = () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up) }
    el.addEventListener("pointermove", move); el.addEventListener("pointerup", up)
  }

  const img = (src: string | null) => src && (
    <img src={src} alt="" draggable={false}
      className="absolute top-0 left-0 max-w-none origin-top-left select-none"
      style={{ width, height, transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`, imageRendering: view.z >= 2 ? "pixelated" : "auto" }} />
  )
  const splitPx = split * size.w

  return (
    <div
      ref={box}
      className={cn("relative h-[62vh] min-h-[380px] touch-none overflow-hidden rounded-xl border select-none",
        bg === "checker" && "bg-[repeating-conic-gradient(#d4d4d8_0_25%,#fafafa_0_50%)] bg-[length:20px_20px]",
        bg === "light" && "bg-white", bg === "dark" && "bg-neutral-900", "cursor-grab active:cursor-grabbing")}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      onDoubleClick={(e) => { if (!(e.target as HTMLElement).closest("[data-nopan]")) { const r = box.current!.getBoundingClientRect(); zoomAt(2, e.clientX - r.left, e.clientY - r.top) } }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) onDropFile(f) }}
    >
      {/* right side = full layer, left side clipped on top */}
      <div className="absolute inset-0">{img(right)}</div>
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${size.w - splitPx}px 0 0)` }}>{img(left)}</div>

      {/* split handle */}
      <div data-nopan onPointerDown={dragSplit} role="slider" aria-label="Compare split" aria-valuenow={Math.round(split * 100)} tabIndex={0}
        onKeyDown={(e) => { if (e.key === "ArrowLeft") setSplit((s) => Math.max(0, s - 0.02)); if (e.key === "ArrowRight") setSplit((s) => Math.min(1, s + 0.02)) }}
        className="absolute inset-y-0 z-10 w-8 -translate-x-1/2 cursor-ew-resize" style={{ left: splitPx }}>
        <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgba(0,0,0,.35)]" />
        <div className="absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-sm font-bold text-neutral-800 shadow-lg ring-1 ring-black/10">⇆</div>
      </div>

      {leftLabel && <div data-nopan className="absolute top-3 left-3 z-10">{leftLabel}</div>}
      {rightLabel && <div data-nopan className="absolute top-3 right-3 z-10">{rightLabel}</div>}

      {/* zoom bar */}
      <div data-nopan className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-background/95 p-1 shadow-lg backdrop-blur">
        <Button variant="ghost" size="icon-sm" aria-label="Zoom out" onClick={() => zoomAt(1 / 1.25)}><Minus /></Button>
        <button className="w-16 cursor-pointer text-center text-sm font-medium tabular-nums" title="Fit to screen" onClick={() => { touched.current = false; fit() }}>{Math.round(view.z * 100)}%</button>
        <Button variant="ghost" size="icon-sm" aria-label="Zoom in" onClick={() => zoomAt(1.25)}><Plus /></Button>
        <span className="mx-1 h-5 w-px bg-border" />
        <Button variant="ghost" size="icon-sm" aria-label="Fit to screen" title="Fit" onClick={() => { touched.current = false; fit() }}><Maximize /></Button>
        <Button variant="ghost" size="icon-sm" aria-label="Actual size" title="100%" onClick={() => { touched.current = true; const z = 1; setView({ z, x: (size.w - width) / 2, y: (size.h - height) / 2 }) }}><span className="text-[10px] font-bold">1:1</span></Button>
        <Button variant="ghost" size="icon-sm" aria-label="Change background" title="Background" onClick={() => setBg((b) => (b === "checker" ? "light" : b === "light" ? "dark" : "checker"))}><SquareDashed /></Button>
        <Button variant="ghost" size="icon-sm" aria-label="Rotate image" title="Rotate 90°" onClick={onRotate}><RotateCw /></Button>
      </div>
    </div>
  )
}

/* ═══════════════ Tool ═══════════════ */
const ACCEPT = "image/*,.jxl,.qoi,.avif,.webp"

interface Source { file: File; image: ImageData; url: string; w: number; h: number; version: number }

/** Decode any supported file to ImageData (browser first, WebAssembly decoders as fallback). */
async function decodeFile(file: File): Promise<ImageData> {
  try {
    const bmp = await createImageBitmap(file)
    const c = new OffscreenCanvas(bmp.width, bmp.height)
    c.getContext("2d")!.drawImage(bmp, 0, 0)
    bmp.close()
    return c.getContext("2d")!.getImageData(0, 0, c.width, c.height)
  } catch {
    const buf = await file.arrayBuffer()
    const ext = file.name.split(".").pop()?.toLowerCase()
    if (ext === "jxl") return (await import("@jsquash/jxl/decode.js")).default(buf)
    if (ext === "qoi") return (await import("@jsquash/qoi/decode.js")).default(buf)
    if (ext === "avif") return (await import("@jsquash/avif/decode.js")).default(buf) as Promise<ImageData>
    if (ext === "webp") return (await import("@jsquash/webp/decode.js")).default(buf)
    throw new Error("Unsupported image format")
  }
}

async function imageDataToUrl(img: ImageData) {
  const c = new OffscreenCanvas(img.width, img.height)
  c.getContext("2d")!.putImageData(img, 0, 0)
  return URL.createObjectURL(await c.convertToBlob({ type: "image/png" }))
}

type Pair<T> = [T, T]

export default function ImageOptimizer() {
  const [src, setSrc] = useState<Source | null>(null)
  const [loading, setLoading] = useState(false)
  const [sides, setSides] = useState<Pair<SideSettings>>([defaultSide("original"), defaultSide("mozjpeg")])
  const [results, setResults] = useState<Pair<SideResult | null>>([null, null])
  const [busy, setBusy] = useState<Pair<boolean>>([false, false])
  const [errors, setErrors] = useState<Pair<string | null>>([null, null])
  const workers = useRef<Pair<Worker | null>>([null, null])
  const jobs = useRef<Pair<number>>([0, 0])
  const running = useRef<Pair<boolean>>([false, false])
  const srcRef = useRef(src)
  useEffect(() => { srcRef.current = src })

  const setAt = <T,>(set: React.Dispatch<React.SetStateAction<Pair<T>>>, i: number, v: NoInfer<T>) => set((p) => (i === 0 ? [v, p[1]] : [p[0], v]))

  const newWorker = (i: number) => {
    workers.current[i]?.terminate()
    const w = new Worker(new URL("./ImageOptimizer.worker.ts", import.meta.url), { type: "module" })
    if (srcRef.current) w.postMessage({ type: "init", image: srcRef.current.image } satisfies WorkerIn)
    workers.current[i] = w
    return w
  }

  useEffect(() => () => { workers.current.forEach((w) => w?.terminate()) }, [])

  const load = useCallback(async (file: File) => {
    setLoading(true)
    try {
      const image = await decodeFile(file)
      if (image.width * image.height > 60e6) throw new Error("Image is too large (max 60 megapixels)")
      const displayable = /^image\/(jpeg|png|webp|gif|bmp|avif|svg\+xml)$/.test(file.type)
      const url = displayable ? URL.createObjectURL(file) : await imageDataToUrl(image)
      setSrc((old) => {
        if (old) URL.revokeObjectURL(old.url)
        return { file, image, url, w: image.width, h: image.height, version: (old?.version ?? 0) + 1 }
      })
      setSides((p) => p.map((s) => ({ ...s, resize: { ...s.resize, width: image.width, height: image.height } })) as Pair<SideSettings>)
      workers.current.forEach((w, i) => { if (w) { w.terminate(); workers.current[i] = null } })
      running.current = [false, false]
    } catch (e) { toast.error((e as Error).message || "Could not open this image") } finally { setLoading(false) }
  }, [])

  const rotate = async () => {
    if (!src) return
    const { image } = src
    const a = new OffscreenCanvas(image.width, image.height); a.getContext("2d")!.putImageData(image, 0, 0)
    const b = new OffscreenCanvas(image.height, image.width); const ctx = b.getContext("2d")!
    ctx.translate(b.width, 0); ctx.rotate(Math.PI / 2); ctx.drawImage(a, 0, 0)
    const rotated = ctx.getImageData(0, 0, b.width, b.height)
    const url = await imageDataToUrl(rotated)
    URL.revokeObjectURL(src.url)
    // keep the original size number for comparison; the bytes on disk are the same file
    setSrc({ ...src, image: rotated, url, w: rotated.width, h: rotated.height, version: src.version + 1 })
    setSides((p) => p.map((s) => ({ ...s, resize: { ...s.resize, width: s.resize.height, height: s.resize.width } })) as Pair<SideSettings>)
    workers.current.forEach((w, i) => { if (w) { w.terminate(); workers.current[i] = null } })
    running.current = [false, false]
  }

  // (re)process a side whenever its settings or the source change — debounced, cancelling stale work
  const key0 = JSON.stringify(sides[0]), key1 = JSON.stringify(sides[1])

  function processSide(i: 0 | 1) {
    const source = srcRef.current
    if (!source) return
    const s = sides[i]
    setAt(setErrors, i, null)
    if (s.encoder.type === "original") {
      if (running.current[i]) { newWorker(i); running.current[i] = false }
      jobs.current[i]++
      setAt(setBusy, i, false)
      setAt(setResults, i, { blob: source.file, url: source.url, width: source.w, height: source.h, ms: 0 })
      return
    }
    const id = ++jobs.current[i]
    setAt(setBusy, i, true)
    const t = setTimeout(() => {
      if (id !== jobs.current[i]) return
      // a job still running for this side? kill it — it's stale
      const w = running.current[i] || !workers.current[i] ? newWorker(i) : workers.current[i]!
      running.current[i] = true
      w.onmessage = async (e: MessageEvent<WorkerOut>) => {
        const m = e.data
        if (m.id !== jobs.current[i]) return
        running.current[i] = false
        if (!m.ok) { setAt(setErrors, i, m.error); setAt(setBusy, i, false); return }
        const c = codec(s.encoder.type)
        const blob = new Blob([m.buffer], { type: c.mime })
        const url = m.decoded ? await imageDataToUrl(m.decoded) : URL.createObjectURL(blob)
        setResults((p) => {
          const old = p[i]
          if (old && old.url !== srcRef.current?.url) URL.revokeObjectURL(old.url)
          const n: Pair<SideResult | null> = [...p] as Pair<SideResult | null>
          n[i] = { blob, url, width: m.width, height: m.height, ms: m.ms }
          return n
        })
        setAt(setBusy, i, false)
      }
      w.onerror = () => { if (id === jobs.current[i]) { running.current[i] = false; setAt(setErrors, i, "Encoding failed — try other settings"); setAt(setBusy, i, false) } }
      w.postMessage({ type: "run", id, settings: s } satisfies WorkerIn)
    }, 250)
    return () => clearTimeout(t)
  }
  useEffect(() => processSide(0), [key0, src?.version]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => processSide(1), [key1, src?.version]) // eslint-disable-line react-hooks/exhaustive-deps


  const download = (i: 0 | 1) => {
    const r = results[i]
    if (!r || !src) return
    const c = codec(sides[i].encoder.type)
    const name = sides[i].encoder.type === "original" ? src.file.name : `${baseName(src.file.name)}.${c.ext}`
    saveBlob(r.blob, name).catch(() => toast.error("Download failed"))
  }

  const label = (i: 0 | 1) => {
    const r = results[i]
    return (
      <span className="rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white backdrop-blur">
        {codec(sides[i].encoder.type).label}{r && !busy[i] ? ` · ${formatBytes(r.blob.size)}` : busy[i] ? " · …" : ""}
      </span>
    )
  }

  if (!src) {
    return loading
      ? <div className="grid h-72 place-items-center rounded-xl border bg-card text-muted-foreground">Opening image…</div>
      : <FileDrop accept={ACCEPT} multiple={false} onFiles={(f) => load(f[0])} paste title="Drop an image to optimize" hint="Compare codecs side by side — MozJPEG, WebP, AVIF, JPEG XL, OxiPNG and more" />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm"><b>{src.file.name}</b> <span className="text-muted-foreground">· {src.w}×{src.h}px · {formatBytes(src.file.size)}</span></p>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground md:inline">Scroll to zoom · drag to pan · double-click to zoom in</span>
          <label>
            <input type="file" accept={ACCEPT} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) load(f) }} />
            <Button variant="outline" size="sm" nativeButton={false} render={<span />} className="cursor-pointer"><ImageUp /> Open another</Button>
          </label>
        </div>
      </div>

      <Viewer width={src.w} height={src.h} left={results[0]?.url ?? null} right={results[1]?.url ?? null}
        leftLabel={label(0)} rightLabel={label(1)} onRotate={rotate} onDropFile={load} />

      <div className="grid gap-4 md:grid-cols-2">
        {([0, 1] as const).map((i) => (
          <SidePanel key={i} side={i === 0 ? "left" : "right"} s={sides[i]} srcW={src.w} srcH={src.h} originalSize={src.file.size}
            onChange={(s) => setAt(setSides, i, s)} result={results[i]} busy={busy[i]} error={errors[i]}
            onDownload={() => download(i)}
            onCopyToOther={() => setAt(setSides, i === 0 ? 1 : 0, structuredClone(sides[i]))} />
        ))}
      </div>
    </div>
  )
}
