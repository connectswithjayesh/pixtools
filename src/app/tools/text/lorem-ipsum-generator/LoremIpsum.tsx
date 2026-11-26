"use client"
/**
 * Lorem Ipsum Generator — the whole tool in one file (UI, logic and helpers). Runs entirely in the browser.
 */
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { ArrowUp, Copy, Download, RefreshCw, SlidersHorizontal, Loader2 } from "lucide-react"
import { useMemo, useState, useEffect, useSyncExternalStore, useRef } from "react"
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
const upFirst = (w: string) => { const g = graphemes(w); return g.length ? g[0].toLocaleUpperCase() + g.slice(1).join("") : w }
// ---------- duplicates ----------
// ---------- sort ----------
// ---------- spaces ----------
// ---------- line breaks ----------
// ---------- lorem ipsum ----------
const LATIN = ("lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum " +
  "curabitur pretium tincidunt lacus nulla gravida orci a odio nullam varius turpis et commodo pharetra est eros bibendum elit nec luctus magna felis sollicitudin mauris integer iaculis vitae ante vivamus morbi semper porta purus donec viverra mi quis quam pulvinar suscipit fusce pellentesque").split(" ")
const MARATHI = ("आज सकाळी गावात नवीन शाळा सुरू झाली मुले आनंदाने वर्गात बसली शिक्षकांनी गोष्ट सांगितली पावसाळ्यात शेतात हिरवेगार पीक डोलते नदीच्या काठावर सुंदर मंदिर आहे आम्ही सगळे मिळून काम करतो घरी आई गरम भाकरी बनवते बाजारात भाजी ताजी मिळते संध्याकाळी आकाश केशरी रंगाचे दिसते " +
  "प्रवास करताना नवीन माणसे भेटतात पुस्तक वाचल्याने ज्ञान वाढते मित्रांसोबत खेळताना वेळ पटकन जातो डोंगरावर थंड वारा वाहतो सण आला की घर उजळून निघते रोज थोडा व्यायाम केला पाहिजे लहान गोष्टींमध्ये मोठा आनंद असतो").split(" ")
const HINDI = ("आज सुबह गाँव में नया स्कूल खुला बच्चे खुशी से कक्षा में बैठे शिक्षक ने कहानी सुनाई बारिश में खेतों में हरी फसल लहराती है नदी के किनारे सुंदर मंदिर है हम सब मिलकर काम करते हैं घर पर माँ गरम रोटी बनाती है बाज़ार में ताज़ी सब्ज़ी मिलती है शाम को आसमान नारंगी दिखता है " +
  "सफ़र में नए लोग मिलते हैं किताब पढ़ने से ज्ञान बढ़ता है दोस्तों के साथ समय जल्दी बीतता है पहाड़ पर ठंडी हवा चलती है त्योहार आते ही घर रोशन हो जाता है").split(" ")
type LoremLang = "latin" | "marathi" | "hindi"
type LoremUnit = "paragraphs" | "sentences" | "words" | "list"
function lorem(o: { unit: LoremUnit; count: number; lang: LoremLang; startClassic: boolean; html: boolean; rnd?: () => number }): string {
  const rnd = o.rnd ?? Math.random
  const bank = o.lang === "marathi" ? MARATHI : o.lang === "hindi" ? HINDI : LATIN
  const stop = o.lang === "latin" ? "." : o.lang === "hindi" ? "।" : "."
  const pick = () => bank[Math.floor(rnd() * bank.length)]
  const int = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1))
  let first = o.startClassic
  const classic = o.lang === "latin" ? "Lorem ipsum dolor sit amet, consectetur adipiscing elit" : o.lang === "hindi" ? "यह एक नमूना पाठ है" : "हा एक नमुना मजकूर आहे"
  const sentence = () => {
    const n = int(7, 15)
    const w = Array.from({ length: n }, pick)
    if (n > 9 && rnd() < 0.6) w[int(3, n - 4)] += ","
    let s = w.join(" ")
    if (first) { s = classic + (o.lang === "latin" ? ", " : " ") + w.slice(0, int(3, 7)).join(" "); first = false }
    return upFirst(s) + stop
  }
  const para = () => Array.from({ length: int(4, 7) }, sentence).join(" ")
  const n = Math.max(1, Math.min(o.count, o.unit === "words" ? 10000 : 500))
  switch (o.unit) {
    case "words": {
      const w = Array.from({ length: n }, pick)
      if (o.startClassic) { const c = classic.replace(/,/g, "").split(" "); for (let i = 0; i < Math.min(c.length, n); i++) w[i] = c[i] }
      const s = upFirst(w.join(" ")) + stop
      return o.html ? `<p>${s}</p>` : s
    }
    case "sentences": { const s = Array.from({ length: n }, sentence).join(" "); return o.html ? `<p>${s}</p>` : s }
    case "list": {
      const items = Array.from({ length: n }, () => { const s = sentence(); return s.slice(0, -1).split(" ").slice(0, int(3, 8)).join(" ").replace(/,$/, "") })
      return o.html ? `<ul>\n${items.map((i) => `  <li>${i}</li>`).join("\n")}\n</ul>` : items.map((i) => `• ${i}`).join("\n")
    }
    default: { const p = Array.from({ length: n }, para); return o.html ? p.map((x) => `<p>${x}</p>`).join("\n\n") : p.join("\n\n") }
  }
}

