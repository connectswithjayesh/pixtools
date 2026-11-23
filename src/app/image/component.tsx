"use client";
/**
 * Image to PDF — complete tool in ONE file.
 *
 * Features: drag-and-drop board (reorder), rotate / duplicate / delete / select pages, bulk actions,
 * sort, zoom, paste (Ctrl+V), live page-layout preview, page size (A3/A4/A5/Letter/Legal/fit image),
 * orientation, margins, fit modes, background colour, JPEG/PNG, quality, DPI, black & white,
 * page numbers, watermark, PDF title/author, one merged PDF or a ZIP with one PDF per image,
 * PDF preview and download. Everything runs in the browser — no upload.
 *
 * Mobile: 2-column board that scrolls normally, drag by the ⠿ handle, always-visible card actions,
 * tap a page to preview, "Take photo" camera button, sticky bottom bar (Settings + Convert/Download)
 * and a bottom-sheet for settings.
 *
 * npm i jspdf jszip @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities lucide-react sonner
 * npx shadcn@latest add button badge card dialog select slider input label switch tabs tooltip
 * (sonner: render <Toaster /> once in your app layout to see the messages)
 */
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import type { jsPDF as JsPDF } from "jspdf"
import { toast } from "sonner"
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core"
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ArrowDownAZ, ArrowUpAZ, ArrowDownUp, CalendarClock, Camera, Check, CheckSquare, ChevronLeft, ChevronRight, ClipboardPaste, Copy,
  Download, ExternalLink, Eye, FileText, GripVertical, HardDrive, Image as ImageIcon, ImagePlus, Loader2, RefreshCcw,
  RotateCcw, RotateCw, Settings2, ShieldCheck, SlidersHorizontal, Trash2, Upload, X, ZoomIn,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

/* ═════════════════════════════ 1. Types & defaults ═════════════════════════════ */

type Rotation = 0 | 90 | 180 | 270

interface ImageItem {
  id: string
  file: File
  name: string
  size: number
  url: string        // object URL of the original
  thumb: string      // rotated small preview (data URL)
  baseThumb: string  // unrotated small preview (data URL)
  width: number      // natural width (unrotated)
  height: number     // natural height (unrotated)
  rotation: Rotation
  addedAt: number
}

type PageSizeKey = "A4" | "A3" | "A5" | "Letter" | "Legal" | "fit"
type Orientation = "portrait" | "landscape" | "auto"
type FitMode = "contain" | "cover" | "stretch" | "original"
type MarginKey = "none" | "small" | "medium" | "large" | "custom"
type Align = "center" | "top"
type OutputMode = "merge" | "separate"
type ImageFormat = "jpeg" | "png"
type DpiKey = "72" | "150" | "300" | "original"

interface PdfSettings {
  pageSize: PageSizeKey
  orientation: Orientation
  fit: FitMode
  margin: MarginKey
  customMargin: number // mm
  align: Align
  background: string
  grayscale: boolean
  format: ImageFormat
  quality: number // 10..100
  dpi: DpiKey
  pageNumbers: boolean
  watermark: string
  output: OutputMode
  fileName: string
  title: string
  author: string
}

const DEFAULT_SETTINGS: PdfSettings = {
  pageSize: "A4", orientation: "auto", fit: "contain", margin: "small", customMargin: 15, align: "center",
  background: "#ffffff", grayscale: false, format: "jpeg", quality: 85, dpi: "150", pageNumbers: false,
  watermark: "", output: "merge", fileName: "images", title: "", author: "",
}

interface PdfResult { blob: Blob; fileName: string; pages: number; kind: "pdf" | "zip" }

const MAX_FILES = 300
// "image/*" opens the photo gallery / camera chooser on Android and iPhone (iPhone also converts HEIC to JPEG)
const ACCEPTED = "image/*"

/* ═════════════════════════════ 2. Small helpers ═════════════════════════════ */

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ")

/** SSR-safe media query (false on the server, real value in the browser). */
function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query)
      m.addEventListener("change", cb)
      return () => m.removeEventListener("change", cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
/** Phones & tablets (finger input). */
const useTouch = () => useMediaQuery("(pointer: coarse)")

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

const nextRotation = (r: Rotation, dir: 1 | -1) => ((((r + dir * 90) % 360) + 360) % 360) as Rotation

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

/* ═════════════════════════════ 3. Page layout (mm) ═════════════════════════════ */

const PAGE_SIZES: Record<Exclude<PageSizeKey, "fit">, [number, number]> = {
  A3: [297, 420], A4: [210, 297], A5: [148, 210], Letter: [215.9, 279.4], Legal: [215.9, 355.6],
}
const MARGINS: Record<Exclude<MarginKey, "custom">, number> = { none: 0, small: 10, medium: 20, large: 30 }
const PX_TO_MM = 25.4 / 96

interface Layout {
  pageW: number; pageH: number; x: number; y: number; w: number; h: number
  /** true when the image must be cropped to fill the box */
  crop: boolean
}

function rotatedSize(w: number, h: number, r: Rotation) {
  return r === 90 || r === 270 ? { w: h, h: w } : { w, h }
}

function marginMm(s: PdfSettings) {
  return s.margin === "custom" ? Math.max(0, Math.min(80, s.customMargin || 0)) : MARGINS[s.margin]
}

/** Page size and image rectangle (mm) for an image of imgW × imgH px (already rotated). */
function computeLayout(imgW: number, imgH: number, s: PdfSettings): Layout {
  const m = marginMm(s)
  if (s.pageSize === "fit") {
    const w = imgW * PX_TO_MM, h = imgH * PX_TO_MM
    return { pageW: w + 2 * m, pageH: h + 2 * m, x: m, y: m, w, h, crop: false }
  }
  const [a, b] = PAGE_SIZES[s.pageSize]
  const short = Math.min(a, b), long = Math.max(a, b)
  const landscape = s.orientation === "landscape" || (s.orientation === "auto" && imgW > imgH)
  const pageW = landscape ? long : short
  const pageH = landscape ? short : long

  const mm = Math.min(m, pageW / 2 - 5, pageH / 2 - 5) // keep a usable box even with silly margins
  const boxW = pageW - 2 * mm, boxH = pageH - 2 * mm

  if (s.fit === "cover") return { pageW, pageH, x: mm, y: mm, w: boxW, h: boxH, crop: true }
  if (s.fit === "stretch") return { pageW, pageH, x: mm, y: mm, w: boxW, h: boxH, crop: false }

  let w: number, h: number
  if (s.fit === "original") {
    w = imgW * PX_TO_MM; h = imgH * PX_TO_MM
    if (w > boxW || h > boxH) { const k = Math.min(boxW / w, boxH / h); w *= k; h *= k }
  } else {
    const k = Math.min(boxW / imgW, boxH / imgH)
    w = imgW * k; h = imgH * k
  }
  const x = (pageW - w) / 2
  const y = s.align === "top" ? mm : (pageH - h) / 2
  return { pageW, pageH, x, y, w, h, crop: false }
}

/* ═════════════════════════════ 4. Image loading & canvas ═════════════════════════════ */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = "async"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Image load failed"))
    img.src = src
  })
}

