"use client"
/**
 * Meme Generator — the whole tool in one file (UI, logic and helpers). Runs entirely in the browser.
 */
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { ClipboardPaste, Download, ImageUp, Plus, ShieldCheck, Upload, X, SlidersHorizontal, Loader2 } from "lucide-react"
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
interface M {
  style: "classic" | "caption"; top: string; bottom: string; size: number; fill: string; stroke: string
  strokeW: number; upper: boolean; font: string
  extras: { id: string; text: string; x: number; y: number; size: number }[]
}
const FONTS = [
  { v: "Impact, 'Arial Black', sans-serif", l: "Impact" },
  { v: "'Arial Black', Arial, sans-serif", l: "Arial Black" },
  { v: "Georgia, serif", l: "Serif" },
  { v: "'Comic Sans MS', 'Comic Sans', cursive", l: "Comic" },
]

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const lines: string[] = []
  for (const para of text.split("\n")) {
    let line = ""
    for (const w of para.split(/\s+/)) {
      const t = line ? `${line} ${w}` : w
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w } else line = t
    }
    lines.push(line)
  }
  return lines
}

function render(img: HTMLImageElement, W: number, H: number, m: M) {
  const fs = (W * m.size) / 100
  const font = `bold ${fs}px ${m.font}`
  const tx = (s: string) => (m.upper ? s.toUpperCase() : s).trim()
  const measure = newCanvas(1, 1).ctx
  measure.font = font
  const lh = fs * 1.12
  const pad = W * 0.04

  if (m.style === "caption") {
    const lines = tx(m.top) ? wrap(measure, tx(m.top), W - pad * 2) : []
    const barH = lines.length ? lines.length * lh + pad * 2 : 0
    const { c, ctx } = newCanvas(W, H + barH)
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, barH)
    ctx.drawImage(img, 0, barH, W, H)
    ctx.font = font; ctx.fillStyle = "#111"; ctx.textAlign = "center"; ctx.textBaseline = "top"
    lines.forEach((l, i) => ctx.fillText(l, W / 2, pad + i * lh))
    return c
  }

  const { c, ctx } = newCanvas(W, H)
  ctx.drawImage(img, 0, 0, W, H)
  ctx.font = font; ctx.textAlign = "center"; ctx.lineJoin = "round"
  ctx.fillStyle = m.fill; ctx.strokeStyle = m.stroke; ctx.lineWidth = (fs * m.strokeW) / 100
  const draw = (lines: string[], y: number) => lines.forEach((l, i) => {
    if (ctx.lineWidth) ctx.strokeText(l, W / 2, y + i * lh)
    ctx.fillText(l, W / 2, y + i * lh)
  })
  ctx.textBaseline = "top"
  if (tx(m.top)) draw(wrap(ctx, tx(m.top), W - pad * 2), pad)
  if (tx(m.bottom)) {
    const lines = wrap(ctx, tx(m.bottom), W - pad * 2)
    draw(lines, H - pad - lines.length * lh)
  }
  // extra free-position text boxes
  for (const e of m.extras) {
    if (!tx(e.text)) continue
    const f = (W * e.size) / 100, l2 = f * 1.12
    ctx.font = `bold ${f}px ${m.font}`; ctx.lineWidth = (f * m.strokeW) / 100; ctx.textBaseline = "middle"
    const lines = wrap(ctx, tx(e.text), W * 0.9)
    lines.forEach((l, i) => {
      const y = e.y * H + (i - (lines.length - 1) / 2) * l2
      if (ctx.lineWidth) ctx.strokeText(l, e.x * W, y)
      ctx.fillText(l, e.x * W, y)
    })
  }
  return c
}

