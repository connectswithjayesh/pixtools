"use client"
/**
 * Word Frequency Counter — the whole tool in one file (UI, logic and helpers). Runs entirely in the browser.
 */
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { ClipboardPaste, Copy, Download, Eraser, FileText, Sparkles, Upload, SlidersHorizontal, Loader2 } from "lucide-react"
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

function SliderField({ label, value, onChange, min, max, step = 1, suffix = "" }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; suffix?: string
}) {
  return (
    <Field label={label} hint={`${value}${suffix}`}>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : (v as number))} />
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

function sentences(t: string): string[] {
  return t.split(/(?<=[.!?।॥])\s+|\n\s*\n/).map((s) => s.trim()).filter((s) => /[\p{L}\p{N}]/u.test(s))
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
// ---------- emoji ----------
// ---------- cleaner ----------
// ---------- word frequency ----------
const STOP_EN = new Set(("a about above after again against all am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourself yourselves " +
  "also may might must shall us via etc").split(" "))
const STOP_DEVA = new Set(("आणि व हे ही हा ते ती तो या त्या की पण आहे आहेत होते होता होती नाही तर मी तू तुम्ही आम्ही आपण त्याचा त्याची त्याचे तिचा तिची माझा माझी माझे तुझा ने ला ना चा ची चे साठी मध्ये वर खाली पर्यंत सुद्धा देखील म्हणून असे अशी असा जे जी जो काय कसे कोण केले करून " +
  "और का की के है हैं था थी थे में से को पर भी यह वह ये वो एक तो ही नहीं लिए कि जो कर कुछ").split(" "))
interface FreqOpts { ngram: 1 | 2 | 3; ignoreCase: boolean; stopWords: boolean; minLength: number; numbers: boolean }
function wordFrequency(t: string, o: FreqOpts) {
  let w = words(t)
  if (o.ignoreCase) w = w.map((x) => x.toLocaleLowerCase())
  const total = w.length
  const ok = (x: string) => {
    const lx = x.toLocaleLowerCase()
    if (o.stopWords && (STOP_EN.has(lx) || STOP_DEVA.has(lx))) return false
    if (!o.numbers && /^[\p{N}.,:]+$/u.test(x)) return false
    return graphemeCount(x) >= o.minLength
  }
  const counts = new Map<string, number>()
  let grams = 0
  if (o.ngram === 1) {
    for (const x of w) if (ok(x)) { counts.set(x, (counts.get(x) ?? 0) + 1); grams++ }
  } else {
    // n-grams inside each sentence only, and must not start or end with a stop word
    for (const s of sentences(t)) {
      let sw = words(s)
      if (o.ignoreCase) sw = sw.map((x) => x.toLocaleLowerCase())
      for (let i = 0; i + o.ngram <= sw.length; i++) {
        const g = sw.slice(i, i + o.ngram)
        if (!ok(g[0]) || !ok(g[g.length - 1])) continue
        if (!o.numbers && g.some((x) => /^[\p{N}.,:]+$/u.test(x))) continue
        const k = g.join(" ")
        counts.set(k, (counts.get(k) ?? 0) + 1); grams++
      }
    }
  }
  const rows = [...counts.entries()].map(([term, count]) => ({ term, count, density: total ? (count * o.ngram * 100) / total : 0 }))
  rows.sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
  return { rows, totalWords: total, counted: grams }
}

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

function StatCard({ label, value, sub, className }: { label: string; value: React.ReactNode; sub?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card p-4 shadow-xs", className)}>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground"><FileText className="size-4" />{children}</p>
}

/* ═══════════════ Tool ═══════════════ */
const SAMPLE = `Cab booking in Nashik is easy. Book a Nashik cab online for Shirdi, Trimbakeshwar or Mumbai. Our Nashik to Mumbai cab service runs every day, and every cab booking includes a trained driver. Online cab booking saves time.`

function WordFrequencyTool() {
  const [text, setText] = useTextDraft()
  const [ngram, setNgram] = useState<"1" | "2" | "3">("1")
  const [ignoreCase, setIgnoreCase] = useState(true)
  const [stopWords, setStopWords] = useState(true)
  const [numbers, setNumbers] = useState(false)
  const [minLength, setMinLength] = useState(2)
  const [filter, setFilter] = useState("")
  const [limit, setLimit] = useState(50)
  const d = useDeferredValue(text)
  const r = useMemo(() => wordFrequency(d, { ngram: Number(ngram) as 1 | 2 | 3, ignoreCase, stopWords, minLength, numbers }), [d, ngram, ignoreCase, stopWords, minLength, numbers])
  const rows = useMemo(() => { const f = filter.trim().toLocaleLowerCase(); return f ? r.rows.filter((x) => x.term.toLocaleLowerCase().includes(f)) : r.rows }, [r.rows, filter])
  const max = r.rows[0]?.count ?? 1

  const csv = () => "Rank,Keyword,Count,Density %\n" + r.rows.map((x, i) => `${i + 1},"${x.term.replace(/"/g, '""')}",${x.count},${x.density.toFixed(2)}`).join("\n")
  const tsv = () => r.rows.map((x) => `${x.term}\t${x.count}\t${x.density.toFixed(2)}%`).join("\n")

  return (
    <ToolGrid settingsLabel="Options"
      main={<>
        <TextInput value={text} onChange={setText} rows={9} sample={SAMPLE} placeholder="Paste an article or web page text to see keyword density…" />
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total words" value={fmt(r.totalWords)} />
          <StatCard label={`Unique ${ngram === "1" ? "words" : "phrases"}`} value={fmt(r.rows.length)} />
          <StatCard label="Top keyword" value={<span className="block truncate text-lg">{r.rows[0]?.term ?? "—"}</span>} sub={r.rows[0] ? `${r.rows[0].count}× · ${r.rows[0].density.toFixed(1)}%` : undefined} />
        </div>
        <div className="rounded-xl border bg-card shadow-xs">
          <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
            <span className="mr-auto text-sm font-semibold">Keyword density</span>
            <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter…" className="h-8 w-36" />
            <Button size="sm" onClick={() => copyText(tsv(), "Table copied — paste into Excel or Sheets")} disabled={!r.rows.length}><Copy /> Copy</Button>
            <Button size="sm" variant="outline" onClick={() => saveBlob(new Blob(["﻿" + csv()], { type: "text/csv;charset=utf-8" }), "keyword-density.csv")} disabled={!r.rows.length}><Download /> CSV</Button>
          </div>
          {rows.length ? (
            <div className="max-h-[520px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card text-xs text-muted-foreground">
                  <tr className="border-b"><th className="w-12 px-3 py-2 text-left font-medium">#</th><th className="px-3 py-2 text-left font-medium">{ngram === "1" ? "Word" : "Phrase"}</th><th className="w-20 px-3 py-2 text-right font-medium">Count</th><th className="w-36 px-3 py-2 text-right font-medium">Density</th></tr>
                </thead>
                <tbody>
                  {rows.slice(0, limit).map((x) => (
                    <tr key={x.term} className="border-b last:border-0 hover:bg-accent/40">
                      <td className="px-3 py-1.5 text-muted-foreground tabular-nums">{r.rows.indexOf(x) + 1}</td>
                      <td className="px-3 py-1.5 font-medium break-all">{x.term}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{x.count}</td>
                      <td className="px-3 py-1.5">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${(x.count / max) * 100}%` }} /></div>
                          <span className="w-12 text-right tabular-nums">{x.density.toFixed(2)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > limit && <div className="p-3 text-center"><Button variant="ghost" size="sm" onClick={() => setLimit((l) => l + 100)}>Show more ({fmt(rows.length - limit)} left)</Button></div>}
            </div>
          ) : <EmptyHint>{d ? "No keywords match these settings." : "Keyword counts appear here as you type."}</EmptyHint>}
        </div>
      </>}
      side={<Panel title="Options">
        <Field label="Count">
          <Segmented value={ngram} onChange={setNgram} options={[{ value: "1", label: "Words" }, { value: "2", label: "2-word phrases" }, { value: "3", label: "3-word" }]} />
        </Field>
        <SliderField label="Minimum word length" value={minLength} onChange={setMinLength} min={1} max={10} suffix=" chars" />
        <div>
          <CheckRow label="Skip common words" desc="the, and, is… आणि, आहे, है…" checked={stopWords} onChange={setStopWords} />
          <CheckRow label="Ignore case" desc="“Cab” and “cab” count together" checked={ignoreCase} onChange={setIgnoreCase} />
          <CheckRow label="Include numbers" checked={numbers} onChange={setNumbers} />
        </div>
        <p className="text-xs text-muted-foreground">Density = how much of the text this keyword takes up. For SEO, keep your main keyword around 1–2% and write naturally.</p>
      </Panel>}
    />
  )
}

/** Tools use files, canvas, workers and local storage, so they render only in the browser. */
const subscribeNothing = () => () => {}
export default function WordFrequency() {
  const inBrowser = useSyncExternalStore(subscribeNothing, () => true, () => false)
  if (!inBrowser) {
    return (
      <div className="grid h-64 place-items-center rounded-xl border border-dashed bg-card/50" aria-busy="true">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  return <WordFrequencyTool />
}
