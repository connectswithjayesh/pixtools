/// <reference lib="webworker" />
/**
 * Image Optimizer worker: resize → reduce palette → encode, off the main thread.
 * Started by ImageOptimizer.tsx (one worker per side; restarted to cancel a stale job).
 */

/* ─── helpers (from tools/image/optimizer/codecs.ts) ─── */
// Codec catalogue for the Image Optimizer. Each codec declares its option fields,
// so the settings UI is generated automatically (like Squoosh).

type EncoderType =
  | "original" | "mozjpeg" | "webp" | "avif" | "jxl" | "oxipng" | "qoi"
  | "browser-jpeg" | "browser-png" | "browser-webp"

type Opts = Record<string, number | boolean>
type ResizeMethod = "lanczos3" | "mitchell" | "catrom" | "triangle" | "hqx" | "magicKernel" | "magicKernelSharp2013" | "magicKernelSharp2021" | "browser-high" | "browser-pixelated"

interface SideSettings {
  resize: { enabled: boolean; width: number; height: number; method: ResizeMethod; fit: "stretch" | "contain"; premultiply: boolean; linearRGB: boolean; keepAspect: boolean }
  palette: { enabled: boolean; colors: number; dither: number }
  encoder: { type: EncoderType; options: Opts }
}

// Messages between the page and ImageOptimizer.worker.ts
type WorkerIn =
  | { type: "init"; image: ImageData }
  | { type: "run"; id: number; settings: SideSettings }
type WorkerOut =
  | { id: number; ok: true; buffer: ArrayBuffer; width: number; height: number; ms: number; decoded?: ImageData }
  | { id: number; ok: false; error: string }

/* ─── helpers (from tools/image/optimizer/quantize.ts) ─── */
// Reduce an image to N colours (k-means palette) with optional Floyd–Steinberg dithering.
// Alpha-aware, so transparent PNGs keep their transparency.

function quantize(img: ImageData, colors: number, dither: number): ImageData {
  const { width: w, height: h, data } = img
  const n = w * h
  const k = Math.max(2, Math.min(256, colors | 0))

  // --- sample pixels
  const step = Math.max(1, Math.floor(n / 40000))
  const samples: number[] = []
  for (let i = 0; i < n; i += step) samples.push(data[i * 4], data[i * 4 + 1], data[i * 4 + 2], data[i * 4 + 3])
  const S = samples.length / 4

  // --- k-means++ init
  const pal = new Float32Array(k * 4)
  const dist = new Float32Array(S).fill(Infinity)
  let pick = Math.floor(S / 2)
  for (let c = 0; c < k; c++) {
    for (let j = 0; j < 4; j++) pal[c * 4 + j] = samples[pick * 4 + j]
    let sum = 0
    for (let s = 0; s < S; s++) {
      const d = d2(samples, s * 4, pal, c * 4)
      if (d < dist[s]) dist[s] = d
      sum += dist[s]
    }
    if (sum === 0) { // fewer distinct colours than k
      for (let r = c + 1; r < k; r++) for (let j = 0; j < 4; j++) pal[r * 4 + j] = pal[c * 4 + j]
      break
    }
    let t = ((c * 2654435761) % 1000 / 1000) * sum // deterministic pseudo-random
    pick = 0
    for (let s = 0; s < S; s++) { t -= dist[s]; if (t <= 0) { pick = s; break } }
  }

  // --- k-means refinement
  const acc = new Float64Array(k * 5)
  for (let it = 0; it < 8; it++) {
    acc.fill(0)
    for (let s = 0; s < S; s++) {
      const c = nearest(pal, k, samples[s * 4], samples[s * 4 + 1], samples[s * 4 + 2], samples[s * 4 + 3])
      acc[c * 5] += samples[s * 4]; acc[c * 5 + 1] += samples[s * 4 + 1]; acc[c * 5 + 2] += samples[s * 4 + 2]; acc[c * 5 + 3] += samples[s * 4 + 3]; acc[c * 5 + 4]++
    }
    for (let c = 0; c < k; c++) {
      const cnt = acc[c * 5 + 4]
      if (cnt) for (let j = 0; j < 4; j++) pal[c * 4 + j] = acc[c * 5 + j] / cnt
    }
  }
  for (let i = 0; i < pal.length; i++) pal[i] = Math.round(pal[i])

  // --- map pixels (with a colour cache) + dithering
  const cache = new Int16Array(1 << 19).fill(-1)
  const out = new Uint8ClampedArray(data.length)
  const errCur = new Float32Array((w + 2) * 4), errNext = new Float32Array((w + 2) * 4)
  for (let y = 0; y < h; y++) {
    errNext.fill(0)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, e = (x + 1) * 4
      const r = clamp(data[i] + errCur[e]), g = clamp(data[i + 1] + errCur[e + 1]), b = clamp(data[i + 2] + errCur[e + 2]), a = clamp(data[i + 3] + errCur[e + 3])
      const key = ((r >> 3) << 14) | ((g >> 3) << 9) | ((b >> 3) << 4) | (a >> 4)
      let c = cache[key]
      if (c < 0) { c = nearest(pal, k, r, g, b, a); cache[key] = c }
      out[i] = pal[c * 4]; out[i + 1] = pal[c * 4 + 1]; out[i + 2] = pal[c * 4 + 2]; out[i + 3] = pal[c * 4 + 3]
      if (dither > 0) {
        for (let j = 0; j < 4; j++) {
          const er = ((j === 0 ? r : j === 1 ? g : j === 2 ? b : a) - pal[c * 4 + j]) * dither
          errCur[e + 4 + j] += er * 7 / 16
          errNext[e - 4 + j] += er * 3 / 16
          errNext[e + j] += er * 5 / 16
          errNext[e + 4 + j] += er * 1 / 16
        }
      }
    }
    errCur.set(errNext)
  }
  return new ImageData(out, w, h)
}