function MemeGeneratorTool() {
  const [src, setSrc] = useState<{ file: File; img: HTMLImageElement; w: number; h: number } | null>(null)
  const [m, setM] = useState<M>({ style: "classic", top: "When the PDF finally merges", bottom: "on the first try", size: 9, fill: "#ffffff", stroke: "#000000", strokeW: 12, upper: true, font: FONTS[0].v, extras: [] })
  const [sel, setSel] = useState<string | null>(null)
  const setExtra = (id: string, patch: Partial<M["extras"][number]>) => setM((p) => ({ ...p, extras: p.extras.map((e) => (e.id === id ? { ...e, ...patch } : e)) }))
  const [fmt, setFmt] = useState<"jpeg" | "png">("jpeg")
  const ref = useRef<HTMLDivElement>(null)
  const set = <K extends keyof M>(k: K, v: M[K]) => setM((p) => ({ ...p, [k]: v }))

  useEffect(() => {
    if (!src || !ref.current) return
    const k = Math.min(1, 900 / src.w)
    const c = render(src.img, src.w * k, src.h * k, m)
    c.className = "max-h-[70vh] max-w-full rounded shadow"
    ref.current.replaceChildren(c)
  }, [src, m])

  const load = async (fs: File[]) => {
    try { const r = await fileToImage(fs[0]); setSrc({ file: fs[0], img: r.img, w: r.w, h: r.h }) } catch { toast.error("Could not read this image") }
  }

  const download = async () => {
    if (!src) return
    // memes look best ≥ 1000px wide
    const k = src.w < 1000 ? 1000 / src.w : Math.min(1, 2400 / src.w)
    const c = render(src.img, src.w * k, src.h * k, m)
    const blob = await canvasToBlob(c, fmt, 0.92)
    saveBlob(blob, `${baseName(src.file.name)}-meme.${fmt === "jpeg" ? "jpg" : "png"}`).catch(() => toast.error("Download failed"))
  }

  if (!src) return <FileDrop accept={ACCEPTED} multiple={false} onFiles={load} paste hint="Any photo or meme template" />

  const runBtn = (
    <Button size="lg" className="w-full" onClick={download}><Download /> Download meme</Button>
  )
  return (
    <ToolGrid mobile="inline"
      action={runBtn}
      main={<>
        <div ref={ref} className={`grid place-items-center rounded-xl border bg-muted p-4 ${sel ? "[&_canvas]:cursor-crosshair" : ""}`}
          onClick={(e) => {
            const c = (e.target as HTMLElement).closest("canvas"); if (!c || !sel) return
            const r = c.getBoundingClientRect()
            setExtra(sel, { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height })
          }} />
        {m.style === "classic" && sel && <p className="text-center text-xs text-muted-foreground">Click on the image to move the selected text box.</p>}
      </>}
      side={<Panel title="Meme text">
        <Segmented value={m.style} onChange={(v) => set("style", v)} options={[{ value: "classic", label: "Classic" }, { value: "caption", label: "Caption bar" }]} />
        <Field label={m.style === "caption" ? "Caption" : "Top text"}>
          <textarea value={m.top} onChange={(e) => set("top", e.target.value)} rows={2} className="w-full rounded-md border border-input bg-transparent p-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50" />
        </Field>
        {m.style === "classic" && <Field label="Bottom text"><Input value={m.bottom} onChange={(e) => set("bottom", e.target.value)} /></Field>}
        {m.style === "classic" && (
          <div className="space-y-2">
            {m.extras.map((x, i) => (
              <div key={x.id} onClick={() => setSel(x.id)} className={`space-y-2 rounded-lg border p-2 ${sel === x.id ? "border-primary bg-accent/40" : ""}`}>
                <div className="flex items-center gap-2">
                  <Input value={x.text} onChange={(e) => setExtra(x.id, { text: e.target.value })} placeholder={`Text box ${i + 1}`} className="h-8" />
                  <Button variant="ghost" size="icon-sm" aria-label="Remove text box" onClick={(e) => { e.stopPropagation(); setM((p) => ({ ...p, extras: p.extras.filter((q) => q.id !== x.id) })); if (sel === x.id) setSel(null) }}><X /></Button>
                </div>
                <SliderField label="Size" value={x.size} onChange={(v) => setExtra(x.id, { size: v })} min={3} max={18} suffix="%" />
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={() => { const id = crypto.randomUUID(); setM((p) => ({ ...p, extras: [...p.extras, { id, text: "More text", x: 0.5, y: 0.5, size: 7 }] })); setSel(id) }}><Plus /> Add text box</Button>
          </div>
        )}
        <Field label="Font">
          <Segmented value={m.font} onChange={(v) => set("font", v)} options={FONTS.map((f) => ({ value: f.v, label: f.l }))} />
        </Field>
        <SliderField label="Text size" value={m.size} onChange={(v) => set("size", v)} min={3} max={18} suffix="%" />
        {m.style === "classic" && (
          <>
            <ColorField label="Text color" value={m.fill} onChange={(v) => set("fill", v)} />
            <ColorField label="Outline color" value={m.stroke} onChange={(v) => set("stroke", v)} />
            <SliderField label="Outline width" value={m.strokeW} onChange={(v) => set("strokeW", v)} min={0} max={25} />
          </>
        )}
        <SwitchRow label="ALL CAPS" checked={m.upper} onChange={(v) => set("upper", v)} />
        <Field label="Save as"><Segmented value={fmt} onChange={setFmt} options={[{ value: "jpeg", label: "JPG" }, { value: "png", label: "PNG" }]} /></Field>
        <div className="space-y-2">
          <div className="hidden lg:block">{runBtn}</div>
          <Button variant="outline" className="w-full" onClick={() => setSrc(null)}><ImageUp /> New image</Button>
        </div>
      </Panel>}
    />
  )
}

/** Tools use files, canvas, workers and local storage, so they render only in the browser. */
const subscribeNothing = () => () => {}
export default function MemeGenerator() {
  const inBrowser = useSyncExternalStore(subscribeNothing, () => true, () => false)
  if (!inBrowser) {
    return (
      <div className="grid h-64 place-items-center rounded-xl border border-dashed bg-card/50" aria-busy="true">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  return <MemeGeneratorTool />
}
