"use client"
/**
 * Organize PDF — the whole tool in one file (UI, logic and helpers). Runs entirely in the browser.
 */
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ArrowDownUp, ClipboardPaste, Copy, Download, FilePlus2, FileUp, Loader2, Plus, RotateCcw, RotateCw, Save, ShieldCheck, Square, Trash2, Undo2, Upload, GripVertical, SlidersHorizontal } from "lucide-react"
import { PDFDocument, degrees } from "pdf-lib"
import type { PDFDocumentProxy } from "pdfjs-dist"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"
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
interface Src { name: string; bytes: ArrayBuffer }
interface Pg { id: string; src: number; index: number; rot: number; thumb: string | null; blank?: boolean }

let seq = 0
const nid = () => `p${seq++}`
const PDF_ACCEPT = "application/pdf,.pdf"

/** True on phones and tablets (finger input), false with a mouse. SSR-safe. */
function useTouch() {
  return useSyncExternalStore(
    (cb) => { const m = window.matchMedia("(pointer: coarse)"); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb) },
    () => window.matchMedia("(pointer: coarse)").matches,
    () => false,
  )
}

function Card({ p, n, selected, onSelect, onRot, onDup, onDel }: {
  p: Pg; n: number; selected: boolean; onSelect: () => void; onRot: (d: number) => void; onDup: () => void; onDel: () => void
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: p.id })
  const touch = useTouch()
  const stop = { onPointerDown: (e: React.PointerEvent) => e.stopPropagation() }
  const actions = [
    { l: "Rotate left", i: <RotateCcw />, f: () => onRot(-90) },
    { l: "Rotate right", i: <RotateCw />, f: () => onRot(90) },
    { l: "Duplicate", i: <Copy />, f: onDup },
    { l: "Delete", i: <Trash2 />, f: onDel },
  ]
  // Mouse: drag the whole page. Touch: drag only by the ⠿ handle so swiping over pages still scrolls.
  const dragWhole = touch ? {} : { ...attributes, ...listeners }
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn(isDragging && "z-10 opacity-40")}>
      <div ref={touch ? undefined : setActivatorNodeRef} className={cn(!touch && "cursor-grab touch-none active:cursor-grabbing")} {...dragWhole}>
        <PdfPageThumb src={p.blank ? "" : p.thumb} n={n} rotation={p.rot} selected={selected}>
          {p.blank && <span className="absolute inset-2 bottom-7 grid place-items-center rounded-md bg-white text-xs text-neutral-400">Blank</span>}
          <label {...stop} className="absolute top-1 left-1 grid size-9 cursor-pointer place-items-center" aria-label={`Select page ${n}`}>
            <input type="checkbox" checked={selected} onChange={onSelect}
              className={cn("size-4 cursor-pointer accent-[var(--primary)]", !selected && !touch && "opacity-0 group-hover:opacity-100 focus-visible:opacity-100")} />
          </label>
          {!touch && (
            <div className="absolute inset-x-2 bottom-8 flex justify-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
              {actions.map((a) => (
                <Button key={a.l} variant="secondary" size="icon-sm" aria-label={a.l} title={a.l} className="size-7 bg-background/90 shadow" {...stop} onClick={(e) => { e.stopPropagation(); a.f() }}>{a.i}</Button>
              ))}
            </div>
          )}
        </PdfPageThumb>
      </div>
      {touch && (
        <div className="mt-1 grid grid-cols-5 gap-0.5 rounded-lg border bg-card p-0.5">
          <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label={`Drag page ${n} to reorder`}
            className="grid h-9 touch-none place-items-center rounded-md text-muted-foreground active:bg-accent">
            <GripVertical className="size-4" />
          </button>
          {actions.map((a) => (
            <Button key={a.l} type="button" variant="ghost" size="icon" aria-label={a.l} onClick={a.f}
              className={cn("h-9 w-full", a.l === "Delete" && "text-destructive")}>{a.i}</Button>
          ))}
        </div>
      )}
    </div>
  )
}