const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v | 0)
function d2(a: ArrayLike<number>, i: number, b: ArrayLike<number>, j: number) {
  const dr = a[i] - b[j], dg = a[i + 1] - b[j + 1], db = a[i + 2] - b[j + 2], da = a[i + 3] - b[j + 3]
  return dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11 + da * da
}
function nearest(pal: Float32Array, k: number, r: number, g: number, b: number, a: number) {
  let best = 0, bd = Infinity
  for (let c = 0; c < k; c++) {
    const dr = r - pal[c * 4], dg = g - pal[c * 4 + 1], db = b - pal[c * 4 + 2], da = a - pal[c * 4 + 3]
    const d = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11 + da * da
    if (d < bd) { bd = d; best = c }
  }
  return best
}

/* ═══════════════ Tool ═══════════════ */
let source: ImageData | null = null

async function browserResize(img: ImageData, w: number, h: number, smooth: boolean) {
  const src = new OffscreenCanvas(img.width, img.height)
  src.getContext("2d")!.putImageData(img, 0, 0)
  const dst = new OffscreenCanvas(w, h)
  const ctx = dst.getContext("2d")!
  ctx.imageSmoothingEnabled = smooth
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(src, 0, 0, w, h)
  return ctx.getImageData(0, 0, w, h)
}

/*
 * AVIF, JPEG XL and OxiPNG use their single-thread builds. The multi-thread builds only run on
 * cross-origin-isolated pages (COOP/COEP headers), which would block AdSense, and their
 * self-spawning workers do not bundle with Turbopack.
 */
type Emscripten = { encode: (d: Uint8Array | Uint8ClampedArray, w: number, h: number, o: object) => Uint8Array | null }
let avifMod: Promise<Emscripten> | undefined
let jxlMod: Promise<Emscripten> | undefined
let oxiMod: Promise<{ optimise_raw: (d: Uint8ClampedArray, w: number, h: number, level: number, interlace: boolean, alpha: boolean) => Uint8Array }> | undefined

async function encodeAvif(img: ImageData, o: Record<string, unknown>): Promise<ArrayBuffer> {
  const { defaultOptions } = await import("@jsquash/avif/meta.js")
  avifMod ??= import("@jsquash/avif/codec/enc/avif_enc.js").then((m) => (m.default as unknown as (o: object) => Promise<Emscripten>)({ noInitialRun: true }))
  const opts: Record<string, unknown> = { ...defaultOptions, ...o }
  if (opts.lossless) { opts.quality = 100; opts.qualityAlpha = -1; opts.subsample = 3 }
  const out = (await avifMod).encode(new Uint8Array(img.data.buffer), img.width, img.height, opts)
  if (!out) throw new Error("AVIF encoding failed")
  return out.slice().buffer
}

