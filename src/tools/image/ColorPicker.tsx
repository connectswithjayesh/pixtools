"use client"
/**
 * Image Color Picker — the whole tool in one file (UI, logic and helpers). Runs entirely in the browser.
 */
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ClipboardPaste, Copy, ImageUp, Pipette, Plus, ShieldCheck, Trash2, Upload } from "lucide-react"
import { useEffect, useRef, useState } from "react"
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

/* ─── helpers (from lib/canvas.ts) ─── */

/** Load a File into an <img> and return it with its object URL. */
async function fileToImage(file: File) {
  const url = URL.createObjectURL(file)
  const img = await loadImage(url)
  return { img, url, w: img.naturalWidth || 1000, h: img.naturalHeight || 1000 }
}

/* ─── helpers (from lib/clipboard.ts) ─── */
async function copyText(text: string, label = "Copied") {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(label)
  } catch {
    const ta = document.createElement("textarea")
    ta.value = text
    ta.style.position = "fixed"; ta.style.opacity = "0"
    document.body.appendChild(ta); ta.select()
    const ok = document.execCommand?.("copy")
    ta.remove()
    if (ok) toast.success(label)
    else toast.error("Copy blocked — select the text and copy manually")
  }
}

/* ═══════════════ Tool ═══════════════ */
type RGB = [number, number, number]
const hex = ([r, g, b]: RGB) => "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()
function hsl([r, g, b]: RGB) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
    h *= 60
  }
  return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
}
function cmyk([r, g, b]: RGB) {
  const k = 1 - Math.max(r, g, b) / 255
  if (k === 1) return "cmyk(0%, 0%, 0%, 100%)"
  const f = (v: number) => Math.round(((1 - v / 255 - k) / (1 - k)) * 100)
  return `cmyk(${f(r)}%, ${f(g)}%, ${f(b)}%, ${Math.round(k * 100)}%)`
}
const isLight = ([r, g, b]: RGB) => r * 0.299 + g * 0.587 + b * 0.114 > 150
const mix = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as RGB
function rotateHue([r, g, b]: RGB, deg: number): RGB {
  // via HSL
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) { const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min); h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6 }
  h = (h + deg / 360 + 1) % 1
  const f = (p: number, q: number, t: number) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p }
  if (!s) return [l, l, l].map((v) => Math.round(v * 255)) as RGB
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q
  return [f(p, q, h + 1 / 3), f(p, q, h), f(p, q, h - 1 / 3)].map((v) => Math.round(v * 255)) as RGB
}
const fromHex = (h: string): RGB => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }

function palette(img: HTMLImageElement, count = 8): RGB[] {
  const c = document.createElement("canvas")
  const k = Math.min(1, 120 / Math.max(img.naturalWidth, img.naturalHeight))
  c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k))
  const ctx = c.getContext("2d")!
  ctx.drawImage(img, 0, 0, c.width, c.height)
  const d = ctx.getImageData(0, 0, c.width, c.height).data
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>()
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue
    const key = ((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4)
    const e = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 }
    e.n++; e.r += d[i]; e.g += d[i + 1]; e.b += d[i + 2]
    buckets.set(key, e)
  }
  const sorted = [...buckets.values()].sort((a, b) => b.n - a.n).map((e) => [e.r / e.n, e.g / e.n, e.b / e.n].map(Math.round) as RGB)
  const out: RGB[] = []
  for (const col of sorted) {
    if (out.every((o) => Math.hypot(o[0] - col[0], o[1] - col[1], o[2] - col[2]) > 48)) out.push(col)
    if (out.length >= count) break
  }
  return out
}

