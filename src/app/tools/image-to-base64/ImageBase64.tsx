"use client"
/**
 * Image to Base64 — the whole tool in one file (UI, logic and helpers). Runs entirely in the browser.
 */
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { ClipboardPaste, Copy, Download, ImageUp, Plus, ShieldCheck, Trash2, Upload, Loader2 } from "lucide-react"
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
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Panel>
        <div className="grid place-items-center rounded-lg bg-muted p-3"><img src={uri} alt={file.name} className="max-h-48" /></div>
        <div className="space-y-1 text-sm">
          <p className="truncate font-medium">{file.name}</p>
          <p className="text-muted-foreground">File: {formatBytes(file.size)} · Base64: {formatBytes(output.length)}</p>
          {file.size > 100 * 1024 && <p className="text-xs text-amber-600 dark:text-amber-400">Tip: Base64 is ~33% bigger than the file — avoid it for large images.</p>}
        </div>
        <Button variant="outline" className="w-full" onClick={() => { setFile(null); setUri("") }}><ImageUp /> Choose another</Button>
      </Panel>
      <div className="space-y-3">
        <Segmented value={style} onChange={setStyle} options={[
          { value: "uri", label: "Data URI" }, { value: "raw", label: "Base64" }, { value: "css", label: "CSS" }, { value: "html", label: "HTML" }, { value: "md", label: "Markdown" },
        ]} />
        <textarea readOnly value={output} className={`${area} h-72`} onFocus={(e) => e.currentTarget.select()} />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => copyText(output, "Base64 copied")}><Copy /> Copy</Button>
          <Button variant="outline" onClick={() => saveBlob(new Blob([output], { type: "text/plain" }), `${baseName(file.name)}-base64.txt`)}><Download /> Save as .txt</Button>
        </div>
      </div>
    </div>
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

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Field label="Paste Base64 or a data URI">
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="data:image/png;base64,iVBORw0KGgo…" className={`${area} h-72`} />
        {text && <Button variant="ghost" size="sm" onClick={() => setText("")}><Trash2 /> Clear</Button>}
      </Field>
      <Panel title="Image preview">
        {!decoded && <p className="text-sm text-muted-foreground">The image appears here.</p>}
        {decoded && "error" in decoded && <p className="text-sm text-destructive">{decoded.error}</p>}
        {decoded && "url" in decoded && decoded.url && (
          <>
            <div className="grid place-items-center rounded-lg bg-muted p-3"><img src={decoded.url} alt="Decoded" className="max-h-64" /></div>
            <p className="text-sm text-muted-foreground">{decoded.mime} · {formatBytes(decoded.blob!.size)}</p>
            <Button className="w-full" onClick={() => saveBlob(decoded.blob!, `decoded-image.${EXT[decoded.mime!] ?? "png"}`)}><Download /> Download image</Button>
          </>
        )}
      </Panel>
    </div>
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
