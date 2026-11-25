"use client"
/**
 * Merge PDF — the whole tool in one file (UI, logic and helpers). Runs entirely in the browser.
 */
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ArrowDownAZ, ClipboardPaste, Download, GripVertical, Layers, Loader2, Plus, ShieldCheck, Trash2, Upload, X, SlidersHorizontal } from "lucide-react"
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

/* ═══════════════ Tool ═══════════════ */
interface Item { id: string; file: File; bytes: ArrayBuffer; pages: number; thumb: string; range: string }
const PDF_ACCEPT = "application/pdf,.pdf"

function Row({ it, index, onRange, onRemove }: { it: Item; index: number; onRange: (v: string) => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: it.id })
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-xl border bg-card p-3 shadow-xs ${isDragging ? "z-10 opacity-60 shadow-lg" : ""}`}>
      <button type="button" className="-m-2 grid size-10 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted-foreground active:cursor-grabbing active:bg-accent" aria-label="Drag to reorder" {...attributes} {...listeners}><GripVertical className="size-5" /></button>
      <span className="w-6 text-center text-sm font-semibold text-muted-foreground">{index + 1}</span>
      <img src={it.thumb} alt="" className="h-16 w-12 shrink-0 rounded border bg-white object-contain" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{it.file.name}</p>
        <p className="text-xs text-muted-foreground">{it.pages} page{it.pages > 1 && "s"} · {formatBytes(it.file.size)}</p>
      </div>
      <Input value={it.range} onChange={(e) => onRange(e.target.value)} placeholder={`All (1-${it.pages})`} className="hidden h-8 w-36 text-xs sm:block" aria-label="Pages to include" />
      <Button variant="ghost" size="icon-sm" aria-label="Remove" onClick={onRemove}><X /></Button>
    </li>
  )
}

function MergePdfTool() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(0)
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState("merged")
  const [result, setResult] = useState<Blob | null>(null)
  const [blankBetween, setBlankBetween] = useState(false)
  const [toA4, setToA4] = useState(false)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const change = (fn: (p: Item[]) => Item[]) => { setItems(fn); setResult(null) }

  const add = async (files: File[]) => {
    setLoading((n) => n + files.length)
    for (const f of files) {
      try {
        const { bytes, doc } = await readPdf(f)
        const c = await renderPage(doc, 1, 0.4)
        const it: Item = { id: `${Date.now()}-${Math.random()}`, file: f, bytes, pages: doc.numPages, thumb: c.toDataURL("image/jpeg", 0.7), range: "" }
        void doc.loadingTask.destroy()
        change((p) => [...p, it])
      } catch (e) { toast.error((e as Error).message) }
      setLoading((n) => n - 1)
    }
  }

  const onEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) change((p) => arrayMove(p, p.findIndex((i) => i.id === active.id), p.findIndex((i) => i.id === over.id)))
  }

  const merge = async () => {
    setBusy(true)
    try {
      const out = await PDFDocument.create()
      for (const it of items) {
        const src = await loadPdfLib(it.bytes)
        let idx = src.getPageIndices()
        if (it.range.trim()) {
          try { idx = parseRanges(it.range, it.pages).flat() } catch (e) { throw new Error(`${it.file.name}: ${(e as Error).message}`) }
        }
        if (toA4) {
          // scale every page onto an A4 sheet (portrait or landscape to match)
          const emb = await out.embedPages(idx.map((i) => src.getPage(i)))
          emb.forEach((e, k) => {
            const rot = ((src.getPage(idx[k]).getRotation().angle % 360) + 360) % 360
            const side = rot % 180 !== 0
            const w0 = side ? e.height : e.width, h0 = side ? e.width : e.height
            const land = w0 > h0
            const [W, H] = land ? [841.89, 595.28] : [595.28, 841.89]
            const s = Math.min(W / w0, H / h0)
            const bx = (W - w0 * s) / 2, by = (H - h0 * s) / 2
            // drawPage rotates (counter-clockwise) around its x/y anchor; shift the anchor so the result lands in the box
            const anchor = rot === 90 ? [bx, by + h0 * s] : rot === 180 ? [bx + w0 * s, by + h0 * s] : rot === 270 ? [bx + w0 * s, by] : [bx, by]
            out.addPage([W, H]).drawPage(e, { x: anchor[0], y: anchor[1], xScale: s, yScale: s, rotate: degrees(-rot) })
          })
        } else {
          const pages = await out.copyPages(src, idx)
          pages.forEach((p) => out.addPage(p))
        }
        if (blankBetween && it !== items[items.length - 1]) {
          const last = out.getPage(out.getPageCount() - 1).getSize()
          out.addPage([last.width, last.height])
        }
      }
      out.setTitle(name || "merged")
      out.setProducer("PixTools")
      const blob = await pdfBytesToBlob(out)
      setResult(blob)
      toast.success(`Merged ${out.getPageCount()} pages`)
    } catch (e) { toast.error((e as Error).message || "Merge failed") } finally { setBusy(false) }
  }

  const total = items.reduce((n, i) => n + (i.range.trim() ? (() => { try { return parseRanges(i.range, i.pages).flat().length } catch { return 0 } })() : i.pages), 0)
  const fileName = `${(name.trim() || "merged").replace(/\.pdf$/i, "")}.pdf`

  if (!items.length && !loading) return <FileDrop accept={PDF_ACCEPT} onFiles={add} title="Drop PDFs to merge" hint="Add two or more PDF files" />

  const downloadBtn = result && (
    <Button size="lg" className="w-full" onClick={() => saveBlob(result, fileName)}><Download /> Download PDF</Button>
  )
  const runBtn = (
    <Button size="lg" className="w-full" disabled={busy || items.length < 2 || loading > 0} onClick={merge}>
      {busy ? <Loader2 className="animate-spin" /> : <Layers />} {items.length < 2 ? "Add at least 2 PDFs" : `Merge ${items.length} PDFs`}
    </Button>
  )
  return (
    <ToolGrid
      action={result ? downloadBtn : runBtn}
      main={<>
        <p className="px-1 text-sm text-muted-foreground">Drag to set the order. Optionally type page ranges per file (e.g. <code>1-3, 5</code>).</p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ol className="space-y-2">
              {items.map((it, i) => (
                <Row key={it.id} it={it} index={i}
                  onRange={(v) => change((p) => p.map((x) => (x.id === it.id ? { ...x, range: v } : x)))}
                  onRemove={() => change((p) => p.filter((x) => x.id !== it.id))} />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
        {loading > 0 && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Reading {loading} file(s)…</p>}
        <FileDrop compact accept={PDF_ACCEPT} onFiles={add} title="Add more PDFs" />
      </>}
      side={<Panel title="Merge">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-3 text-sm">
          <span className="text-muted-foreground">Files</span><span className="text-right font-medium">{items.length}</span>
          <span className="text-muted-foreground">Total pages</span><span className="text-right font-medium">{total}</span>
        </div>
        <Field label="File name"><div className="flex items-center gap-2"><Input value={name} onChange={(e) => { setName(e.target.value) }} /><span className="text-sm text-muted-foreground">.pdf</span></div></Field>
        <SwitchRow label="Blank page between files" desc="Handy for double-sided printing" checked={blankBetween} onChange={(v) => { setBlankBetween(v); setResult(null) }} />
        <SwitchRow label="Make every page A4" desc="Scale mixed page sizes to one size" checked={toA4} onChange={(v) => { setToA4(v); setResult(null) }} />
        <Button variant="outline" size="sm" onClick={() => change((p) => [...p].sort((a, b) => a.file.name.localeCompare(b.file.name, undefined, { numeric: true })))}><ArrowDownAZ /> Sort by name</Button>
        {result ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{fileName} · {formatBytes(result.size)}</p>
            <div className="hidden lg:block">{downloadBtn}</div>
          </div>
        ) : (
          <div className="hidden lg:block">{runBtn}</div>
        )}
        <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => change(() => [])}><Trash2 /> Clear all</Button>
      </Panel>}
    />
  )
}

/** Tools use files, canvas, workers and local storage, so they render only in the browser. */
const subscribeNothing = () => () => {}
export default function MergePdf() {
  const inBrowser = useSyncExternalStore(subscribeNothing, () => true, () => false)
  if (!inBrowser) {
    return (
      <div className="grid h-64 place-items-center rounded-xl border border-dashed bg-card/50" aria-busy="true">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  return <MergePdfTool />
}
