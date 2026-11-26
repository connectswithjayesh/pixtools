"use client"
/**
 * Character Counter — the whole tool in one file (UI, logic and helpers). Runs entirely in the browser.
 */
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { ClipboardPaste, Eraser, Scissors, Sparkles, Upload, SlidersHorizontal, Loader2, Copy, Trash2 } from "lucide-react"
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

/* ─── helpers (from tools/text/lib/text.ts) ─── */
/**
 * Pure text functions used by every Text tool. No DOM access (except decodeEntities),
 * so they can be unit-tested in Node. Unicode-aware: Marathi/Hindi (Devanagari) letters
 * with matras (combining marks) count as part of a word.
 */

// ---------- basics ----------
const splitLines = (t: string) => (t === "" ? [] : t.split(/\r\n|\r|\n/))
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

function sentences(t: string): string[] {
  return t.split(/(?<=[.!?।॥])\s+|\n\s*\n/).map((s) => s.trim()).filter((s) => /[\p{L}\p{N}]/u.test(s))
}
const paragraphs = (t: string) => t.split(/\n\s*\n/).filter((p) => !isBlank(p))

interface TextStats {
  characters: number; charactersNoSpaces: number; words: number; uniqueWords: number
  sentences: number; paragraphs: number; lines: number; nonEmptyLines: number
  bytes: number; avgWordLength: number; avgSentenceWords: number; longestWord: string
  devanagariWords: number; readingMinutes: number; speakingMinutes: number
}

function textStats(t: string, readWpm = 200, speakWpm = 130): TextStats {
  const w = words(t)
  const lines = splitLines(t)
  const sent = sentences(t).length
  let longest = ""
  let totalLen = 0
  let deva = 0
  const uniq = new Set<string>()
  for (const x of w) {
    const len = graphemeCount(x)
    totalLen += len
    if (len > graphemeCount(longest)) longest = x
    if (/[ऀ-ॿ]/.test(x)) deva++
    uniq.add(x.toLocaleLowerCase())
  }
  return {
    characters: graphemeCount(t),
    charactersNoSpaces: graphemeCount(t.replace(/\s+/g, "")),
    words: w.length,
    uniqueWords: uniq.size,
    sentences: sent,
    paragraphs: paragraphs(t).length,
    lines: lines.length,
    nonEmptyLines: lines.filter((l) => !isBlank(l)).length,
    bytes: new TextEncoder().encode(t).length,
    avgWordLength: w.length ? totalLen / w.length : 0,
    avgSentenceWords: sent ? w.length / sent : 0,
    longestWord: longest,
    devanagariWords: deva,
    readingMinutes: w.length / readWpm,
    speakingMinutes: w.length / speakWpm,
  }
}

// ---------- SMS ----------
const GSM_BASIC = "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà"
const GSM_EXT = "^{}\\[~]|€\f"
function smsInfo(t: string) {
  let gsm = true, units = 0
  for (const ch of t) {
    if (GSM_BASIC.includes(ch)) units += 1
    else if (GSM_EXT.includes(ch)) units += 2
    else { gsm = false; break }
  }
  if (!gsm) units = t.length // UTF-16 code units
  const single = gsm ? 160 : 70, multi = gsm ? 153 : 67
  const parts = units === 0 ? 0 : units <= single ? 1 : Math.ceil(units / multi)
  const capacity = parts <= 1 ? single : parts * multi
  return { encoding: gsm ? "GSM-7" : "Unicode", units, parts, remaining: Math.max(0, capacity - units), perPart: parts <= 1 ? single : multi }
}

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
// ---------- line numbers ----------
/* ─── helpers (from tools/text/components.tsx) ─── */
const fmt = (n: number) => n.toLocaleString("en-IN")
const MAX_FILE = 20 * 1024 * 1024