export default function ColorPicker() {
  const [src, setSrc] = useState<{ img: HTMLImageElement; url: string } | null>(null)
  const [cur, setCur] = useState<RGB>([239, 68, 68])
  const [hover, setHover] = useState<{ c: RGB; x: number; y: number; px: number; py: number } | null>(null)
  const [picked, setPicked] = useState<RGB[]>([])
  const [pal, setPal] = useState<RGB[]>([])
  const canvas = useRef<HTMLCanvasElement>(null)
  const loupe = useRef<HTMLCanvasElement>(null)

  const load = async (fs: File[]) => {
    try { const r = await fileToImage(fs[0]); const p = palette(r.img); setSrc({ img: r.img, url: r.url }); setPal(p); if (p[0]) setCur(p[0]); setPicked([]) }
    catch { toast.error("Could not read this image") }
  }

  useEffect(() => {
    if (!src || !canvas.current) return
    const c = canvas.current
    const k = Math.min(1, 1400 / Math.max(src.img.naturalWidth, src.img.naturalHeight))
    c.width = Math.round(src.img.naturalWidth * k); c.height = Math.round(src.img.naturalHeight * k)
    c.getContext("2d", { willReadFrequently: true })!.drawImage(src.img, 0, 0, c.width, c.height)
  }, [src])

  // magnifier: draw 11×11 pixels around the cursor, scaled up (runs after the loupe canvas exists)
  useEffect(() => {
    const L = loupe.current, c = canvas.current
    if (!hover || !L || !c) return
    const lx = L.getContext("2d")!
    lx.imageSmoothingEnabled = false
    lx.fillStyle = "#fff"; lx.fillRect(0, 0, L.width, L.height)
    lx.drawImage(c, hover.px - 5, hover.py - 5, 11, 11, 0, 0, L.width, L.height)
    const cell = L.width / 11
    lx.strokeStyle = "rgba(0,0,0,.85)"; lx.lineWidth = 2; lx.strokeRect(cell * 5, cell * 5, cell, cell)
  }, [hover])

  const at = (e: React.MouseEvent<HTMLCanvasElement>): RGB => {
    const c = canvas.current!
    const r = c.getBoundingClientRect()
    const x = Math.floor(((e.clientX - r.left) / r.width) * c.width)
    const y = Math.floor(((e.clientY - r.top) / r.height) * c.height)
    const d = c.getContext("2d", { willReadFrequently: true })!.getImageData(x, y, 1, 1).data
    return [d[0], d[1], d[2]]
  }

  const choose = (c: RGB) => { setCur(c); setPicked((p) => [c, ...p.filter((x) => hex(x) !== hex(c))].slice(0, 16)) }

  const eyedrop = async () => {
    const ED = (window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper
    if (!ED) return toast.info("Screen eyedropper works in Chrome & Edge")
    try { const r = await new ED().open(); choose(fromHex(r.sRGBHex)) } catch { /* cancelled */ }
  }

  const values = [
    { k: "HEX", v: hex(cur) }, { k: "RGB", v: `rgb(${cur.join(", ")})` }, { k: "HSL", v: hsl(cur) }, { k: "CMYK", v: cmyk(cur) },
  ]

  if (!src) return <FileDrop accept={ACCEPTED} multiple={false} onFiles={load} paste hint="Then click anywhere on it to grab a color" />

  return (
    <ToolGrid
      main={<>
        <div className="relative grid place-items-center rounded-xl border bg-muted p-3">
          <canvas
            ref={canvas} className="max-h-[70vh] max-w-full cursor-crosshair rounded"
            onMouseMove={(e) => {
              const c = canvas.current!, r = c.getBoundingClientRect()
              setHover({
                c: at(e), x: c.offsetLeft + e.nativeEvent.offsetX, y: c.offsetTop + e.nativeEvent.offsetY,
                px: Math.floor(((e.clientX - r.left) / r.width) * c.width), py: Math.floor(((e.clientY - r.top) / r.height) * c.height),
              })
            }}
            onMouseLeave={() => setHover(null)}
            onClick={(e) => choose(at(e))}
          />
          {hover && (
            <div className="pointer-events-none absolute z-10 overflow-hidden rounded-xl border bg-background shadow-xl"
              style={{ left: hover.x + 18, top: hover.y + 18 }}>
              <canvas ref={loupe} width={110} height={110} className="block size-[110px]" />
              <div className="flex items-center gap-2 border-t px-2 py-1 font-mono text-xs"><span className="size-4 rounded border" style={{ background: hex(hover.c) }} />{hex(hover.c)}</div>
            </div>
          )}
        </div>
        <Panel title="Image palette">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {pal.map((c) => (
              <button key={hex(c)} onClick={() => choose(c)} className="group cursor-pointer overflow-hidden rounded-lg border text-left">
                <span className="block h-14" style={{ background: hex(c) }} />
                <span className="block px-1.5 py-1 font-mono text-[11px]">{hex(c)}</span>
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => copyText(pal.map(hex).join(", "), "Palette copied")}><Copy /> Copy palette</Button>
        </Panel>
      </>}
      side={<>
        <Panel>
          <div className="grid h-28 place-items-center rounded-lg border text-lg font-semibold font-mono" style={{ background: hex(cur), color: isLight(cur) ? "#111" : "#fff" }}>{hex(cur)}</div>
          <div className="space-y-2">
            {values.map(({ k, v }) => (
              <div key={k} className="flex items-center gap-2 rounded-lg border p-2">
                <span className="w-11 text-xs font-semibold text-muted-foreground">{k}</span>
                <code className="flex-1 truncate text-sm">{v}</code>
                <Button variant="ghost" size="icon-sm" aria-label={`Copy ${k}`} onClick={() => copyText(v, `${k} copied`)}><Copy /></Button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={eyedrop}><Pipette /> From screen</Button>
            <Button variant="outline" onClick={() => setSrc(null)}><ImageUp /> New image</Button>
          </div>
        </Panel>
        <Panel title="Shades & harmony">
          {[
            { l: "Tints", c: [0.85, 0.7, 0.55, 0.4, 0.2].map((t) => mix(cur, [255, 255, 255], t)) },
            { l: "Shades", c: [0.2, 0.35, 0.5, 0.65, 0.8].map((t) => mix(cur, [0, 0, 0], t)) },
            { l: "Harmony", c: [rotateHue(cur, 180), rotateHue(cur, 30), rotateHue(cur, -30), rotateHue(cur, 120), rotateHue(cur, 240)] },
          ].map((row) => (
            <div key={row.l} className="space-y-1">
              <p className="text-xs text-muted-foreground">{row.l === "Harmony" ? "Complementary · analogous · triadic" : row.l}</p>
              <div className="grid grid-cols-5 gap-1">
                {row.c.map((c, i) => (
                  <button key={i} title={hex(c)} onClick={() => { setCur(c); copyText(hex(c), `${hex(c)} copied`) }}
                    className="h-8 cursor-pointer rounded border" style={{ background: hex(c) }} />
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Click a swatch to select and copy it.</p>
        </Panel>
        {picked.length > 0 && (
          <Panel title="Picked colors">
            <div className="flex flex-wrap gap-2">
              {picked.map((c) => (
                <button key={hex(c)} title={hex(c)} onClick={() => setCur(c)} className="size-9 cursor-pointer rounded-md border shadow-xs" style={{ background: hex(c) }} />
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => copyText(picked.map(hex).join("\n"), "Colors copied")}><Copy /> Copy all</Button>
              <Button variant="ghost" size="sm" onClick={() => setPicked([])}><Trash2 /> Clear</Button>
            </div>
          </Panel>
        )}
      </>}
    />
  )
}