function OrganizePdfTool() {
  const [srcs, setSrcs] = useState<Src[]>([])
  const [pages, setPagesRaw] = useState<Pg[]>([])
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState("")
  const [result, setResult] = useState<Blob | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const history = useRef<Pg[][]>([])
  const [canUndo, setCanUndo] = useState(false)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const setPages = (fn: (p: Pg[]) => Pg[], record = true) => {
    setPagesRaw((p) => { if (record) history.current = [...history.current.slice(-30), p]; return fn(p) })
    if (record) setCanUndo(true)
    setResult(null)
  }
  const undo = () => { const prev = history.current.pop(); setCanUndo(history.current.length > 0); if (prev) { setPagesRaw(prev); setResult(null) } }

  const add = async (files: File[]) => {
    setLoading(true)
    for (const f of files) {
      try {
        const { bytes, doc } = await readPdf(f)
        const srcIndex = srcs.length + files.indexOf(f)
        setSrcs((s) => { const n = [...s]; n[srcIndex] = { name: f.name, bytes }; return n })
        if (!name) setName(`${baseName(f.name)}-organized`)
        const newPages: Pg[] = Array.from({ length: doc.numPages }, (_, i) => ({ id: nid(), src: srcIndex, index: i, rot: 0, thumb: null }))
        setPages((p) => [...p, ...newPages], false)
        setLoading(false)
        await renderThumbs(doc, (i, url) => {
          const id = newPages[i].id
          setPagesRaw((p) => p.map((x) => (x.src === srcIndex && x.index === i && (x.id === id || !x.thumb) ? { ...x, thumb: url } : x)))
        }, 200)
      } catch (e) { toast.error((e as Error).message) }
    }
    setLoading(false)
  }

  const ids = (id?: string) => (id ? [id] : [...sel])
  const rotate = (d: number, id?: string) => { const s = new Set(ids(id)); setPages((p) => p.map((x) => (s.has(x.id) ? { ...x, rot: (x.rot + d + 360) % 360 } : x))) }
  const del = (id?: string) => { const s = new Set(ids(id)); setPages((p) => p.filter((x) => !s.has(x.id))); setSel(new Set()) }
  const dup = (id: string) => setPages((p) => { const i = p.findIndex((x) => x.id === id); return [...p.slice(0, i + 1), { ...p[i], id: nid() }, ...p.slice(i + 1)] })
  const addBlank = () => setPages((p) => [...p, { id: nid(), src: -1, index: -1, rot: 0, thumb: null, blank: true }])

  const onEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (over && active.id !== over.id) setPages((p) => arrayMove(p, p.findIndex((x) => x.id === active.id), p.findIndex((x) => x.id === over.id)))
  }

  const save = async () => {
    setBusy(true)
    try {
      const out = await PDFDocument.create()
      const libs = await Promise.all(srcs.map((s) => loadPdfLib(s.bytes)))
      let lastSize: [number, number] = [595.28, 841.89]
      for (const p of pages) {
        if (p.blank) { const pg = out.addPage(lastSize); pg.setRotation(degrees(p.rot)); continue }
        const [cp] = await out.copyPages(libs[p.src], [p.index])
        cp.setRotation(degrees((cp.getRotation().angle + p.rot) % 360))
        const { width, height } = cp.getSize(); lastSize = [width, height]
        out.addPage(cp)
      }
      const blob = await pdfBytesToBlob(out)
      setResult(blob)
      toast.success(`Saved ${pages.length} pages`)
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }

  const fileName = `${(name.trim() || "organized").replace(/\.pdf$/i, "")}.pdf`
  const active = pages.find((p) => p.id === activeId)

  if (!pages.length && !loading) return <FileDrop accept={PDF_ACCEPT} onFiles={add} title="Drop a PDF to organize" hint="You can add more PDFs later to combine pages" />

  const downloadBtn = result && (
    <Button size="lg" className="w-full" onClick={() => saveBlob(result, fileName)}><Download /> Download PDF</Button>
  )
  const runBtn = (
    <Button size="lg" className="w-full" disabled={busy || !pages.length} onClick={save}>{busy ? <Loader2 className="animate-spin" /> : <Save />} Save PDF</Button>
  )
  return (
    <ToolGrid title="Organize PDF"
      action={result ? downloadBtn : runBtn}
      main={<>
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-2">
          <span className="px-2 text-sm font-semibold">{pages.length} pages</span>
          {sel.size > 0 && <>
            <span className="text-sm text-muted-foreground">{sel.size} selected:</span>
            <Button variant="outline" size="sm" onClick={() => rotate(-90)}><RotateCcw /> Left</Button>
            <Button variant="outline" size="sm" onClick={() => rotate(90)}><RotateCw /> Right</Button>
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => del()}><Trash2 /> Delete</Button>
          </>}
          <div className="ml-auto flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setSel(sel.size === pages.length ? new Set() : new Set(pages.map((p) => p.id)))}>{sel.size === pages.length ? "Deselect" : "Select all"}</Button>
            <Button variant="outline" size="sm" onClick={() => setPages((p) => [...p].reverse())}><ArrowDownUp /> Reverse</Button>
            <Button variant="outline" size="sm" onClick={addBlank}><Square /> Blank page</Button>
            <Button variant="ghost" size="sm" disabled={!canUndo} onClick={undo}><Undo2 /> Undo</Button>
          </div>
        </div>
        <p className="px-1 text-xs text-muted-foreground">Drag pages to reorder. Hover a page for rotate, duplicate and delete.</p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e) => setActiveId(String(e.active.id))} onDragEnd={onEnd} onDragCancel={() => setActiveId(null)}>
          <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3">
              {pages.map((p, i) => (
                <Card key={p.id} p={p} n={i + 1} selected={sel.has(p.id)}
                  onSelect={() => setSel((s) => { const n = new Set(s); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); return n })}
                  onRot={(d) => rotate(d, p.id)} onDup={() => dup(p.id)} onDel={() => del(p.id)} />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>{active && <div className="w-[130px] rotate-2 shadow-2xl"><PdfPageThumb src={active.thumb} n={pages.indexOf(active) + 1} rotation={active.rot} /></div>}</DragOverlay>
        </DndContext>
        {loading && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading pages…</p>}
        <FileDrop compact accept={PDF_ACCEPT} onFiles={add} title="Add pages from another PDF" />
      </>}
      side={<Panel title="Save">
        <Field label="File name"><div className="flex items-center gap-2"><Input value={name} onChange={(e) => setName(e.target.value)} /><span className="text-sm text-muted-foreground">.pdf</span></div></Field>
        {result ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{fileName} · {formatBytes(result.size)}</p>
            <></>
          </div>
        ) : (
          <></>
        )}
        <div className="grid grid-cols-1 gap-2">
          <Button variant="outline" onClick={() => document.querySelector<HTMLInputElement>('input[type=file][accept*="pdf"]')?.click()}><FilePlus2 /> Add another PDF</Button>
          <Button variant="ghost" className="text-muted-foreground" onClick={() => { setPagesRaw([]); setSrcs([]); setSel(new Set()); setResult(null); history.current = []; setCanUndo(false) }}><FileUp /> Start over</Button>
        </div>
      </Panel>}
    />
  )
}

/** Tools use files, canvas, workers and local storage, so they render only in the browser. */
const subscribeNothing = () => () => {}
export default function OrganizePdf() {
  const inBrowser = useSyncExternalStore(subscribeNothing, () => true, () => false)
  if (!inBrowser) {
    return (
      <div className="grid h-64 place-items-center rounded-xl border border-dashed bg-card/50" aria-busy="true">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  return <OrganizePdfTool />
}
