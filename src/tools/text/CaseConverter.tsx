"use client"
/**
 * Case Converter — the whole tool in one file (UI, logic and helpers). Runs entirely in the browser.
 */
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowUp, ClipboardPaste, Copy, Download, Eraser, Sparkles, Upload, SlidersHorizontal } from "lucide-react"
import { usePathname } from "next/navigation"
import { useDeferredValue, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { toast } from "sonner"

/* ─── helpers (from components/common/form.tsx) ─── */

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

/* ─── helpers (from tools/text/lib/text.ts) ─── */
/**
 * Pure text functions used by every Text tool. No DOM access (except decodeEntities),
 * so they can be unit-tested in Node. Unicode-aware: Marathi/Hindi (Devanagari) letters
 * with matras (combining marks) count as part of a word.
 */

// ---------- basics ----------
const splitLines = (t: string) => (t === "" ? [] : t.split(/\r\n|\r|\n/))
/** Words: letters/marks/numbers, allowing inner apostrophes & hyphens, and decimals like 3.14 */
const WORD_RE = /\p{N}+(?:[.,:]\p{N}+)+|[\p{L}\p{M}\p{N}]+(?:['’\-_][\p{L}\p{M}\p{N}]+)*/gu
const words = (t: string): string[] => t.match(WORD_RE) ?? []

let gSeg: Intl.Segmenter | null | undefined
function graphemeSegmenter() {
  if (gSeg === undefined) {
    try { gSeg = new Intl.Segmenter(undefined, { granularity: "grapheme" }) } catch { gSeg = null }
  }
  return gSeg
}
/** User-perceived characters (क्ष = 1, 👍🏽 = 1). */
function graphemes(t: string): string[] {
  const s = graphemeSegmenter()
  return s ? Array.from(s.segment(t), (x) => x.segment) : Array.from(t)
}
const graphemeCount = (t: string) => {
  if (!/[^\x00-\x7f]/.test(t)) return t.length // fast path for ASCII
  const s = graphemeSegmenter()
  if (!s) return Array.from(t).length
  let n = 0
  for (const _ of s.segment(t)) n++
  return n
}
// ---------- SMS ----------
// ---------- case ----------
type CaseMode =
  | "upper" | "lower" | "title" | "sentence" | "capitalized" | "alternating" | "inverse"
  | "camel" | "pascal" | "snake" | "kebab" | "constant" | "dot" | "path"

const SMALL = new Set("a an and as at but by for from in into nor of on or over per the to up via vs with".split(" "))
const upFirst = (w: string) => { const g = graphemes(w); return g.length ? g[0].toLocaleUpperCase() + g.slice(1).join("") : w }

function codeWords(line: string) {
  return (line
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, "$1 $2")
    .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, "$1 $2")
    .match(/[\p{L}\p{M}\p{N}]+/gu) ?? [])
}

function convertCase(t: string, mode: CaseMode, opts: { smallWords?: boolean } = {}): string {
  switch (mode) {
    case "upper": return t.toLocaleUpperCase()
    case "lower": return t.toLocaleLowerCase()
    case "inverse": return Array.from(t, (c) => (c === c.toLocaleUpperCase() ? c.toLocaleLowerCase() : c.toLocaleUpperCase())).join("")
    case "alternating": {
      let i = 0
      return Array.from(t, (c) => (/\p{L}/u.test(c) ? (i++ % 2 ? c.toLocaleUpperCase() : c.toLocaleLowerCase()) : c)).join("")
    }
    case "capitalized":
      return t.toLocaleLowerCase().replace(/[\p{L}\p{M}\p{N}]+(?:['’][\p{L}\p{M}]+)*/gu, upFirst)
    case "title":
      return splitLines(t).map((line) => {
        const lower = line.toLocaleLowerCase()
        const re = /[\p{L}\p{M}\p{N}]+(?:['’][\p{L}\p{M}]+)*/gu
        const all = [...lower.matchAll(re)]
        return lower.replace(re, (w, offset: number) => {
          const idx = all.findIndex((m) => m.index === offset)
          const first = idx === 0 || /[:.!?—–-]\s*$/.test(lower.slice(0, offset))
          const last = idx === all.length - 1
          return opts.smallWords !== false && SMALL.has(w) && !first && !last ? w : upFirst(w)
        })
      }).join("\n")
    case "sentence": {
      const s = t.toLocaleLowerCase().replace(/(^|[.!?।]\s+|\n\s*)(\p{L})/gu, (_, p: string, l: string) => p + l.toLocaleUpperCase())
      return s.replace(/(^|[^\p{L}])i(?=[^\p{L}]|$)/gu, "$1I").replace(/(^|[^\p{L}])i(['’])/gu, "$1I$2")
    }
    default: {
      return splitLines(t).map((line) => {
        const w = codeWords(line)
        if (!w.length) return line
        const lw = w.map((x) => x.toLocaleLowerCase())
        switch (mode) {
          case "camel": return lw[0] + lw.slice(1).map(upFirst).join("")
          case "pascal": return lw.map(upFirst).join("")
          case "snake": return lw.join("_")
          case "kebab": return lw.join("-")
          case "constant": return lw.join("_").toLocaleUpperCase()
          case "dot": return lw.join(".")
          case "path": return lw.join("/")
        }
        return line
      }).join("\n")
    }
  }
}

// ---------- duplicates ----------
// ---------- sort ----------
// ---------- spaces ----------
// ---------- line breaks ----------
// ---------- lorem ipsum ----------
// ---------- repeat ----------
// ---------- reverse ----------
// ---------- find & replace ----------
// ---------- emoji ----------
// ---------- cleaner ----------
// ---------- word frequency ----------
// ---------- line numbers ----------
/* ─── helpers (from tools/text/components.tsx) ─── */
const fmt = (n: number) => n.toLocaleString("en-IN")
const MAX_FILE = 20 * 1024 * 1024

/** Text state that survives a reload (per tool). localStorage can be missing or full, so every access is guarded. */
function useTextDraft(initial = "") {
  const slug = usePathname()?.replace(/^\//, "") || "text"
  const key = `pixtools:text:${slug}`
  const [text, setText] = useState(() => {
    try { return localStorage.getItem(key) ?? initial } catch { return initial }
  })
  const latest = useRef({ key, text, dirty: false })
  const flush = useRef(() => {
    const { key: k, text: t, dirty } = latest.current
    if (!dirty) return
    latest.current.dirty = false
    try {
      if (t && t.length < 2_000_000) localStorage.setItem(k, t)
      else localStorage.removeItem(k)
    } catch { /* storage unavailable */ }
  })
  useEffect(() => {
    const changed = latest.current.text !== text || latest.current.key !== key
    latest.current = { key, text, dirty: latest.current.dirty || changed }
    const id = setTimeout(flush.current, 400)
    return () => clearTimeout(id)
  }, [key, text])
  useEffect(() => {
    const f = flush.current
    window.addEventListener("pagehide", f)
    return () => { window.removeEventListener("pagehide", f); f() }
  }, [])
  return [text, setText] as const
}

function countLine(t: string) {
  return `${fmt(graphemeCount(t))} characters · ${fmt(words(t).length)} words · ${fmt(splitLines(t).length)} lines`
}

async function readTextFile(f: File) {
  if (f.size > MAX_FILE) { toast.error("File is larger than 20 MB"); return null }
  const buf = await f.arrayBuffer()
  if (new Uint8Array(buf.slice(0, 8000)).includes(0)) { toast.error(`${f.name} doesn't look like a text file`); return null }
  return new TextDecoder("utf-8").decode(buf)
}

function TextInput({ value, onChange, sample, placeholder = "Type or paste your text here…", rows = 10, label = "Input", onSelect, footer }: {
  value: string; onChange: (v: string) => void; sample?: string; placeholder?: string; rows?: number; label?: string
  onSelect?: (selected: string) => void; footer?: React.ReactNode
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const deferred = useDeferredValue(value)

  const load = async (files: FileList | null) => {
    const f = files?.[0]
    if (!f) return
    const t = await readTextFile(f)
    if (t != null) { onChange(t); toast.success(`Loaded ${f.name}`) }
  }
  const paste = async () => {
    try {
      const t = await navigator.clipboard.readText()
      if (!t) return toast.info("Clipboard is empty")
      onChange(value ? value + (value.endsWith("\n") ? "" : "\n") + t : t)
    } catch { toast.error("Browser blocked clipboard access — press Ctrl+V in the box") }
  }

  return (
    <div className="rounded-xl border bg-card shadow-xs">
      <div className="flex flex-wrap items-center gap-1 border-b px-3 py-2">
        <span className="mr-auto text-sm font-semibold">{label}</span>
        <Button size="sm" variant="ghost" onClick={paste}><ClipboardPaste /> Paste</Button>
        <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()}><Upload /> Upload</Button>
        {sample && <Button size="sm" variant="ghost" onClick={() => onChange(sample)}><Sparkles /> Sample</Button>}
        <Button size="sm" variant="ghost" onClick={() => onChange("")} disabled={!value}><Eraser /> Clear</Button>
        <input ref={fileRef} type="file" hidden accept="text/*,.txt,.md,.csv,.tsv,.json,.html,.htm,.xml,.srt,.vtt,.log,.yml,.yaml" onChange={(e) => { load(e.target.files); e.target.value = "" }} />
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={onSelect ? (e) => { const el = e.currentTarget; onSelect(el.value.slice(el.selectionStart, el.selectionEnd)) } : undefined}
        onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setDrag(true) } }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { if (e.dataTransfer.files.length) { e.preventDefault(); setDrag(false); load(e.dataTransfer.files) } }}
        placeholder={placeholder}
        rows={rows}
        spellCheck={false}
        aria-label={label}
        className={cn("block w-full resize-y bg-transparent px-4 py-3 font-mono text-sm leading-relaxed outline-none placeholder:text-muted-foreground", drag && "bg-primary/5 ring-2 ring-primary ring-inset")}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2 text-xs text-muted-foreground">
        <span className="tabular-nums">{countLine(deferred)}</span>
        {footer ?? <span className="hidden sm:inline">Drop a .txt file here · saved in this browser only</span>}
      </div>
    </div>
  )
}

function TextOutput({ value, filename, onUse, note, label = "Result", rows = 10, children }: {
  value: string; filename: string; onUse?: () => void; note?: React.ReactNode; label?: string; rows?: number; children?: React.ReactNode
}) {
  const download = () => saveBlob(new Blob([value], { type: "text/plain;charset=utf-8" }), filename)
  return (
    <div className="rounded-xl border bg-card shadow-xs">
      <div className="flex flex-wrap items-center gap-1 border-b px-3 py-2">
        <span className="mr-auto text-sm font-semibold">{label}</span>
        <Button size="sm" onClick={() => copyText(value)} disabled={!value}><Copy /> Copy</Button>
        <Button size="sm" variant="outline" onClick={download} disabled={!value}><Download /> .txt</Button>
        {onUse && <Button size="sm" variant="ghost" onClick={() => { onUse(); toast.success("Result moved to input") }} disabled={!value} title="Use result as new input"><ArrowUp /> Use as input</Button>}
      </div>
      {children ?? (
        <textarea
          readOnly value={value} rows={rows} spellCheck={false} aria-label={label}
          placeholder="Your result will appear here as you type."
          className="block w-full resize-y bg-muted/30 px-4 py-3 font-mono text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
        />
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2 text-xs text-muted-foreground">
        <span className="tabular-nums">{countLine(value)}</span>
        {note && <span className="font-medium text-foreground">{note}</span>}
      </div>
    </div>
  )
}

/** Input → live result, with options in the sidebar. */
function TextTransform({ text, setText, output, filename, note, options, sample, extra, inputLabel, outputLabel }: {
  text: string; setText: (v: string) => void; output: string; filename: string; note?: React.ReactNode
  options: React.ReactNode; sample?: string; extra?: React.ReactNode; inputLabel?: string; outputLabel?: string
}) {
  return (
    <ToolGrid settingsLabel="Options" action={<Button onClick={() => copyText(output)} disabled={!output}><Copy /> Copy result</Button>}
      main={<>
        <TextInput value={text} onChange={setText} sample={sample} label={inputLabel} />
        {extra}
        <TextOutput value={output} filename={filename} note={note} onUse={() => setText(output)} label={outputLabel} />
      </>}
      side={<Panel title="Options">{options}</Panel>}
    />
  )
}

function CheckRow({ label, desc, checked, onChange, disabled }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3 rounded-md px-1 py-1.5 hover:bg-accent/50", disabled && "cursor-not-allowed opacity-50")}>
      <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="block text-sm leading-tight">{label}</span>
        {desc && <span className="mt-0.5 block text-xs text-muted-foreground">{desc}</span>}
      </span>
    </label>
  )
}

/* ═══════════════ Tool ═══════════════ */
const MODES: { value: CaseMode; label: string; example: string }[] = [
  { value: "sentence", label: "Sentence case", example: "Hello world. How are you" },
  { value: "lower", label: "lower case", example: "hello world" },
  { value: "upper", label: "UPPER CASE", example: "HELLO WORLD" },
  { value: "title", label: "Title Case", example: "The Lord of the Rings" },
  { value: "capitalized", label: "Capitalize Each Word", example: "The Lord Of The Rings" },
  { value: "alternating", label: "aLtErNaTiNg", example: "hElLo WoRlD" },
  { value: "inverse", label: "InVeRsE", example: "hELLO wORLD" },
  { value: "camel", label: "camelCase", example: "helloWorld" },
  { value: "pascal", label: "PascalCase", example: "HelloWorld" },
  { value: "snake", label: "snake_case", example: "hello_world" },
  { value: "kebab", label: "kebab-case", example: "hello-world" },
  { value: "constant", label: "CONSTANT_CASE", example: "HELLO_WORLD" },
  { value: "dot", label: "dot.case", example: "hello.world" },
  { value: "path", label: "path/case", example: "hello/world" },
]

export default function CaseConverter() {
  const [text, setText] = useTextDraft()
  const [mode, setMode] = useState<CaseMode>("sentence")
  const [small, setSmall] = useState(true)
  const d = useDeferredValue(text)
  const out = useMemo(() => convertCase(d, mode, { smallWords: small }), [d, mode, small])
  const label = MODES.find((m) => m.value === mode)!.label

  return (
    <TextTransform
      text={text} setText={setText} output={out} filename={`${mode}-case.txt`} outputLabel={`Result · ${label}`}
      sample={"THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG. this is a sample sentence.\nuser first name\ngetUserProfileData"}
      options={<>
        <div className="grid grid-cols-2 gap-1.5">
          {MODES.map((m) => (
            <button
              key={m.value} type="button" onClick={() => setMode(m.value)} title={m.example}
              className={cn("cursor-pointer rounded-lg border px-2.5 py-2 text-left text-sm transition-colors",
                mode === m.value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent")}
            >
              <span className="block truncate font-medium">{m.label}</span>
              <span className={cn("block truncate font-mono text-[11px]", mode === m.value ? "text-primary-foreground/80" : "text-muted-foreground")}>{m.example}</span>
            </button>
          ))}
        </div>
        {mode === "title" && <CheckRow label="Keep small words lowercase" desc="a, an, the, of, in, and… (except first and last word)" checked={small} onChange={setSmall} />}
        <p className="text-xs text-muted-foreground">Code cases (camel, snake…) convert each line separately. Marathi and Hindi have no upper/lower case, so that text stays the same.</p>
      </>}
    />
  )
}
