"use client"
/**
 * Protect PDF — the whole tool in one file (UI, logic and helpers). Runs entirely in the browser.
 */
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { ClipboardPaste, Download, Eye, EyeOff, FileUp, Loader2, Lock, Plus, ShieldCheck, Upload, SlidersHorizontal } from "lucide-react"
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

/* ─── helpers (from lib/pdfjs.ts) ─── */
/** pdf.js is loaded on first use, in the browser only (never during server rendering). */
async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist")
  if (!pdfjs.GlobalWorkerOptions.workerSrc)
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString()
  return pdfjs
}

async function openPdf(data: ArrayBuffer) {
  // pdf.js transfers the buffer to its worker, so give it a copy
  const pdfjs = await loadPdfjs()
  return pdfjs.getDocument({ data: new Uint8Array(data.slice(0)) }).promise
}

/* ─── helpers (from lib/qpdf.ts) ─── */
// qpdf (C++ PDF toolkit) compiled to WebAssembly — used for password protect / unlock.
// Loaded lazily (~1.3 MB) only on the pages that need it.

interface Qpdf {
  callMain: (args: string[]) => number
  FS: { writeFile: (p: string, d: Uint8Array) => void; readFile: (p: string) => Uint8Array; unlink: (p: string) => void }
}

interface QpdfResult { code: number; out: Uint8Array | null; log: string }

/** Run qpdf once on `input`. `args` receives the in/out paths. Exit 0 = ok, 3 = ok with warnings, 2 = error. */
async function runQpdf(input: Uint8Array, args: (inp: string, out: string) => string[]): Promise<QpdfResult> {
  const { default: createModule } = await import("@neslinesli93/qpdf-wasm")
  const lines: string[] = []
  // a fresh instance per run: emscripten programs are not re-entrant after main() returns
  const q = (await (createModule as unknown as (o: object) => Promise<Qpdf>)({
    locateFile: () => new URL("@neslinesli93/qpdf-wasm/dist/qpdf.wasm", import.meta.url).href,
    print: (s: string) => lines.push(s),
    printErr: (s: string) => lines.push(s),
    noExitRuntime: true,
  }))
  q.FS.writeFile("/in.pdf", input)
  let code = 2
  try { code = q.callMain(args("/in.pdf", "/out.pdf")) } catch (e) {
    const status = (e as { status?: number })?.status
    code = typeof status === "number" ? status : 2
  }
  let out: Uint8Array | null = null
  if (code === 0 || code === 3) { try { out = q.FS.readFile("/out.pdf") } catch { out = null } }
  return { code, out, log: lines.join("\n") }
}

