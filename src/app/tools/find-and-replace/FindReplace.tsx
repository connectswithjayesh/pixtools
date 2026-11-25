"use client"
/**
 * Find & Replace — the whole tool in one file (UI, logic and helpers). Runs entirely in the browser.
 */
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { ArrowLeftRight, ArrowUp, ClipboardPaste, Copy, Download, Eraser, Sparkles, Upload, SlidersHorizontal, Loader2 } from "lucide-react"
import { usePathname } from "next/navigation"
import { useDeferredValue, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { toast } from "sonner"

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
// ---------- duplicates ----------
// ---------- sort ----------
// ---------- spaces ----------
// ---------- line breaks ----------
// ---------- lorem ipsum ----------
// ---------- repeat ----------
// ---------- reverse ----------
// ---------- find & replace ----------
interface FindOpts { find: string; replace: string; caseSensitive: boolean; wholeWord: boolean; regex: boolean; escapes: boolean; firstOnly: boolean }
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")
const unescape = (s: string) => s.replace(/\\(n|t|r|\\)/g, (_, c: string) => ({ n: "\n", t: "\t", r: "\r", "\\": "\\" })[c]!)
function buildFindRegex(o: FindOpts, global = true): RegExp | null {
  if (!o.find) return null
  let src = o.regex ? o.find : escapeRe(o.escapes ? unescape(o.find) : o.find)
  if (o.wholeWord) src = `(?<![\\p{L}\\p{M}\\p{N}_])(?:${src})(?![\\p{L}\\p{M}\\p{N}_])`
  return new RegExp(src, (global ? "g" : "") + (o.caseSensitive ? "" : "i") + "mu")
}
function findReplace(t: string, o: FindOpts): { text: string; count: number; error?: string } {
  let re: RegExp | null
  try { re = buildFindRegex(o) } catch (e) { return { text: t, count: 0, error: (e as Error).message.split(": ").pop() } }
  if (!re) return { text: t, count: 0 }
  let count = 0
  for (const _ of t.matchAll(re)) if (++count >= 1_000_000) break
  let rep = o.escapes ? unescape(o.replace) : o.replace
  if (!o.regex) rep = rep.replace(/\$/g, "$$$$")
  const literal = rep
  if (o.firstOnly) { const r1 = new RegExp(re.source, re.flags.replace("g", "")); return { text: t.replace(r1, literal), count: Math.min(count, 1) } }
  return { text: t.replace(re, literal), count }
}
/** Split text into plain/match segments for highlighting. */
function matchSegments(t: string, o: FindOpts, limit = 3000): { s: string; m: boolean }[] {
  let re: RegExp | null
  try { re = buildFindRegex(o) } catch { return [{ s: t, m: false }] }
  if (!re) return [{ s: t, m: false }]
  const out: { s: string; m: boolean }[] = []
  let last = 0, n = 0
  for (const m of t.matchAll(re)) {
    if (m[0] === "") continue
    if (n++ >= limit) break
    out.push({ s: t.slice(last, m.index), m: false }, { s: m[0], m: true })
    last = m.index! + m[0].length
  }
  out.push({ s: t.slice(last), m: false })
  return out
}

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
function FindReplaceTool() {
  const [text, setText] = useTextDraft()
  const [o, setO] = useState<FindOpts>({ find: "", replace: "", caseSensitive: false, wholeWord: false, regex: false, escapes: false, firstOnly: false })
  const set = <K extends keyof FindOpts>(k: K) => (v: FindOpts[K]) => setO((p) => ({ ...p, [k]: v }))
  const d = useDeferredValue(text)
  const dO = useDeferredValue(o)
  const r = useMemo(() => findReplace(d, dO), [d, dO])
  const segs = useMemo(() => (dO.find && !r.error ? matchSegments(d.slice(0, 200_000), dO) : null), [d, dO, r.error])

  return (
    <ToolGrid mobile="inline" action={<Button onClick={() => copyText(r.text)} disabled={!r.text}><Copy /> Copy result</Button>}
      main={<>
        <TextInput value={text} onChange={setText} rows={10} sample={"Our office is in Pune. Pune is a great city.\nContact: 9876543210 or 9123456780\nDate: 2025-03-14"} />
        {segs && r.count > 0 && (
          <Panel title={`Matches (${fmt(r.count)})`}>
            <div className="max-h-56 overflow-auto rounded-md bg-muted/40 p-3 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words">
              {segs.map((s, i) => (s.m ? <mark key={i} className="rounded-sm bg-amber-300/70 px-0.5 text-foreground dark:bg-amber-500/50">{s.s}</mark> : <span key={i}>{s.s}</span>))}
            </div>
          </Panel>
        )}
        <TextOutput value={r.text} filename="replaced-text.txt" onUse={() => setText(r.text)}
          note={o.find ? (r.error ? <span className="text-destructive">Invalid pattern</span> : `${fmt(r.count)} match${r.count === 1 ? "" : "es"}${r.count && o.firstOnly ? " · replaced first" : r.count ? " replaced" : ""}`) : "Type something to find"} />
      </>}
      side={<Panel title="Find & replace">
        <Field label="Find">
          <Input value={o.find} onChange={(e) => set("find")(e.target.value)} placeholder={o.regex ? "Regular expression, e.g. \\d{10}" : "Word or phrase"} className="font-mono" />
          {r.error && <p className="text-xs text-destructive">{r.error}</p>}
        </Field>
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={() => setO((p) => ({ ...p, find: p.replace, replace: p.find }))} disabled={!o.find && !o.replace}><ArrowLeftRight /> Swap</Button>
        </div>
        <Field label="Replace with">
          <Input value={o.replace} onChange={(e) => set("replace")(e.target.value)} placeholder="Leave empty to delete matches" className="font-mono" />
        </Field>
        <div>
          <CheckRow label="Match case" checked={o.caseSensitive} onChange={set("caseSensitive")} />
          <CheckRow label="Whole words only" desc="“cat” won't match “category”" checked={o.wholeWord} onChange={set("wholeWord")} />
          <CheckRow label="Replace first match only" checked={o.firstOnly} onChange={set("firstOnly")} />
          <CheckRow label="Use regular expression" desc="Use $1, $2 in Replace for groups" checked={o.regex} onChange={set("regex")} />
          <CheckRow label="Understand \n and \t" desc="Type \n for a new line, \t for a tab" checked={o.escapes} onChange={set("escapes")} />
        </div>
        {o.regex && (
          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">Quick patterns</p>
            {[["\\d{10}", "10-digit mobile number"], ["[\\w.+-]+@[\\w-]+\\.[\\w.]+", "Email address"], ["^\\s+", "Spaces at line start"], ["(\\d{4})-(\\d{2})-(\\d{2})", "Date 2025-03-14 → use $3/$2/$1"]].map(([p, l]) => (
              <button key={p} type="button" onClick={() => set("find")(p)} className="block w-full cursor-pointer truncate py-0.5 text-left hover:text-foreground"><code className="text-primary">{p}</code> {l}</button>
            ))}
          </div>
        )}
      </Panel>}
    />
  )
}

/** Tools use files, canvas, workers and local storage, so they render only in the browser. */
const subscribeNothing = () => () => {}
export default function FindReplace() {
  const inBrowser = useSyncExternalStore(subscribeNothing, () => true, () => false)
  if (!inBrowser) {
    return (
      <div className="grid h-64 place-items-center rounded-xl border border-dashed bg-card/50" aria-busy="true">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  return <FindReplaceTool />
}