/** Draw an image rotated by r degrees into a new canvas, optionally downscaled to maxSide. */
function drawRotated(src: CanvasImageSource, sw: number, sh: number, r: Rotation, maxSide = Infinity) {
  const k = Math.min(1, maxSide / Math.max(sw, sh))
  const w = Math.max(1, Math.round(sw * k))
  const h = Math.max(1, Math.round(sh * k))
  const swap = r === 90 || r === 270
  const c = document.createElement("canvas")
  c.width = swap ? h : w
  c.height = swap ? w : h
  const ctx = c.getContext("2d")!
  ctx.imageSmoothingQuality = "high"
  ctx.translate(c.width / 2, c.height / 2)
  ctx.rotate((r * Math.PI) / 180)
  ctx.drawImage(src, -w / 2, -h / 2, w, h)
  return c
}

async function makeThumb(src: string, r: Rotation, maxSide = 480) {
  const img = await loadImage(src)
  return drawRotated(img, img.naturalWidth, img.naturalHeight, r, maxSide).toDataURL("image/png")
}

let counter = 0
const uid = () => `${Date.now().toString(36)}-${(counter++).toString(36)}-${Math.random().toString(36).slice(2, 7)}`

async function fileToItem(file: File): Promise<ImageItem> {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    let width = img.naturalWidth, height = img.naturalHeight
    if (!width || !height) { width = 1000; height = 1000 } // some SVGs have no size
    const base = drawRotated(img, width, height, 0, 480).toDataURL("image/png")
    return {
      id: uid(), file, name: file.name || "pasted-image.png", size: file.size, url,
      thumb: base, baseThumb: base, width, height, rotation: 0, addedAt: file.lastModified || Date.now(),
    }
  } catch (e) {
    URL.revokeObjectURL(url)
    throw e
  }
}

/* ═════════════════════════════ 5. PDF builder (jsPDF + JSZip, loaded on demand) ═════════════════════════════ */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
  const n = parseInt(v, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function toGrayscale(c: HTMLCanvasElement) {
  const ctx = c.getContext("2d")!
  const d = ctx.getImageData(0, 0, c.width, c.height)
  const p = d.data
  for (let i = 0; i < p.length; i += 4) {
    const y = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]
    p[i] = p[i + 1] = p[i + 2] = y
  }
  ctx.putImageData(d, 0, 0)
}

/** Render one image into its final pixels for the PDF. */
async function renderImage(item: ImageItem, s: PdfSettings) {
  const img = await loadImage(item.url)
  const W = img.naturalWidth || item.width
  const H = img.naturalHeight || item.height
  const rot = rotatedSize(W, H, item.rotation)
  const layout = computeLayout(rot.w, rot.h, s)

  // full-res rotated source (capped to keep memory sane on phones)
  const src = drawRotated(img, W, H, item.rotation, 6000)
  const sw = src.width, sh = src.height

  // source crop rectangle (for "Fill page")
  let cx0 = 0, cy0 = 0, cw = sw, ch = sh
  if (layout.crop) {
    const boxRatio = layout.w / layout.h
    if (sw / sh > boxRatio) { cw = sh * boxRatio; cx0 = (sw - cw) / 2 }
    else { ch = sw / boxRatio; cy0 = (sh - ch) / 2 }
  }

  // target resolution
  let scale = 1
  if (s.dpi !== "original") {
    const targetW = (layout.w / 25.4) * Number(s.dpi)
    scale = Math.min(1, targetW / cw)
  }
  const out = document.createElement("canvas")
  out.width = Math.max(1, Math.round(cw * scale))
  out.height = Math.max(1, Math.round(ch * scale))
  const ctx = out.getContext("2d")!
  ctx.imageSmoothingQuality = "high"
  if (s.format === "jpeg") { ctx.fillStyle = s.background; ctx.fillRect(0, 0, out.width, out.height) }
  ctx.drawImage(src, cx0, cy0, cw, ch, 0, 0, out.width, out.height)
  if (s.grayscale) toGrayscale(out)

  const data = s.format === "png" ? out.toDataURL("image/png") : out.toDataURL("image/jpeg", s.quality / 100)
  return { data, layout }
}

function decoratePage(doc: JsPDF, l: Layout, s: PdfSettings, page: number, total: number) {
  if (s.watermark.trim()) {
    const g = doc as unknown as { GState: new (o: { opacity: number }) => unknown; setGState: (g: unknown) => void }
    g.setGState(new g.GState({ opacity: 0.15 }))
    doc.setTextColor(80, 80, 80)
    doc.setFontSize(Math.min(l.pageW, l.pageH) / 4)
    doc.text(s.watermark.trim(), l.pageW / 2, l.pageH / 2, { align: "center", angle: 35, baseline: "middle" })
    g.setGState(new g.GState({ opacity: 1 }))
  }
  if (s.pageNumbers) {
    doc.setFontSize(9)
    doc.setTextColor(110, 110, 110)
    doc.text(`${page} / ${total}`, l.pageW / 2, l.pageH - Math.max(4, Math.min(8, l.pageH * 0.02)), { align: "center" })
  }
}