/** 0 = not encrypted, 1 = encrypted but opens without a password (owner-restricted), 2 = needs a password */
async function encryptionState(input: Uint8Array): Promise<0 | 1 | 2> {
  try {
    const doc = await openPdf(input.slice().buffer)
    void doc.loadingTask.destroy()
  } catch (e) {
    if ((e as { name?: string })?.name === "PasswordException") return 2
    throw e
  }
  const { PDFDocument } = await import("pdf-lib")
  try { await PDFDocument.load(input, { updateMetadata: false }); return 0 } catch (e) {
    return /encrypt/i.test(String(e)) ? 1 : 0
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
function strength(p: string) {
  let s = 0
  if (p.length >= 8) s++
  if (p.length >= 12) s++
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++
  if (/\d/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return Math.min(4, s)
}
const LABEL = ["Too weak", "Weak", "Fair", "Good", "Strong"]
const COLOR = ["bg-destructive", "bg-destructive", "bg-amber-500", "bg-emerald-500", "bg-emerald-600"]
const randomPw = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(36)).join("").slice(0, 32)

function ProtectPdfTool() {
  const [file, setFile] = useState<{ f: File; bytes: Uint8Array } | null>(null)
  const [pw, setPw] = useState("")
  const [pw2, setPw2] = useState("")
  const [show, setShow] = useState(false)
  const [bits, setBits] = useState<"256" | "128">("256")
  const [print, setPrint] = useState(true)
  const [copy, setCopy] = useState(true)
  const [modify, setModify] = useState(false)
  const [annotate, setAnnotate] = useState(true)
  const [owner, setOwner] = useState("")
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Blob | null>(null)
  const st = useMemo(() => strength(pw), [pw])

  const load = async (fs: File[]) => {
    const f = fs[0]
    if (!isPdf(f)) return toast.error("Please choose a PDF file")
    const bytes = new Uint8Array(await f.arrayBuffer())
    setResult(null); setFile({ f, bytes })
    try {
      if ((await encryptionState(bytes)) === 2) toast.warning("This PDF already has a password. Unlock it first to change it.")
    } catch { /* ignore */ }
  }

  const run = async () => {
    if (!file) return
    if (pw.length < 4) return toast.error("Use at least 4 characters")
    if (pw !== pw2) return toast.error("Passwords don’t match")
    setBusy(true)
    try {
      const ownerPw = owner || randomPw()
      const yn = (v: boolean) => (v ? "y" : "n")
      const perms = [
        `--print=${print ? "full" : "none"}`,
        `--modify=${modify ? "all" : annotate ? "annotate" : "none"}`,
        `--extract=${yn(copy)}`,
        `--annotate=${yn(annotate)}`,
      ]
      const r = await runQpdf(file.bytes, (i, o) => [i, "--encrypt", pw, ownerPw, bits, ...(bits === "128" ? ["--use-aes=y"] : []), ...perms, "--", o])
      if (!r.out) throw new Error(/password/i.test(r.log) ? "This PDF is already password protected — unlock it first." : "Could not protect this PDF.")
      setResult(new Blob([r.out as BlobPart], { type: "application/pdf" }))
      toast.success("PDF protected")
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }

  const name = file ? `${baseName(file.f.name)}-protected.pdf` : ""
  const dirty = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setResult(null) }

  if (!file) return <FileDrop accept="application/pdf,.pdf" multiple={false} onFiles={load} title="Drop a PDF to protect" hint="Add a password so only people who know it can open the file" />

  const downloadBtn = result && (
    <Button size="lg" className="w-full" onClick={() => saveBlob(result, name)}><Download /> Download protected PDF</Button>
  )
  const runBtn = (
    <Button size="lg" className="w-full" disabled={busy || !pw || pw !== pw2} onClick={run}>{busy ? <Loader2 className="animate-spin" /> : <Lock />} Protect PDF</Button>
  )
  return (
    <ToolGrid title="Protect PDF" mobile="inline"
      action={result ? downloadBtn : runBtn}
      main={<Panel>
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-lg bg-accent text-primary"><Lock className="size-6" /></div>
          <div className="min-w-0"><p className="truncate font-medium">{file.f.name}</p><p className="text-sm text-muted-foreground">{formatBytes(file.f.size)}</p></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password">
            <div className="relative">
              <Input type={show ? "text" : "password"} value={pw} onChange={(e) => dirty(setPw)(e.target.value)} autoComplete="new-password" className="pr-10" />
              <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-0.5 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-muted-foreground hover:text-foreground">{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
            </div>
            {pw && (
              <div className="space-y-1">
                <div className="flex gap-1">{[0, 1, 2, 3].map((i) => <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < st ? COLOR[st] : "bg-muted")} />)}</div>
                <p className="text-xs text-muted-foreground">{LABEL[st]}</p>
              </div>
            )}
          </Field>
          <Field label="Confirm password">
            <Input type={show ? "text" : "password"} value={pw2} onChange={(e) => dirty(setPw2)(e.target.value)} autoComplete="new-password" aria-invalid={!!pw2 && pw !== pw2} />
            {pw2 && pw !== pw2 && <p className="text-xs text-destructive">Passwords don’t match</p>}
          </Field>
        </div>
        <p className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" /> Keep this password safe. Nobody — including us — can recover it, because your file never leaves your device.</p>
      </Panel>}
      side={<Panel title="Security options">
        <Field label="Encryption"><Segmented value={bits} onChange={dirty(setBits)} options={[{ value: "256", label: "AES-256 (strongest)" }, { value: "128", label: "AES-128" }]} /></Field>
        <div className="space-y-2">
          <p className="text-sm font-medium">After opening, allow people to:</p>
          <SwitchRow label="Print" checked={print} onChange={dirty(setPrint)} />
          <SwitchRow label="Copy text & images" checked={copy} onChange={dirty(setCopy)} />
          <SwitchRow label="Add comments / fill forms" checked={annotate} onChange={dirty(setAnnotate)} />
          <SwitchRow label="Edit the document" checked={modify} onChange={dirty(setModify)} />
        </div>
        <Field label="Owner password" hint="optional">
          <Input type="password" value={owner} onChange={(e) => dirty(setOwner)(e.target.value)} placeholder="Auto-generated if empty" autoComplete="new-password" />
          <p className="text-xs text-muted-foreground">Lets you change the restrictions above later.</p>
        </Field>
        {result ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{name} · {formatBytes(result.size)}</p>
            <></>
          </div>
        ) : (
          <></>
        )}
        <Button variant="outline" className="w-full" onClick={() => { setFile(null); setPw(""); setPw2(""); setResult(null) }}><FileUp /> Choose another PDF</Button>
      </Panel>}
    />
  )
}

/** Tools use files, canvas, workers and local storage, so they render only in the browser. */
const subscribeNothing = () => () => {}
export default function ProtectPdf() {
  const inBrowser = useSyncExternalStore(subscribeNothing, () => true, () => false)
  if (!inBrowser) {
    return (
      <div className="grid h-64 place-items-center rounded-xl border border-dashed bg-card/50" aria-busy="true">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  return <ProtectPdfTool />
}