async function encodeJxl(img: ImageData, o: Record<string, unknown>): Promise<ArrayBuffer> {
  const { defaultOptions } = await import("@jsquash/jxl/meta.js")
  jxlMod ??= import("@jsquash/jxl/codec/enc/jxl_enc.js").then((m) => (m.default as unknown as (o: object) => Promise<Emscripten>)({ noInitialRun: true }))
  const opts: Record<string, unknown> = { ...defaultOptions, ...o }
  if (opts.lossless) { opts.quality = 100; opts.lossyModular = false; opts.lossyPalette = false }
  const out = (await jxlMod).encode(img.data, img.width, img.height, opts)
  if (!out) throw new Error("JPEG XL encoding failed")
  return out.slice().buffer
}

async function encodeOxipng(img: ImageData, o: Record<string, unknown>): Promise<ArrayBuffer> {
  oxiMod ??= import("@jsquash/oxipng/codec/pkg/squoosh_oxipng.js").then(async (m) => { await m.default(); return m as never })
  const level = (o.level as number | undefined) ?? 2
  const interlace = !!o.interlace
  const alpha = o.optimiseAlpha === undefined ? false : !!o.optimiseAlpha
  return (await oxiMod).optimise_raw(img.data, img.width, img.height, level, interlace, alpha).slice().buffer
}

async function encode(img: ImageData, s: SideSettings): Promise<ArrayBuffer> {
  const o = s.encoder.options as never
  switch (s.encoder.type) {
    case "mozjpeg": return (await import("@jsquash/jpeg/encode.js")).default(img, o)
    case "webp": return (await import("@jsquash/webp/encode.js")).default(img, o)
    case "avif": return encodeAvif(img, o)
    case "jxl": return encodeJxl(img, o)
    case "qoi": return (await import("@jsquash/qoi/encode.js")).default(img)
    case "oxipng": return encodeOxipng(img, o)
    default: {
      const type = s.encoder.type === "browser-png" ? "image/png" : s.encoder.type === "browser-webp" ? "image/webp" : "image/jpeg"
      const c = new OffscreenCanvas(img.width, img.height)
      const ctx = c.getContext("2d")!
      if (type === "image/jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height) }
      // putImageData ignores the white fill for transparent pixels, so draw via a second canvas
      const t = new OffscreenCanvas(img.width, img.height); t.getContext("2d")!.putImageData(img, 0, 0)
      ctx.drawImage(t, 0, 0)
      const q = (s.encoder.options.quality as number | undefined) ?? 75
      const blob = await c.convertToBlob({ type, quality: q / 100 })
      if (blob.type !== type) throw new Error(`This browser can’t encode ${type.split("/")[1].toUpperCase()}`)
      return blob.arrayBuffer()
    }
  }
}

self.onmessage = async (e: MessageEvent<WorkerIn>) => {
  const m = e.data
  if (m.type === "init") { source = m.image; return }
  const { id, settings: s } = m
  try {
    if (!source) throw new Error("No image")
    const t0 = performance.now()
    let img = source
    const r = s.resize
    if (r.enabled && (r.width !== img.width || r.height !== img.height)) {
      const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height))
      if (r.method === "browser-high" || r.method === "browser-pixelated") img = await browserResize(img, w, h, r.method === "browser-high")
      else {
        const resize = (await import("@jsquash/resize")).default
        img = await resize(img, { width: w, height: h, method: r.method, fitMethod: r.fit, premultiply: r.premultiply, linearRGB: r.linearRGB })
      }
    }
    if (s.palette.enabled) img = quantize(img, s.palette.colors, s.palette.dither)
    const buffer = await encode(img, s)
    let decoded: ImageData | undefined
    if (s.encoder.type === "jxl") decoded = await (await import("@jsquash/jxl/decode.js")).default(buffer)
    if (s.encoder.type === "qoi") decoded = await (await import("@jsquash/qoi/decode.js")).default(buffer)
    const out: WorkerOut = { id, ok: true, buffer, width: img.width, height: img.height, ms: Math.round(performance.now() - t0), decoded }
    self.postMessage(out, [buffer])
  } catch (err) {
    self.postMessage({ id, ok: false, error: (err as Error)?.message || String(err) } satisfies WorkerOut)
  }
}