function drawPage(doc: JsPDF, data: string, l: Layout, s: PdfSettings) {
  const bg = s.background.toLowerCase()
  if (bg !== "#ffffff" && bg !== "#fff") {
    doc.setFillColor(...hexToRgb(s.background))
    doc.rect(0, 0, l.pageW, l.pageH, "F")
  }
  doc.addImage(data, s.format === "png" ? "PNG" : "JPEG", l.x, l.y, l.w, l.h, undefined, "FAST")
}

const tick = () => new Promise((r) => setTimeout(r, 0))
const safeName = (n: string) => (n.trim() || "images").replace(/[\\/:*?"<>|]+/g, "-").replace(/\.pdf$/i, "")

async function buildPdf(items: ImageItem[], s: PdfSettings, onProgress: (done: number, total: number) => void): Promise<PdfResult> {
  const { jsPDF } = await import("jspdf")
  const newDoc = (l: Layout) => {
    const doc = new jsPDF({ unit: "mm", format: [l.pageW, l.pageH], orientation: l.pageW > l.pageH ? "landscape" : "portrait", compress: true })
    doc.setProperties({ title: s.title || s.fileName, author: s.author, creator: "Image to PDF Converter" })
    return doc
  }
  const total = items.length
  const base = safeName(s.fileName)

  if (s.output === "merge") {
    let doc: JsPDF | null = null
    for (let i = 0; i < total; i++) {
      const { data, layout } = await renderImage(items[i], s)
      if (!doc) doc = newDoc(layout)
      else doc.addPage([layout.pageW, layout.pageH], layout.pageW > layout.pageH ? "landscape" : "portrait")
      drawPage(doc, data, layout, s)
      decoratePage(doc, layout, s, i + 1, total)
      onProgress(i + 1, total)
      await tick()
    }
    return { blob: doc!.output("blob"), fileName: `${base}.pdf`, pages: total, kind: "pdf" }
  }

  const { default: JSZip } = await import("jszip")
  const zip = new JSZip()
  const used = new Set<string>()
  for (let i = 0; i < total; i++) {
    const { data, layout } = await renderImage(items[i], s)
    const doc = newDoc(layout)
    drawPage(doc, data, layout, s)
    decoratePage(doc, layout, s, 1, 1)
    let name = `${String(i + 1).padStart(2, "0")}-${items[i].name.replace(/\.[^.]+$/, "")}`
    while (used.has(name)) name += "-1"
    used.add(name)
    zip.file(`${name}.pdf`, doc.output("arraybuffer"))
    onProgress(i + 1, total)
    await tick()
  }
  return { blob: await zip.generateAsync({ type: "blob" }), fileName: `${base}.zip`, pages: total, kind: "zip" }
}

/* ═════════════════════════════ 6. Dropzone ═════════════════════════════ */

function Dropzone({ onFiles, compact = false }: { onFiles: (f: File[]) => void; compact?: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  const camera = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const pick = () => input.current?.click()

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onFiles(Array.from(e.dataTransfer.files)) }}
      onClick={compact ? pick : undefined}
      className={cx(
        "relative rounded-xl border-2 border-dashed transition-colors",
        over ? "border-primary bg-accent" : "border-border bg-card hover:border-primary/50",
        compact
          ? "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 text-muted-foreground sm:aspect-[3/4]"
          : "px-4 py-10 text-center sm:px-6 sm:py-14",
      )}
    >
      <input ref={input} type="file" multiple accept={ACCEPTED} className="hidden"
        onChange={(e) => { onFiles(Array.from(e.target.files ?? [])); e.target.value = "" }} />
      <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => { onFiles(Array.from(e.target.files ?? [])); e.target.value = "" }} />
      {compact ? (
        <>
          <ImagePlus className="size-7 sm:size-8" />
          <span className="text-sm font-medium">Add more</span>
        </>
      ) : (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4">
          <div className="grid size-14 place-items-center rounded-2xl bg-accent text-primary sm:size-16"><Upload className="size-7 sm:size-8" /></div>
          <div>
            <h2 className="text-lg font-semibold sm:text-xl">
              <span className="sm:hidden">Add your images</span>
              <span className="hidden sm:inline">Drop images here</span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">JPG, PNG, WEBP, GIF, BMP, SVG, AVIF — as many as you want</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button size="lg" className="w-full sm:w-auto" onClick={pick}><ImagePlus /> Select images</Button>
            <Button size="lg" variant="outline" className="w-full sm:hidden" onClick={() => camera.current?.click()}><Camera /> Take photo</Button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="hidden items-center gap-1 sm:inline-flex"><ClipboardPaste className="size-3.5" /> Ctrl / ⌘ + V to paste</span>
            <span className="inline-flex items-center gap-1"><ShieldCheck className="size-3.5" /> Files never leave your device</span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═════════════════════════════ 7. Page preview & sortable card ═════════════════════════════ */

function PagePreview({ item, settings, className }: { item: ImageItem; settings: PdfSettings; className?: string }) {
  const r = rotatedSize(item.width, item.height, item.rotation)
  const l = computeLayout(r.w, r.h, settings)
  const pct = (v: number, of: number) => `${(v / of) * 100}%`
  return (
    <div className={cx("relative w-full", className)} style={{ aspectRatio: `${l.pageW} / ${l.pageH}` }}>
      <div className="absolute inset-0 overflow-hidden rounded-sm shadow-md ring-1 ring-black/10" style={{ background: settings.background }}>
        <img
          src={item.thumb} alt={item.name} draggable={false}
          className={cx("absolute select-none", l.crop ? "object-cover" : "object-fill", settings.grayscale && "grayscale")}
          style={{ left: pct(l.x, l.pageW), top: pct(l.y, l.pageH), width: pct(l.w, l.pageW), height: pct(l.h, l.pageH) }}
        />
        {settings.watermark.trim() && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden">
            <span className="-rotate-[35deg] text-[clamp(10px,2.2vw,22px)] font-bold whitespace-nowrap text-black/15">{settings.watermark}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function Act({ label, onClick, children, danger }: { label: string; onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="secondary" size="icon" aria-label={label}
          className={cx("size-7 bg-background/90 shadow-sm backdrop-blur", danger && "hover:bg-destructive hover:text-white")}
          onClick={(e) => { e.stopPropagation(); onClick() }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function PageCard({ item, index, settings, selected, touch, onToggleSelect, onRotate, onDuplicate, onRemove, onPreview }: {
  item: ImageItem; index: number; settings: PdfSettings; selected: boolean; touch: boolean
  onToggleSelect: () => void; onRotate: (dir: 1 | -1) => void; onDuplicate: () => void; onRemove: () => void; onPreview: () => void
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  // Mouse: drag the whole picture. Touch: drag only by the ⠿ handle, so swiping over cards still scrolls the page.
  const dragWhole = touch ? {} : { ...attributes, ...listeners }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cx(
        "group relative flex min-w-0 flex-col gap-2 rounded-xl border bg-card p-2 shadow-xs transition-shadow sm:p-3",
        selected && "border-primary ring-2 ring-primary/30",
        isDragging && "z-10 opacity-40",
      )}
    >
      <div
        ref={touch ? undefined : setActivatorNodeRef}
        className={cx("relative", touch ? "cursor-pointer" : "cursor-grab touch-none active:cursor-grabbing")}
        onClick={touch ? onPreview : undefined}
        {...dragWhole}
      >
        <div className="grid min-h-28 place-items-center rounded-lg bg-muted/60 p-2 sm:min-h-40 sm:p-3">
          <PagePreview item={item} settings={settings} className="max-w-full" />
        </div>
        <span className="absolute top-1.5 left-1.5 rounded-md bg-foreground/85 px-1.5 py-0.5 text-xs font-semibold text-background sm:top-2 sm:left-2">{index + 1}</span>
        <button
          type="button"
          aria-label={selected ? "Deselect" : "Select"}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onToggleSelect() }}
          className={cx(
            "absolute top-1 right-1 grid size-8 cursor-pointer place-items-center sm:top-2 sm:right-2 sm:size-6",
            // the visible box stays small, the tap area is bigger on phones
          )}
        >
          <span className={cx(
            "grid size-6 place-items-center rounded-md border-2 transition-all",
            selected ? "border-primary bg-primary text-primary-foreground"
              : touch ? "border-white bg-black/30" : "border-white/90 bg-black/20 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
          )}>
            {selected && <Check className="size-4" />}
          </span>
        </button>
        {!touch && (
          <div className="absolute inset-x-0 bottom-2 flex flex-wrap justify-center gap-1 px-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <Act label="Rotate left" onClick={() => onRotate(-1)}><RotateCcw /></Act>
            <Act label="Rotate right" onClick={() => onRotate(1)}><RotateCw /></Act>
            <Act label="Preview" onClick={onPreview}><Eye /></Act>
            <Act label="Duplicate" onClick={onDuplicate}><Copy /></Act>
            <Act label="Remove" onClick={onRemove} danger><Trash2 /></Act>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 px-0.5">
        {touch ? (
          <button
            type="button" ref={setActivatorNodeRef} {...attributes} {...listeners}
            aria-label={`Drag page ${index + 1} to reorder`}
            className="-ml-1 grid size-8 shrink-0 touch-none place-items-center rounded-md text-muted-foreground active:bg-accent"
          >
            <GripVertical className="size-5" />
          </button>
        ) : (
          <GripVertical className="size-4 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium sm:text-sm" title={item.name}>{item.name}</p>
          <p className="truncate text-[11px] text-muted-foreground sm:text-xs">{item.width}×{item.height} · {formatBytes(item.size)}</p>
        </div>
      </div>

      {touch && (
        <div className="grid grid-cols-4 gap-1 border-t pt-1.5">
          {([
            ["Rotate left", () => onRotate(-1), <RotateCcw key="l" />],
            ["Rotate right", () => onRotate(1), <RotateCw key="r" />],
            ["Duplicate", onDuplicate, <Copy key="d" />],
            ["Remove", onRemove, <Trash2 key="x" />],
          ] as const).map(([label, fn, icon]) => (
            <Button
              key={label} type="button" variant="ghost" size="icon" aria-label={label} onClick={fn}
              className={cx("h-9 w-full", label === "Remove" && "text-destructive")}
            >
              {icon}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ═════════════════════════════ 8. Drag-and-drop board ═════════════════════════════ */

function Board(p: {
  items: ImageItem[]; settings: PdfSettings; zoom: number; selected: Set<string>
  setItems: (fn: (prev: ImageItem[]) => ImageItem[]) => void
  onToggleSelect: (id: string) => void; onRotate: (id: string, dir: 1 | -1) => void; onDuplicate: (id: string) => void
  onRemove: (id: string) => void; onPreview: (id: string) => void; onFiles: (f: File[]) => void
}) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const touch = useTouch()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const active = p.items.find((i) => i.id === activeId)

  const onEnd = (e: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = e
    if (!over || active.id === over.id) return
    p.setItems((prev) => arrayMove(prev, prev.findIndex((i) => i.id === active.id), prev.findIndex((i) => i.id === over.id)))
  }

  return (
    <DndContext
      sensors={sensors} collisionDetection={closestCenter}
      onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
      onDragEnd={onEnd} onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={p.items.map((i) => i.id)} strategy={rectSortingStrategy}>
        {/* min(zoom, half width) → always at least 2 columns on phones */}
        <div className="grid gap-3 sm:gap-4" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(${p.zoom}px, calc(50% - 6px)), 1fr))` }}>
          {p.items.map((item, i) => (
            <PageCard
              key={item.id} item={item} index={i} settings={p.settings} touch={touch}
              selected={p.selected.has(item.id)}
              onToggleSelect={() => p.onToggleSelect(item.id)}
              onRotate={(d) => p.onRotate(item.id, d)}
              onDuplicate={() => p.onDuplicate(item.id)}
              onRemove={() => p.onRemove(item.id)}
              onPreview={() => p.onPreview(item.id)}
            />
          ))}
          <Dropzone compact onFiles={p.onFiles} />
        </div>
      </SortableContext>
      <DragOverlay>
        {active && (
          <div className="rotate-2 rounded-xl border bg-card p-2 shadow-2xl sm:p-3">
            <div className="grid place-items-center rounded-lg bg-muted/60 p-2 sm:p-3"><PagePreview item={active} settings={p.settings} /></div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

/* ═════════════════════════════ 9. Settings panel ═════════════════════════════ */

type SetSetting = <K extends keyof PdfSettings>(k: K, v: PdfSettings[K]) => void

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label>{label}</Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; icon?: React.ReactNode }[] }) {
  return (
    <div className="grid gap-1 rounded-lg bg-muted p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }}>
      {options.map((o) => (
        <button
          key={o.value} type="button" onClick={() => onChange(o.value)}
          className={cx(
            "flex min-h-9 cursor-pointer flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-xs font-medium transition-all sm:py-1.5",
            value === o.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.icon}{o.label}
        </button>
      ))}
    </div>
  )
}

const PageIcon = ({ w, h }: { w: number; h: number }) => <span className="block rounded-[2px] border-2 border-current" style={{ width: w, height: h }} />

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

function SettingsPanel({ s, set }: { s: PdfSettings; set: SetSetting }) {
  const fixedPage = s.pageSize !== "fit"
  return (
    <Tabs defaultValue="page" className="gap-4">
      <TabsList className="w-full">
        <TabsTrigger value="page"><FileText /> Page</TabsTrigger>
        <TabsTrigger value="image"><ImageIcon /> Image</TabsTrigger>
        <TabsTrigger value="output"><Settings2 /> Output</TabsTrigger>
      </TabsList>

      <TabsContent value="page" className="space-y-5">
        <Field label="Page size">
          <Select value={s.pageSize} onValueChange={(v) => set("pageSize", v as PageSizeKey)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
              <SelectItem value="A3">A3 (297 × 420 mm)</SelectItem>
              <SelectItem value="A5">A5 (148 × 210 mm)</SelectItem>
              <SelectItem value="Letter">US Letter (8.5 × 11 in)</SelectItem>
              <SelectItem value="Legal">US Legal (8.5 × 14 in)</SelectItem>
              <SelectItem value="fit">Same as image</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        {fixedPage && (
          <Field label="Orientation">
            <Segmented
              value={s.orientation} onChange={(v) => set("orientation", v)}
              options={[
                { value: "auto", label: "Auto", icon: <span className="flex items-end gap-0.5"><PageIcon w={9} h={13} /><PageIcon w={13} h={9} /></span> },
                { value: "portrait", label: "Portrait", icon: <PageIcon w={11} h={15} /> },
                { value: "landscape", label: "Landscape", icon: <PageIcon w={15} h={11} /> },
              ]}
            />
          </Field>
        )}

        <Field label="Margin">
          <Segmented
            value={s.margin} onChange={(v) => set("margin", v)}
            options={[{ value: "none", label: "None" }, { value: "small", label: "Small" }, { value: "medium", label: "Medium" }, { value: "large", label: "Large" }, { value: "custom", label: "Custom" }]}
          />
          {s.margin === "custom" && (
            <div className="flex items-center gap-3 pt-1">
              <Slider value={[s.customMargin]} min={0} max={60} step={1} onValueChange={([v]) => set("customMargin", v)} />
              <span className="w-14 text-right text-sm tabular-nums">{s.customMargin} mm</span>
            </div>
          )}
        </Field>

        {fixedPage && (
          <Field label="Image fit">
            <Select value={s.fit} onValueChange={(v) => set("fit", v as FitMode)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="contain">Fit to page (keep ratio)</SelectItem>
                <SelectItem value="cover">Fill page (crop edges)</SelectItem>
                <SelectItem value="stretch">Stretch to page</SelectItem>
                <SelectItem value="original">Original size</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}

        {fixedPage && (s.fit === "contain" || s.fit === "original") && (
          <Field label="Vertical position">
            <Segmented value={s.align} onChange={(v) => set("align", v)} options={[{ value: "center", label: "Center" }, { value: "top", label: "Top" }]} />
          </Field>
        )}

        <Field label="Page background" hint={s.background}>
          <div className="flex items-center gap-2">
            {["#ffffff", "#f5f5f4", "#000000", "#fef3c7", "#e0f2fe"].map((c) => (
              <button
                key={c} type="button" aria-label={c} onClick={() => set("background", c)}
                className={cx("size-8 cursor-pointer rounded-md border shadow-xs", s.background === c && "ring-2 ring-primary ring-offset-2 ring-offset-background")}
                style={{ background: c }}
              />
            ))}
            <input type="color" value={s.background} onChange={(e) => set("background", e.target.value)}
              className="h-8 w-10 cursor-pointer rounded-md border bg-transparent p-0.5" aria-label="Custom color" />
          </div>
        </Field>
      </TabsContent>

      <TabsContent value="image" className="space-y-5">
        <Field label="Image format">
          <Segmented value={s.format} onChange={(v) => set("format", v)} options={[{ value: "jpeg", label: "JPEG · smaller" }, { value: "png", label: "PNG · lossless" }]} />
        </Field>
        {s.format === "jpeg" && (
          <Field label="Quality" hint={`${s.quality}%`}>
            <Slider value={[s.quality]} min={10} max={100} step={5} onValueChange={([v]) => set("quality", v)} />
            <div className="flex justify-between text-xs text-muted-foreground"><span>Smallest file</span><span>Best quality</span></div>
          </Field>
        )}
        <Field label="Resolution">
          <Segmented
            value={s.dpi} onChange={(v) => set("dpi", v)}
            options={[{ value: "72", label: "72 dpi" }, { value: "150", label: "150 dpi" }, { value: "300", label: "300 dpi" }, { value: "original", label: "Original" }]}
          />
          <p className="text-xs text-muted-foreground">150 dpi is good for screen &amp; email. Choose 300 dpi for printing.</p>
        </Field>
        <SwitchRow label="Black & white" desc="Convert every page to grayscale" checked={s.grayscale} onChange={(v) => set("grayscale", v)} />
      </TabsContent>

      <TabsContent value="output" className="space-y-5">
        <Field label="File name">
          <div className="flex items-center gap-2">
            <Input value={s.fileName} onChange={(e) => set("fileName", e.target.value)} placeholder="images" />
            <span className="text-sm text-muted-foreground">.{s.output === "merge" ? "pdf" : "zip"}</span>
          </div>
        </Field>
        <Field label="Output">
          <Segmented value={s.output} onChange={(v) => set("output", v)} options={[{ value: "merge", label: "One merged PDF" }, { value: "separate", label: "PDF per image (ZIP)" }]} />
        </Field>
        <SwitchRow label="Page numbers" desc="Adds “1 / N” at the bottom" checked={s.pageNumbers} onChange={(v) => set("pageNumbers", v)} />
        <Field label="Watermark text" hint="optional">
          <Input value={s.watermark} onChange={(e) => set("watermark", e.target.value)} placeholder="e.g. CONFIDENTIAL" maxLength={40} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="PDF title"><Input value={s.title} onChange={(e) => set("title", e.target.value)} placeholder="Optional" /></Field>
          <Field label="Author"><Input value={s.author} onChange={(e) => set("author", e.target.value)} placeholder="Optional" /></Field>
        </div>
      </TabsContent>
    </Tabs>
  )
}

/* ═════════════════════════════ 10. Main component ═════════════════════════════ */

export default function ImageToPdf() {
  const [items, setItemsRaw] = useState<ImageItem[]>([])
  const [settings, setSettings] = useState<PdfSettings>(DEFAULT_SETTINGS)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [zoom, setZoom] = useState(190)
  const [loading, setLoading] = useState(0)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [result, setResult] = useState<(PdfResult & { url: string }) | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const touch = useTouch()
  const itemsRef = useRef(items)
  useEffect(() => { itemsRef.current = items }, [items])

  // Any change to pages or settings makes the last PDF stale.
  const setItems = useCallback((fn: (p: ImageItem[]) => ImageItem[]) => {
    setItemsRaw(fn)
    setResult((r) => { if (r) URL.revokeObjectURL(r.url); return null })
  }, [])

  const set = useCallback<SetSetting>((k, v) => {
    setSettings((s) => ({ ...s, [k]: v }))
    setResult((r) => { if (r) URL.revokeObjectURL(r.url); return null })
  }, [])

  const addFiles = useCallback(async (files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp|svg|avif)$/i.test(f.name))
    const skipped = files.length - imgs.length
    if (skipped) toast.warning(`${skipped} file${skipped > 1 ? "s" : ""} skipped — not an image`)
    const room = MAX_FILES - itemsRef.current.length
    if (imgs.length > room) toast.warning(`Only ${MAX_FILES} images allowed at once`)
    const batch = imgs.slice(0, Math.max(0, room))
    if (!batch.length) return
    setLoading((n) => n + batch.length)
    let failed = 0
    for (const f of batch) {
      try {
        const it = await fileToItem(f)
        setItems((p) => [...p, it])
      } catch { failed++ }
      setLoading((n) => n - 1)
    }
    if (failed) toast.error(`${failed} image${failed > 1 ? "s" : ""} could not be read (HEIC/corrupt?)`)
  }, [setItems])

  // Ctrl/⌘ + V paste
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? [])
      if (files.length) { e.preventDefault(); addFiles(files) }
    }
    window.addEventListener("paste", onPaste)
    return () => window.removeEventListener("paste", onPaste)
  }, [addFiles])

  // Free object URLs when the component unmounts
  useEffect(() => () => { itemsRef.current.forEach((i) => URL.revokeObjectURL(i.url)) }, [])

  const rotate = useCallback(async (ids: string[], dir: 1 | -1) => {
    const targets = itemsRef.current.filter((i) => ids.includes(i.id))
    const updates = await Promise.all(targets.map(async (i) => {
      const rotation = nextRotation(i.rotation, dir)
      return { id: i.id, rotation, thumb: await makeThumb(i.baseThumb, rotation) }
    }))
    setItems((p) => p.map((i) => { const u = updates.find((x) => x.id === i.id); return u ? { ...i, ...u } : i }))
  }, [setItems])

  const remove = useCallback((ids: string[]) => {
    const kill = new Set(ids)
    setItems((p) => {
      // revoke URLs only if no duplicate still uses them
      const keep = p.filter((i) => !kill.has(i.id))
      p.filter((i) => kill.has(i.id)).forEach((i) => { if (!keep.some((k) => k.url === i.url)) URL.revokeObjectURL(i.url) })
      return keep
    })
    setSelected((s) => { const n = new Set(s); ids.forEach((id) => n.delete(id)); return n })
  }, [setItems])

  const duplicate = useCallback((id: string) => {
    setItems((p) => {
      const idx = p.findIndex((i) => i.id === id)
      if (idx < 0) return p
      const copy = { ...p[idx], id: `${p[idx].id}-c${Math.random().toString(36).slice(2, 6)}` }
      return [...p.slice(0, idx + 1), copy, ...p.slice(idx + 1)]
    })
  }, [setItems])

  const sortBy = (mode: string) => {
    setItems((p) => {
      const a = [...p]
      const byName = (x: ImageItem, y: ImageItem) => x.name.localeCompare(y.name, undefined, { numeric: true, sensitivity: "base" })
      if (mode === "name-asc") a.sort(byName)
      if (mode === "name-desc") a.sort((x, y) => byName(y, x))
      if (mode === "date") a.sort((x, y) => x.addedAt - y.addedAt)
      if (mode === "size") a.sort((x, y) => y.size - x.size)
      if (mode === "reverse") a.reverse()
      return a
    })
  }

  const clearAll = () => {
    items.forEach((i) => URL.revokeObjectURL(i.url))
    setItems(() => [])
    setSelected(new Set())
  }

  const convert = async () => {
    if (!items.length) return
    setProgress({ done: 0, total: items.length })
    try {
      const r = await buildPdf(items, settings, (done, total) => setProgress({ done, total }))
      setResult({ ...r, url: URL.createObjectURL(r.blob) })
      toast.success(r.kind === "pdf" ? `PDF ready — ${r.pages} page${r.pages > 1 ? "s" : ""}` : `ZIP ready — ${r.pages} PDFs`)
      // desktop: bring the result card into view (on phones the bottom bar already shows it)
      if (window.matchMedia("(min-width: 1024px)").matches)
        setTimeout(() => document.getElementById("img2pdf-result")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50)
    } catch (e) {
      console.error(e)
      toast.error("Conversion failed. Try fewer or smaller images, or lower the resolution.")
    } finally {
      setProgress(null)
    }
  }

  const download = () => { if (result) downloadBlob(result.blob, result.fileName) }

  // Phones can't show a PDF inside an iframe — open it in a new tab (iPhone shows it, Android opens its PDF viewer)
  const openPdf = () => {
    if (!result) return
    if (touch) window.open(result.url, "_blank", "noopener")
    else setPdfOpen(true)
  }

  const totalSize = useMemo(() => items.reduce((n, i) => n + i.size, 0), [items])
  const selIds = [...selected].filter((id) => items.some((i) => i.id === id))
  const previewIdx = items.findIndex((i) => i.id === previewId)
  const previewItem = previewIdx >= 0 ? items[previewIdx] : null
  const busy = !!progress

  return (
    <TooltipProvider delayDuration={300}>
      {items.length === 0 && loading === 0 ? (
        <div className="mx-auto max-w-3xl"><Dropzone onFiles={addFiles} /></div>
      ) : (
        <div className="grid gap-4 pb-28 sm:gap-6 lg:grid-cols-[1fr_360px] lg:pb-0">
          {/* ── Board ── */}
          <section className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-2">
              <div className="flex flex-wrap items-center gap-x-2 px-1 text-sm sm:px-2">
                <span className="font-semibold">{items.length} page{items.length !== 1 && "s"}</span>
                <span className="text-muted-foreground">· {formatBytes(totalSize)}</span>
                {loading > 0 && <span className="inline-flex items-center gap-1 text-muted-foreground"><Loader2 className="size-3.5 animate-spin" /> loading {loading}…</span>}
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                {selIds.length > 0 ? (
                  <>
                    <Badge variant="outline">{selIds.length} selected</Badge>
                    <Button variant="outline" size="sm" aria-label="Rotate left" onClick={() => rotate(selIds, -1)}><RotateCcw /><span className="hidden sm:inline">Left</span></Button>
                    <Button variant="outline" size="sm" aria-label="Rotate right" onClick={() => rotate(selIds, 1)}><RotateCw /><span className="hidden sm:inline">Right</span></Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => remove(selIds)}><Trash2 /> Delete</Button>
                    <Button variant="ghost" size="icon" className="size-8" aria-label="Clear selection" onClick={() => setSelected(new Set())}><X /></Button>
                  </>
                ) : (
                  <>
                    <Select onValueChange={sortBy} value="">
                      <SelectTrigger className="h-8 w-[130px]"><ArrowDownUp className="size-4" /><SelectValue placeholder="Sort" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name-asc"><ArrowDownAZ className="size-4" /> Name A→Z</SelectItem>
                        <SelectItem value="name-desc"><ArrowUpAZ className="size-4" /> Name Z→A</SelectItem>
                        <SelectItem value="date"><CalendarClock className="size-4" /> Date modified</SelectItem>
                        <SelectItem value="size"><HardDrive className="size-4" /> Largest first</SelectItem>
                        <SelectItem value="reverse"><ArrowDownUp className="size-4" /> Reverse order</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => setSelected(new Set(items.map((i) => i.id)))}><CheckSquare /><span className="hidden min-[400px]:inline">Select all</span></Button>
                    <div className="hidden items-center gap-2 pl-1 sm:flex">
                      <ZoomIn className="size-4 text-muted-foreground" />
                      <Slider className="w-24" value={[zoom]} min={130} max={320} step={10} onValueChange={([v]) => setZoom(v)} aria-label="Board zoom" />
                    </div>
                    <Button variant="ghost" size="sm" className="text-muted-foreground" aria-label="Clear all" onClick={clearAll}><Trash2 /><span className="hidden min-[400px]:inline">Clear</span></Button>
                  </>
                )}
              </div>
            </div>

            <p className="px-1 text-xs text-muted-foreground">
              {touch ? "Hold and drag ⠿ to reorder. Tap a page to preview." : "Drag cards to reorder pages. Preview shows the real page layout."}
            </p>

            <Board
              items={items} settings={settings} zoom={zoom} selected={selected} setItems={setItems}
              onToggleSelect={(id) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })}
              onRotate={(id, d) => rotate([id], d)}
              onDuplicate={duplicate}
              onRemove={(id) => remove([id])}
              onPreview={setPreviewId}
              onFiles={addFiles}
            />
          </section>

          {/* ── Sidebar ── */}
          {/* Desktop sidebar (phones use the bottom bar + settings sheet below) */}
          <aside className="hidden space-y-4 lg:sticky lg:top-20 lg:block lg:self-start">
            <Card className="gap-4">
              <CardHeader>
                <CardTitle>PDF settings</CardTitle>
                <CardDescription>Changes update the board instantly.</CardDescription>
              </CardHeader>
              <CardContent><SettingsPanel s={settings} set={set} /></CardContent>
            </Card>

            <Card id="img2pdf-result" className="gap-3 py-4">
              <CardContent className="space-y-3 px-4">
                {result ? (
                  <>
                    <div className="flex items-center gap-3 rounded-lg bg-accent p-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"><FileText className="size-5" /></div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{result.fileName}</p>
                        <p className="text-xs text-muted-foreground">{result.kind === "pdf" ? `${result.pages} pages` : `${result.pages} PDFs`} · {formatBytes(result.blob.size)}</p>
                      </div>
                    </div>
                    <Button size="lg" className="w-full" onClick={download}><Download /> Download {result.kind === "pdf" ? "PDF" : "ZIP"}</Button>
                    <div className="grid grid-cols-2 gap-2">
                      {result.kind === "pdf" && <Button variant="outline" onClick={openPdf}><ExternalLink /> Preview</Button>}
                      <Button variant="outline" className={result.kind === "zip" ? "col-span-2" : ""} onClick={convert}><RefreshCcw /> Rebuild</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Button size="lg" className="w-full" disabled={busy || loading > 0 || !items.length} onClick={convert}>
                      {busy ? <><Loader2 className="animate-spin" /> Converting {progress!.done}/{progress!.total}</> : <><FileText /> Convert to PDF</>}
                    </Button>
                    {busy && (
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary transition-all" style={{ width: `${(progress!.done / progress!.total) * 100}%` }} />
                      </div>
                    )}
                    <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><ShieldCheck className="size-3.5" /> Processed locally in your browser</p>
                  </>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      )}

      {/* ── Phone / tablet bottom bar ── */}
      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur lg:hidden">
          {busy && (
            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${(progress!.done / progress!.total) * 100}%` }} />
            </div>
          )}
          <div className="mx-auto flex max-w-xl items-center gap-2">
            <Button variant="outline" size="lg" className="shrink-0 px-3" onClick={() => setSettingsOpen(true)} aria-label="PDF settings">
              <SlidersHorizontal /><span className="hidden min-[380px]:inline">Settings</span>
            </Button>
            {result ? (
              <>
                {result.kind === "pdf" && (
                  <Button variant="outline" size="lg" className="shrink-0 px-3" onClick={openPdf} aria-label="Open PDF"><ExternalLink /></Button>
                )}
                <Button size="lg" className="min-w-0 flex-1" onClick={download}>
                  <Download /><span className="truncate">Download {result.kind === "pdf" ? "PDF" : "ZIP"}</span>
                  <span className="hidden text-xs font-normal opacity-80 min-[420px]:inline">{formatBytes(result.blob.size)}</span>
                </Button>
              </>
            ) : (
              <Button size="lg" className="min-w-0 flex-1" disabled={busy || loading > 0} onClick={convert}>
                {busy
                  ? <><Loader2 className="animate-spin" /> {progress!.done}/{progress!.total}</>
                  : <><FileText /><span className="truncate">Convert {items.length} to PDF</span></>}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── Settings bottom sheet (phones / tablets) ── */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="top-auto bottom-0 left-0 max-h-[88dvh] w-full max-w-full translate-x-0 translate-y-0 gap-3 overflow-y-auto rounded-t-2xl rounded-b-none border-b-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:max-w-full lg:hidden">
          <div className="mx-auto -mt-1 h-1.5 w-10 rounded-full bg-muted" aria-hidden />
          <DialogTitle>PDF settings</DialogTitle>
          <DialogDescription className="-mt-2">Changes update the pages instantly.</DialogDescription>
          <SettingsPanel s={settings} set={set} />
          <Button size="lg" className="w-full" onClick={() => setSettingsOpen(false)}>Done</Button>
        </DialogContent>
      </Dialog>

      {/* ── Single page preview ── */}
      <Dialog open={!!previewItem} onOpenChange={(o) => !o && setPreviewId(null)}>
        <DialogContent className="max-h-[92dvh] gap-3 overflow-y-auto p-4 sm:max-w-4xl sm:gap-4 sm:p-6">
          {previewItem && (
            <>
              <DialogTitle className="truncate pr-8 text-base sm:text-lg">Page {previewIdx + 1} · {previewItem.name}</DialogTitle>
              <DialogDescription>{previewItem.width}×{previewItem.height}px · {formatBytes(previewItem.size)} · rotated {previewItem.rotation}°</DialogDescription>
              <div className="grid place-items-center rounded-lg bg-muted p-3 sm:p-4">
                <div className="w-full max-w-[min(100%,calc(58dvh*0.72))] sm:max-w-[min(100%,calc(70vh*0.72))]"><PagePreview item={previewItem} settings={settings} /></div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <Button variant="outline" disabled={previewIdx === 0} aria-label="Previous page" onClick={() => setPreviewId(items[previewIdx - 1].id)}><ChevronLeft /><span className="hidden sm:inline">Prev</span></Button>
                <div className="flex gap-1.5 sm:gap-2">
                  <Button variant="outline" size="icon" aria-label="Rotate left" onClick={() => rotate([previewItem.id], -1)}><RotateCcw /></Button>
                  <Button variant="outline" size="icon" aria-label="Rotate right" onClick={() => rotate([previewItem.id], 1)}><RotateCw /></Button>
                  <Button variant="outline" size="icon" aria-label="Remove" className="text-destructive"
                    onClick={() => { const nxt = items[previewIdx + 1] ?? items[previewIdx - 1]; remove([previewItem.id]); setPreviewId(nxt?.id ?? null) }}><Trash2 /></Button>
                </div>
                <Button variant="outline" disabled={previewIdx === items.length - 1} aria-label="Next page" onClick={() => setPreviewId(items[previewIdx + 1].id)}><span className="hidden sm:inline">Next</span><ChevronRight /></Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Generated PDF preview ── */}
      <Dialog open={pdfOpen && !!result} onOpenChange={setPdfOpen}>
        <DialogContent className="h-[90vh] grid-rows-[auto_1fr_auto] sm:max-w-5xl">
          <DialogTitle>{result?.fileName}</DialogTitle>
          {result && <iframe title="PDF preview" src={result.url} className="h-full w-full rounded-md border bg-muted" />}
          <div className="flex justify-end"><Button onClick={download}><Download /> Download</Button></div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}