// ---------- repeat ----------
// ---------- reverse ----------
// ---------- find & replace ----------
// ---------- emoji ----------
// ---------- cleaner ----------
// ---------- word frequency ----------
// ---------- line numbers ----------
/* ─── helpers (from tools/text/components.tsx) ─── */
const fmt = (n: number) => n.toLocaleString("en-IN")

function countLine(t: string) {
  return `${fmt(graphemeCount(t))} characters · ${fmt(words(t).length)} words · ${fmt(splitLines(t).length)} lines`
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
const MAX: Record<LoremUnit, number> = { paragraphs: 100, sentences: 500, words: 10000, list: 200 }

function seeded(seed: number) {
  let s = seed >>> 0 || 1
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296 }
}

function LoremIpsumTool() {
  const [unit, setUnit] = useState<LoremUnit>("paragraphs")
  const [count, setCount] = useState(3)
  const [lang, setLang] = useState<LoremLang>("latin")
  const [startClassic, setStart] = useState(true)
  const [html, setHtml] = useState(false)
  const [seed, setSeed] = useState(() => (Math.random() * 2 ** 32) >>> 0)
  const n = Math.min(Math.max(1, count || 1), MAX[unit])
  const out = useMemo(() => lorem({ unit, count: n, lang, startClassic, html, rnd: seeded(seed) }), [unit, n, lang, startClassic, html, seed])

  return (
    <ToolGrid title="Lorem Ipsum Generator" settingsLabel="Options" action={<><Button variant="outline" onClick={() => setSeed((Math.random() * 2 ** 32) >>> 0)}><RefreshCw /> New text</Button><Button onClick={() => copyText(out)}><Copy /> Copy</Button></>}
      main={<TextOutput value={out} filename={`${lang === "latin" ? "lorem-ipsum" : `${lang}-dummy-text`}.${html ? "html" : "txt"}`} label="Generated text" rows={18} />}
      side={<Panel title="Options">
        <Field label="Generate">
          <Segmented value={unit} onChange={(u) => { setUnit(u); setCount(u === "words" ? 50 : u === "sentences" ? 5 : 3) }} options={[{ value: "paragraphs", label: "Paragraphs" }, { value: "sentences", label: "Sentences" }, { value: "words", label: "Words" }, { value: "list", label: "List" }]} />
        </Field>
        {unit === "words" ? (
          <Field label="How many words" hint={`max ${MAX.words.toLocaleString()}`}>
            <Input type="number" min={1} max={MAX.words} value={count} onChange={(e) => setCount(Number(e.target.value))} />
          </Field>
        ) : (
          <SliderField label={`How many ${unit === "list" ? "list items" : unit}`} value={n} onChange={setCount} min={1} max={unit === "paragraphs" ? 20 : 50} />
        )}
        <Field label="Language">
          <Segmented value={lang} onChange={setLang} options={[{ value: "latin", label: "Lorem (Latin)" }, { value: "marathi", label: "मराठी" }, { value: "hindi", label: "हिंदी" }]} />
        </Field>
        <div>
          <CheckRow label={lang === "latin" ? "Start with “Lorem ipsum dolor sit amet…”" : "Start with “sample text” sentence"} checked={startClassic} onChange={setStart} />
          <CheckRow label="Wrap in HTML tags" desc="<p> for paragraphs, <ul><li> for lists" checked={html} onChange={setHtml} />
        </div>
        <Button className="w-full" onClick={() => setSeed((Math.random() * 2 ** 32) >>> 0)}><RefreshCw /> Generate new text</Button>
        <p className="text-xs text-muted-foreground">Marathi and Hindi dummy text is made of random everyday words, useful for testing Devanagari fonts and layouts.</p>
      </Panel>}
    />
  )
}

/** Tools use files, canvas, workers and local storage, so they render only in the browser. */
const subscribeNothing = () => () => {}
export default function LoremIpsum() {
  const inBrowser = useSyncExternalStore(subscribeNothing, () => true, () => false)
  if (!inBrowser) {
    return (
      <div className="grid h-64 place-items-center rounded-xl border border-dashed bg-card/50" aria-busy="true">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  return <LoremIpsumTool />
}
