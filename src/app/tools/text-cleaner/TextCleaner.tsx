"use client"
/**
 * Text Cleaner — the whole tool in one file (UI, logic and helpers). Runs entirely in the browser.
 */
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowUp, ClipboardPaste, Copy, Download, Eraser, Sparkles, Upload, SlidersHorizontal, Loader2 } from "lucide-react"
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
// ---------- sort ----------
// ---------- spaces ----------
interface SpaceOpts {
  collapse: boolean; trimLines: boolean; tabs: boolean; unicodeSpaces: boolean
  blankLines: "keep" | "collapse" | "remove"; beforePunct: boolean; afterPunct: boolean; removeAll: boolean
}
function cleanSpaces(t: string, o: SpaceOpts): string {
  let s = t.replace(/\r\n?/g, "\n")
  if (o.unicodeSpaces) s = s.replace(/[   -   　]/g, " ")
  if (o.removeAll) return s.replace(/[ \t\f\v]+/g, "")
  if (o.tabs) s = s.replace(/\t/g, " ")
  if (o.collapse) s = s.replace(/[ \t\f\v]{2,}/g, (m) => (m.includes("\t") && !o.tabs ? "\t" : " "))
  if (o.beforePunct) s = s.replace(/[ \t]+([,.;:!?।)\]}])/g, "$1").replace(/([(\[{])[ \t]+/g, "$1")
  if (o.afterPunct) s = s.replace(/([,;:!?])(?=[\p{L}])/gu, "$1 ").replace(/([.])(?=\p{Lu})/gu, "$1 ")
  if (o.trimLines) s = s.split("\n").map((l) => l.trim()).join("\n")
  if (o.blankLines === "remove") s = s.split("\n").filter((l) => !isBlank(l)).join("\n")
  else if (o.blankLines === "collapse") s = s.replace(/\n(?:[ \t]*\n){2,}/g, "\n\n")
  if (o.trimLines || o.blankLines !== "keep") s = s.replace(/^\s*\n|\n\s*$/g, "")
  return s
}

// ---------- line breaks ----------
// ---------- lorem ipsum ----------
// ---------- repeat ----------
// ---------- reverse ----------
// ---------- find & replace ----------
// ---------- emoji ----------
const EMOJI_SEQ = "(?:\\p{Regional_Indicator}{2}|[#*0-9]\\uFE0F?\\u20E3|\\p{Extended_Pictographic}(?:\\uFE0F|\\p{Emoji_Modifier}|[\\u{E0020}-\\u{E007F}])*(?:\\u200D\\p{Extended_Pictographic}(?:\\uFE0F|\\p{Emoji_Modifier})*)*)"
const emojiRegex = () => new RegExp(EMOJI_SEQ, "gu")
const isTextSymbol = (e: string) => /^[©®™]\uFE0F?$/u.test(e)

function removeEmoji(t: string, o: { replaceWith: string; keepSymbols: boolean; tidy: boolean }) {
  let n = 0
  let s = t.replace(emojiRegex(), (e) => { if (o.keepSymbols && isTextSymbol(e)) return e; n++; return o.replaceWith })
  s = s.replace(/️|[\u{1F3FB}-\u{1F3FF}]/gu, "")
  if (o.tidy) s = s.split("\n").map((l) => l.replace(/[ \t]{2,}/g, " ").replace(/[ \t]+$/, "").replace(/^[ \t]+(?=\S)/, (m) => (l.trimStart() === l ? "" : m))).join("\n")
  return { text: s, removed: n }
}

// ---------- cleaner ----------
interface CleanOpts {
  html: boolean; entities: boolean; urls: boolean; emails: boolean; emoji: boolean; numbers: boolean
  punctuation: boolean; special: boolean; nonAscii: boolean; smartQuotes: boolean; zeroWidth: boolean
  spaces: boolean; mentions: boolean; hashtags: boolean
}
function decodeEntities(s: string): string {
  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(`<!doctype html><body>${s.replace(/</g, "&lt;")}`, "text/html")
    return doc.body.textContent ?? s
  }
  const map: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " }
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) =>
    e[0] === "#" ? String.fromCodePoint(parseInt(e.slice(e[1] === "x" || e[1] === "X" ? 2 : 1), e[1] === "x" || e[1] === "X" ? 16 : 10)) : map[e.toLowerCase()] ?? m)
}
function cleanText(t: string, o: CleanOpts): string {
  let s = t.replace(/\r\n?/g, "\n")
  if (o.html) {
    s = s.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, "").replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li|h[1-6]|tr|blockquote|section|article|pre)>/gi, "\n").replace(/<li[^>]*>/gi, "• ")
      .replace(/<[^>]+>/g, "")
  }
  if (o.entities) s = decodeEntities(s)
  if (o.zeroWidth) s = s.replace(/[​⁠﻿­]/g, "")
  if (o.urls) s = s.replace(/\b(?:https?:\/\/|www\.)[^\s<>"')]+/gi, "")
  if (o.emails) s = s.replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, "")
  if (o.mentions) s = s.replace(/(^|\s)@[\p{L}\p{N}_.]+/gu, "$1")
  if (o.hashtags) s = s.replace(/(^|\s)#[\p{L}\p{M}\p{N}_]+/gu, "$1")
  if (o.emoji) s = removeEmoji(s, { replaceWith: "", keepSymbols: false, tidy: false }).text
  if (o.smartQuotes) s = s.replace(/[“”„‟″]/g, '"').replace(/[‘’‚‛′]/g, "'").replace(/[–—―]/g, "-").replace(/…/g, "...").replace(/ /g, " ")
  if (o.numbers) s = s.replace(/\p{N}+/gu, "")
  if (o.punctuation) s = s.replace(/[\p{P}]/gu, "")
  if (o.special) s = s.replace(/[^\p{L}\p{M}\p{N}\s.,!?'"\-:;()।‌‍]/gu, "")
  if (o.nonAscii) s = s.replace(/[^\x00-\x7F]/g, "")
  if (o.spaces) s = cleanSpaces(s, { collapse: true, trimLines: true, tabs: true, unicodeSpaces: true, blankLines: "collapse", beforePunct: true, afterPunct: false, removeAll: false })
  return s
}

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
const DEFAULTS: CleanOpts = { html: true, entities: true, urls: false, emails: false, emoji: false, numbers: false, punctuation: false, special: false, nonAscii: false, smartQuotes: true, zeroWidth: true, spaces: true, mentions: false, hashtags: false }

const GROUPS: { title: string; items: [keyof CleanOpts, string, string?][] }[] = [
  { title: "Formatting", items: [["html", "Strip HTML tags", "Keeps the text, removes <tags>, scripts and styles"], ["entities", "Decode HTML entities", "&amp; → &, &nbsp; → space"], ["smartQuotes", "Straighten quotes & dashes", "“ ” ‘ ’ — … → \" ' - ..."], ["zeroWidth", "Remove invisible characters", "Zero-width spaces, BOM, soft hyphens"], ["spaces", "Tidy spaces & empty lines"]] },
  { title: "Remove content", items: [["urls", "Links / URLs"], ["emails", "Email addresses"], ["mentions", "@mentions"], ["hashtags", "#hashtags"], ["emoji", "Emoji"], ["numbers", "Numbers"]] },
  { title: "Remove characters", items: [["punctuation", "All punctuation"], ["special", "Special symbols", "Keeps letters, numbers and . , ! ? ' \" - : ; ( )"], ["nonAscii", "Non-English characters", "Warning: also removes मराठी / हिंदी"]] },
]

function TextCleanerTool() {
  const [text, setText] = useTextDraft()
  const [o, setO] = useState<CleanOpts>(DEFAULTS)
  const d = useDeferredValue(text)
  const out = useMemo(() => cleanText(d, o), [d, o])
  const removed = d.length - out.length

  return (
    <TextTransform
      text={text} setText={setText} output={out} filename="clean-text.txt"
      note={d ? `${fmt(Math.max(0, removed))} characters removed` : undefined}
      sample={'<div class="post"><h2>Big&nbsp;Sale!</h2><p>Get 50% off — visit https://example.com or mail sales@example.com 😀🔥</p>​<p>“Limited” offer… @shop #sale #deal</p><script>track()</script></div>'}
      options={<>
        {GROUPS.map((g) => (
          <div key={g.title}>
            <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{g.title}</p>
            {g.items.map(([k, label, desc]) => <CheckRow key={k} label={label} desc={desc} checked={o[k]} onChange={(v) => setO((p) => ({ ...p, [k]: v }))} />)}
          </div>
        ))}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => setO(DEFAULTS)}>Reset</Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={() => setO((p) => Object.fromEntries(Object.keys(p).map((k) => [k, k !== "nonAscii" && k !== "punctuation" && k !== "numbers"])) as unknown as CleanOpts)}>Deep clean</Button>
        </div>
      </>}
    />
  )
}

/** Tools use files, canvas, workers and local storage, so they render only in the browser. */
const subscribeNothing = () => () => {}
export default function TextCleaner() {
  const inBrowser = useSyncExternalStore(subscribeNothing, () => true, () => false)
  if (!inBrowser) {
    return (
      <div className="grid h-64 place-items-center rounded-xl border border-dashed bg-card/50" aria-busy="true">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  return <TextCleanerTool />
}
