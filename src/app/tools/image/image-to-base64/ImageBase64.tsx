"use client"
/**
 * Image to Base64 — the whole tool in one file (UI, logic and helpers). Runs entirely in the browser.
 */
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { ClipboardPaste, Copy, Download, ImageUp, Plus, ShieldCheck, Trash2, Upload, Loader2, SlidersHorizontal } from "lucide-react"
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
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

/* ═══════════════ Tool ═══════════════ */
type Style = "uri" | "raw" | "css" | "html" | "md"

const readAsDataURL = (f: File) => new Promise<string>((res, rej) => {
  const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f)
})

const sniff = (b: Uint8Array): string | null => {
  const h = Array.from(b.slice(0, 12)).map((x) => x.toString(16).padStart(2, "0")).join("")
  if (h.startsWith("89504e47")) return "image/png"
  if (h.startsWith("ffd8ff")) return "image/jpeg"
  if (h.startsWith("47494638")) return "image/gif"
  if (h.startsWith("52494646") && h.slice(16, 24) === "57454250") return "image/webp"
  if (h.startsWith("424d")) return "image/bmp"
  if (new TextDecoder().decode(b.slice(0, 200)).includes("<svg")) return "image/svg+xml"
  return null
}

const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp", "image/bmp": "bmp", "image/svg+xml": "svg", "image/avif": "avif" }

const area = "min-h-48 w-full resize-y rounded-md border border-input bg-transparent p-3 font-mono text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

function Encode() {
  const [file, setFile] = useState<File | null>(null)
  const [uri, setUri] = useState("")
  const [style, setStyle] = useState<Style>("uri")

  const load = async (fs: File[]) => {
    try { setUri(await readAsDataURL(fs[0])); setFile(fs[0]) } catch { toast.error("Could not read file") }
  }
  const output = useMemo(() => {
    const raw = uri.split(",")[1] ?? ""
    switch (style) {
      case "raw": return raw
      case "css": return `background-image: url("${uri}");`
      case "html": return `<img src="${uri}" alt="${file?.name ?? ""}" />`
      case "md": return `![${file?.name ?? "image"}](${uri})`
      default: return uri
    }
  }, [uri, style, file])

  if (!file) return <FileDrop accept={ACCEPTED} multiple={false} onFiles={load} paste hint="Small images (icons, logos) are best for Base64" />

  return (
    <ToolGrid
      title="Image to Base64" settingsLabel="Output format" mobile="inline"
      action={<>
        <Button size="lg" className="w-full" onClick={() => copyText(output, "Base64 copied")}><Copy /> Copy</Button>
        <Button size="lg" variant="outline" className="w-full" onClick={() => saveBlob(new Blob([output], { type: "text/plain" }), `${baseName(file.name)}-base64.txt`)}><Download /> Save as .txt</Button>
      </>}
      main={<>
        <Panel>
          <div className="grid place-items-center rounded-lg bg-muted p-3"><img src={uri} alt={file.name} className="max-h-48" /></div>
        </Panel>
        <textarea readOnly value={output} aria-label="Base64 output" className={`${area} h-72`} onFocus={(e) => e.currentTarget.select()} />
      </>}
      side={
        <Panel>
          <Segmented value={style} onChange={setStyle} options={[
            { value: "uri", label: "Data URI" }, { value: "raw", label: "Base64" }, { value: "css", label: "CSS" }, { value: "html", label: "HTML" }, { value: "md", label: "Markdown" },
          ]} />
          <div className="space-y-1 text-sm">
            <p className="truncate font-medium">{file.name}</p>
            <p className="text-muted-foreground">File: {formatBytes(file.size)} · Base64: {formatBytes(output.length)}</p>
            {file.size > 100 * 1024 && <p className="text-xs text-amber-600 dark:text-amber-400">Tip: Base64 is ~33% bigger than the file — avoid it for large images.</p>}
          </div>
          <Button variant="outline" className="w-full" onClick={() => { setFile(null); setUri("") }}><ImageUp /> Choose another</Button>
        </Panel>
      }
    />
  )
}

function Decode() {
  const [text, setText] = useState("")
  const decoded = useMemo(() => {
    const t = text.trim()
    if (!t) return null
    try {
      let mime: string | null = null
      let b64 = t
      const m = t.match(/^data:([^;,]+)?(;base64)?,(.*)$/s)
      if (m) { mime = m[1] ?? null; b64 = m[3] }
      b64 = b64.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/")
      while (b64.length % 4) b64 += "="
      const bin = atob(b64)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      mime = sniff(bytes) ?? mime
      if (!mime) return { error: "Decoded data is not a recognised image" }
      const blob = new Blob([bytes], { type: mime })
      return { blob, mime, url: URL.createObjectURL(blob) }
    } catch { return { error: "That is not valid Base64" } }
  }, [text])

  const ok = decoded && "url" in decoded && decoded.url ? decoded : null
  return (
    <ToolGrid
      title="Base64 to Image" settingsLabel="Image preview" mobile="inline"
      action={ok ? <Button size="lg" className="w-full" onClick={() => saveBlob(ok.blob!, `decoded-image.${EXT[ok.mime!] ?? "png"}`)}><Download /> Download image</Button> : undefined}
      main={
        <Field label="Paste Base64 or a data URI">
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="data:image/png;base64,iVBORw0KGgo…" className={`${area} h-72`} />
          {text && <Button variant="ghost" size="sm" onClick={() => setText("")}><Trash2 /> Clear</Button>}
        </Field>
      }
      side={
        <Panel>
          {!decoded && <p className="text-sm text-muted-foreground">The image appears here.</p>}
          {decoded && "error" in decoded && <p className="text-sm text-destructive">{decoded.error}</p>}
          {ok && (
            <>
              <div className="grid place-items-center rounded-lg bg-muted p-3"><img src={ok.url} alt="Decoded" className="max-h-64" /></div>
              <p className="text-sm text-muted-foreground">{ok.mime} · {formatBytes(ok.blob!.size)}</p>
            </>
          )}
        </Panel>
      }
    />
  )
}

function ImageBase64Tool() {
  return (
    <Tabs defaultValue="encode" className="gap-6">
      <TabsList className="h-10 w-full sm:w-auto"><TabsTrigger value="encode">Image → Base64</TabsTrigger><TabsTrigger value="decode">Base64 → Image</TabsTrigger></TabsList>
      <TabsContent value="encode"><Encode /></TabsContent>
      <TabsContent value="decode"><Decode /></TabsContent>
    </Tabs>
  )
}

/** Tools use files, canvas, workers and local storage, so they render only in the browser. */
const subscribeNothing = () => () => {}
export default function ImageBase64() {
  const inBrowser = useSyncExternalStore(subscribeNothing, () => true, () => false)
  if (!inBrowser) {
    return (
      <div className="grid h-64 place-items-center rounded-xl border border-dashed bg-card/50" aria-busy="true">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  return <ImageBase64Tool />
}