/** Text state that survives a reload (per tool). localStorage can be missing or full, so every access is guarded. */
function useTextDraft(initial = "") {
  const slug = usePathname()?.replace(/^\//, "") || "text"
  const key = `techsutrahub:text:${slug}`
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

function StatCard({ label, value, sub, className }: { label: string; value: React.ReactNode; sub?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card p-4 shadow-xs", className)}>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function StatRows({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="divide-y text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-3 py-2">
          <dt className="text-muted-foreground">{k}</dt><dd className="max-w-[60%] truncate text-right font-medium tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

/* ═══════════════ Tool ═══════════════ */
const LIMITS: { name: string; limit: number }[] = [
  { name: "X (Twitter) post", limit: 280 },
  { name: "Meta title (SEO)", limit: 60 },
  { name: "Meta description (SEO)", limit: 160 },
  { name: "Instagram caption", limit: 2200 },
  { name: "Instagram bio", limit: 150 },
  { name: "YouTube title", limit: 100 },
  { name: "YouTube description", limit: 5000 },
  { name: "LinkedIn post", limit: 3000 },
  { name: "LinkedIn headline", limit: 220 },
  { name: "Facebook post (best)", limit: 80 },
  { name: "Google Ads headline", limit: 30 },
  { name: "Google Ads description", limit: 90 },
  { name: "WhatsApp status", limit: 139 },
]

function Meter({ name, used, limit, onTrim }: { name: string; used: number; limit: number; onTrim: () => void }) {
  const pct = Math.min(100, (used / limit) * 100)
  const over = used > limit
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="truncate">{name}</span>
        <span className={cn("shrink-0 text-xs tabular-nums", over ? "font-semibold text-destructive" : "text-muted-foreground")}>
          {fmt(used)} / {fmt(limit)}{over && ` (+${fmt(used - limit)})`}
          {over && <button type="button" onClick={onTrim} className="ml-1.5 cursor-pointer text-primary hover:underline">copy trimmed</button>}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", over ? "bg-destructive" : pct > 90 ? "bg-amber-500" : "bg-primary")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function CharacterCounterTool() {
  const [text, setText] = useTextDraft()
  const [mode, setMode] = useState<"with" | "without">("with")
  const [custom, setCustom] = useState(500)
  const d = useDeferredValue(text)
  const s = useMemo(() => textStats(d), [d])
  const sms = useMemo(() => smsInfo(d), [d])
  const used = mode === "with" ? s.characters : s.charactersNoSpaces
  const topChars = useMemo(() => {
    const m = new Map<string, number>()
    for (const g of graphemes(d)) if (!/\s/.test(g)) m.set(g, (m.get(g) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
  }, [d])

  const trimTo = (limit: number) => {
    const g = graphemes(text)
    let out = g.slice(0, limit).join("")
    if (mode === "without") {
      let n = 0, i = 0
      for (; i < g.length && n < limit; i++) if (!/\s/.test(g[i])) n++
      out = g.slice(0, i).join("")
    }
    copyText(out, `Copied first ${fmt(limit)} characters`)
  }

  return (
    <ToolGrid title="Character Counter" settingsLabel="Details & limits"
      action={<>
        <Button size="lg" disabled={!text} onClick={() => navigator.clipboard.writeText(text).then(() => toast.success("Text copied"), () => toast.error("Copy blocked — select the text and copy manually"))}><Copy /> Copy text</Button>
        <Button size="lg" variant="outline" disabled={!text} onClick={() => setText("")}><Trash2 /> Clear</Button>
      </>}
      main={<>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Characters" value={fmt(s.characters)} sub="with spaces" />
          <StatCard label="No spaces" value={fmt(s.charactersNoSpaces)} />
          <StatCard label="Words" value={fmt(s.words)} />
          <StatCard label="SMS" value={`${sms.parts} msg`} sub={`${sms.encoding} · ${fmt(sms.remaining)} left`} />
        </div>
        <TextInput value={text} onChange={setText} rows={12} sample="Big news! 🎉 Our new Nashik–Mumbai cab service starts this Monday. Book online in 30 seconds and get 10% off your first ride. नमस्कार!" />
        <Panel title="Character limits">
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {LIMITS.map((l) => <Meter key={l.name} name={l.name} used={used} limit={l.limit} onTrim={() => trimTo(l.limit)} />)}
            <Meter name="Your limit" used={used} limit={Math.max(1, custom)} onTrim={() => trimTo(custom)} />
          </div>
        </Panel>
      </>}
      side={<>
        <Panel title="Count">
          <Segmented value={mode} onChange={setMode} options={[{ value: "with", label: "With spaces" }, { value: "without", label: "Without spaces" }]} />
          <Field label="Custom limit">
            <Input type="number" min={1} value={custom} onChange={(e) => setCustom(Number(e.target.value) || 1)} />
          </Field>
          <Button variant="outline" className="w-full" onClick={() => trimTo(custom)} disabled={used <= custom}><Scissors /> Copy text trimmed to {fmt(custom)}</Button>
        </Panel>
        <Panel title="Details">
          <StatRows rows={[
            ["SMS encoding", sms.encoding],
            ["SMS length", `${fmt(sms.units)} units · ${sms.perPart}/message`],
            ["UTF-16 length (JS .length)", fmt(d.length)],
            ["Size (UTF-8)", `${fmt(s.bytes)} bytes`],
            ["Lines", fmt(s.lines)],
            ["Sentences", fmt(s.sentences)],
            ["Letters (A–Z)", fmt((d.match(/[A-Za-z]/g) ?? []).length)],
            ["Digits", fmt((d.match(/\p{N}/gu) ?? []).length)],
            ["Spaces", fmt((d.match(/ /g) ?? []).length)],
            ["Longest line", `${fmt(Math.max(0, ...d.split("\n").map(graphemeCount)))} chars`],
          ]} />
          <p className="text-xs text-muted-foreground">Marathi letters like “क्ष” count as one character, the way you see them. SMS with Marathi or emoji use Unicode, so one SMS holds only 70 characters.</p>
        </Panel>
        {topChars.length > 0 && (
          <Panel title="Most used characters">
            <div className="flex flex-wrap gap-1.5">
              {topChars.map(([c, n]) => <span key={c} className="rounded-md border bg-muted/40 px-2 py-1 font-mono text-xs">{c} <span className="text-muted-foreground">{n}</span></span>)}
            </div>
          </Panel>
        )}
      </>}
    />
  )
}

/** Tools use files, canvas, workers and local storage, so they render only in the browser. */
const subscribeNothing = () => () => {}
export default function CharacterCounter() {
  const inBrowser = useSyncExternalStore(subscribeNothing, () => true, () => false)
  if (!inBrowser) {
    return (
      <div className="grid h-64 place-items-center rounded-xl border border-dashed bg-card/50" aria-busy="true">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  return <CharacterCounterTool />
}
