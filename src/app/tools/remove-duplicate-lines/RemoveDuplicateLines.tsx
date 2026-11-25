"use client"
/**
 * Remove Duplicate Lines — the whole tool in one file (UI, logic and helpers). Runs entirely in the browser.
 */
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { ArrowUp, ClipboardPaste, Copy, Download, Eraser, Sparkles, Upload, SlidersHorizontal, Loader2 } from "lucide-react"
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
const joinLines = (l: string[]) => l.join("\n")
const isBlank = (s: string) => s.trim() === ""

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
type DedupeMode = "remove" | "onlyDuplicates" | "onlyUnique"
function dedupeLines(t: string, o: { caseSensitive: boolean; trim: boolean; keepEmpty: boolean; keep: "first" | "last"; mode: DedupeMode }) {
  const lines = splitLines(t)
  const key = (l: string) => { let k = o.trim ? l.trim() : l; if (!o.caseSensitive) k = k.toLocaleLowerCase(); return k }
  const counts = new Map<string, number>()
  for (const l of lines) if (!isBlank(l)) counts.set(key(l), (counts.get(key(l)) ?? 0) + 1)
  let out: string[] = []
  if (o.mode === "remove") {
    const seen = new Set<string>()
    const src = o.keep === "last" ? [...lines].reverse() : lines
    for (const l of src) {
      if (isBlank(l)) { if (o.keepEmpty) out.push(l); continue }
      const k = key(l)
      if (seen.has(k)) continue
      seen.add(k); out.push(o.trim ? l.trim() : l)
    }
    if (o.keep === "last") out.reverse()
  } else if (o.mode === "onlyDuplicates") {
    const seen = new Set<string>()
    for (const l of lines) { const k = key(l); if (!isBlank(l) && (counts.get(k) ?? 0) > 1 && !seen.has(k)) { seen.add(k); out.push(o.trim ? l.trim() : l) } }
  } else {
    out = lines.filter((l) => !isBlank(l) && counts.get(key(l)) === 1).map((l) => (o.trim ? l.trim() : l))
  }
  const dupGroups = [...counts.values()].filter((n) => n > 1).length
  return { text: joinLines(out), before: lines.length, after: out.length, dupGroups }
}

// ---------- sort ----------
type SortMethod = "alpha" | "natural" | "number" | "length" | "words" | "random" | "reverse"
function sortLines(t: string, o: { method: SortMethod; desc: boolean; caseSensitive: boolean; removeEmpty: boolean; trim: boolean; unique: boolean; seed: number }) {
  let lines = splitLines(t)
  if (o.trim) lines = lines.map((l) => l.trim())
  if (o.removeEmpty) lines = lines.filter((l) => !isBlank(l))
  if (o.unique) {
    const seen = new Set<string>()
    lines = lines.filter((l) => { const k = o.caseSensitive ? l : l.toLocaleLowerCase(); if (seen.has(k)) return false; seen.add(k); return true })
  }
  const coll = new Intl.Collator(["mr", "hi", "en"], { numeric: o.method === "natural", sensitivity: o.caseSensitive ? "case" : "base", caseFirst: "upper" })
  const num = (l: string) => { const m = l.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/); return m ? parseFloat(m[0]) : Number.POSITIVE_INFINITY }
  const dir = o.desc ? -1 : 1
  switch (o.method) {
    case "alpha": case "natural": lines.sort((a, b) => dir * coll.compare(a, b)); break
    case "number": lines.sort((a, b) => { const x = num(a), y = num(b); if (x === y) return coll.compare(a, b); if (!isFinite(x)) return 1; if (!isFinite(y)) return -1; return dir * (x - y) }); break
    case "length": lines.sort((a, b) => dir * (graphemeCount(a) - graphemeCount(b)) || coll.compare(a, b)); break
    case "words": lines.sort((a, b) => dir * (words(a).length - words(b).length) || coll.compare(a, b)); break
    case "reverse": lines.reverse(); break
    case "random": {
      let s = o.seed >>> 0 || 1
      const rnd = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296 }
      for (let i = lines.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [lines[i], lines[j]] = [lines[j], lines[i]] }
    }
  }
  return joinLines(lines)
}

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
function RemoveDuplicateLinesTool() {
  const [text, setText] = useTextDraft()
  const [mode, setMode] = useState<DedupeMode>("remove")
  const [keep, setKeep] = useState<"first" | "last">("first")
  const [caseSensitive, setCase] = useState(false)
  const [trim, setTrim] = useState(true)
  const [keepEmpty, setKeepEmpty] = useState(false)
  const [sort, setSort] = useState(false)
  const d = useDeferredValue(text)
  const r = useMemo(() => {
    const res = dedupeLines(d, { caseSensitive, trim, keepEmpty, keep, mode })
    return sort ? { ...res, text: sortLines(res.text, { method: "natural", desc: false, caseSensitive, removeEmpty: !keepEmpty, trim: false, unique: false, seed: 1 }) } : res
  }, [d, caseSensitive, trim, keepEmpty, keep, mode, sort])
  const removed = r.before - r.after

  return (
    <TextTransform
      text={text} setText={setText} output={r.text} filename="unique-lines.txt"
      sample={"apple\nbanana\nApple\norange\nbanana\n  apple  \nmango\norange"}
      note={d ? `${fmt(removed)} line${removed === 1 ? "" : "s"} removed · ${fmt(r.dupGroups)} duplicate group${r.dupGroups === 1 ? "" : "s"}` : undefined}
      options={<>
        <Field label="Output">
          <Segmented value={mode} onChange={setMode} options={[{ value: "remove", label: "Unique" }, { value: "onlyDuplicates", label: "Duplicates" }, { value: "onlyUnique", label: "Never repeated" }]} />
          <p className="text-xs text-muted-foreground">
            {mode === "remove" ? "Keeps one copy of every line." : mode === "onlyDuplicates" ? "Shows only lines that appear more than once." : "Shows only lines that appear exactly once."}
          </p>
        </Field>
        {mode === "remove" && (
          <Field label="When repeated, keep">
            <Segmented value={keep} onChange={setKeep} options={[{ value: "first", label: "First copy" }, { value: "last", label: "Last copy" }]} />
          </Field>
        )}
        <div>
          <CheckRow label="Case sensitive" desc="“Apple” and “apple” are different" checked={caseSensitive} onChange={setCase} />
          <CheckRow label="Ignore spaces at start/end" desc="Trims each line before comparing" checked={trim} onChange={setTrim} />
          <CheckRow label="Keep empty lines" checked={keepEmpty} onChange={setKeepEmpty} disabled={mode !== "remove"} />
          <CheckRow label="Sort result A → Z" checked={sort} onChange={setSort} />
        </div>
      </>}
    />
  )
}

/** Tools use files, canvas, workers and local storage, so they render only in the browser. */
const subscribeNothing = () => () => {}
export default function RemoveDuplicateLines() {
  const inBrowser = useSyncExternalStore(subscribeNothing, () => true, () => false)
  if (!inBrowser) {
    return (
      <div className="grid h-64 place-items-center rounded-xl border border-dashed bg-card/50" aria-busy="true">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  return <RemoveDuplicateLinesTool />
}
