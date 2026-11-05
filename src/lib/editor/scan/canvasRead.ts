import { COLOR_HEX } from '../../core/stickerColors'
import type { Color, Cube } from '../../core/types'
import { joinKey, type Canvas } from '../modes/canvas'
import type { FaceEntry } from '../modes/faceViews'
import { labOf, rgbOfHex, type Lab } from './color'
import type { Rect } from './sized'

/**
 * A puzzle entered on canvases (modes/canvas.ts) read from pictures of its
 * faces (pure), sticker by sticker: Meffert's Pocket Cube shows its pieces'
 * faces on a grid of mini cubes (a big cube's two by two), each sticker
 * framed in black. A pixel is a sticker's where it has the hue of one of
 * the puzzle's colors (none: the black body, the background, a hand, a
 * shirt); each sticker is its pixels joined, apart from the others by
 * their black frames. Its size says big or mini (as the user can tell
 * them: a big sticker has no black line across, four minis do), never its
 * hue (under daylight, violet has the very hue of blue, 2026-11-05). Each
 * one is then placed on the grid by its own middle: out of shape, the
 * puzzle's pieces stand at different depths, and no one grid lies on all
 * their stickers at once (a column half a cell off another, 2026-11-05).
 * The face must be one the puzzle shows (each sticker within its canvas,
 * none on another, as many big ones as a face shows). Then the stickers'
 * colors, of all faces at once: a big one the big pieces' color, a small
 * one the closest in hue of the small pieces', none on more stickers than
 * the puzzle has. Real photos, 2026-11-04 and 05: 103 faces read right of
 * 103, solved and scrambled, a warm light, daylight, a thin rim against
 * the background, a shirt alike in gray, the puzzle held filling the frame
 * comprised.
 */

/** A face's picture, its pixels in RGBA. */
export interface Picture {
  readonly width: number
  readonly height: number
  readonly rgba: Uint8ClampedArray
}

/** A face read: its grid's cells (row by row, `cols` a side), each the
 *  sticker it shows (-1: none), each sticker its span (cells a side) and
 *  its color as the picture shows it; where the grid lay in the picture
 *  (its top left, its cell's side), to show it. */
export interface GridFace {
  readonly cols: number
  readonly owner: readonly number[]
  readonly stickers: readonly { readonly span: number; readonly lab: Lab }[]
  readonly at: readonly [number, number]
  readonly unit: number
}

/** Below this chroma, or this lightness, a pixel shows no sticker (the
 *  black body, a pale wall); past this turn of hue from all of the
 *  puzzle's colors, neither (skin, a shirt, under a warm light too). Real
 *  photos, 2026-11-04 and 05: stickers 30 to 65 in chroma (minis in the
 *  shade missed from 28), a warm wall 18 to 20; violet 285 to 318 degrees,
 *  blue 271 to 297, yellow 96, lime 120 to 124, 145 to 155 pale under
 *  daylight (missed at 26), a teal shirt 221 to 228, skin 25. */
const CHROMA = 24
const LIGHT = 8
const HUE_OFF = (32 * Math.PI) / 180

const hueOf = ([, a, b]: Lab) => Math.atan2(b, a)

/** How far a measure's hue is from a color's. */
function turnTo(lab: Lab, color: Color): number {
  const [hue, a] = [hueOf(lab), hueOf(labOf(...rgbOfHex(COLOR_HEX[color])))]
  return Math.min(Math.abs(a - hue), 2 * Math.PI - Math.abs(a - hue))
}

/** The color of these closest in hue to a measure. */
function nearestHue(lab: Lab, colors: readonly Color[]): Color {
  return colors.reduce((a, b) => (turnTo(lab, b) < turnTo(lab, a) ? b : a))
}

/** The puzzle's color a measure shows (closest in hue), or none: too dark,
 *  too pale, or another hue. */
export function cellColor(lab: Lab, colors: readonly Color[]): Color | null {
  if (lab[0] < LIGHT || Math.hypot(lab[1], lab[2]) < CHROMA || !colors.length) return null
  const color = nearestHue(lab, colors)
  return turnTo(lab, color) <= HUE_OFF ? color : null
}

/** Cells across a face's grid. */
const COLS = 6
/** A sticker's least area, a share of a frame's cell (a mini held far);
 *  how much longer than wide it may be (seen askew), how much of its box
 *  it fills at least (a glint on a corner). */
const LEAST_AREA = 1 / 9
const LONGEST = 1.6
const FILLS = 0.55
/** How much bigger a big sticker is than a mini, side to side, at least
 *  (some 2.3: two cells against one, less their frames). */
const SIZES_APART = 1.5
/** What a sticker's black frame takes off its piece's face, in cells. */
const FRAME = 0.25

/** A sticker found: its box (right and bottom excluded), its pixels, and
 *  those of them that show its color (not a glint). */
interface Blob {
  readonly x0: number
  readonly y0: number
  readonly x1: number
  readonly y1: number
  readonly pixels: readonly number[]
  readonly colored: readonly number[]
}

/** A pixel's kind: none (the black body and frames, the background), one
 *  of the puzzle's colors, or pale (a glint on a sticker, or a pale wall:
 *  a sticker's only within its black frame); and a pixel looked at. */
const [NONE, COLORED, PALE, SEEN] = [0, 1, 2, 3]
/** How light a pale pixel is, at least (a glint, past the black frames and
 *  the body's own glints); how much of a sticker shows its color, at least
 *  (the rest a glint: half a big cube, 2026-11-05; not a pale wall). */
const PALE_LIGHT = 55
const COLORED_SHARE = 0.15

/** The picture's stickers: its colored pixels joined (4-neighbors), with
 *  the pale ones within the same black frame (a glint washes a sticker
 *  out, 2026-11-05: half a big cube, a lime mini nearly white), each set
 *  of them square enough and big enough (`least` pixels), none at the
 *  picture's edge (cut off), none within another (a big cube's logo). */
function blobsOf(
  { width, height, rgba }: Picture,
  colors: readonly Color[],
  least: number,
): Blob[] {
  const kind = new Uint8Array(width * height)
  for (let i = 0; i < kind.length; i++) {
    const lab = labOf(rgba[4 * i]!, rgba[4 * i + 1]!, rgba[4 * i + 2]!)
    kind[i] = cellColor(lab, colors)
      ? COLORED
      : lab[0] >= PALE_LIGHT && Math.hypot(lab[1], lab[2]) < CHROMA
        ? PALE
        : NONE
  }
  const found: Blob[] = []
  const stack: number[] = []
  for (let start = 0; start < kind.length; start++) {
    if (kind[start] !== COLORED) continue
    stack.push(start)
    kind[start] = SEEN
    const [pixels, colored]: [number[], number[]] = [[], [start]]
    let [x0, y0, x1, y1] = [width, height, 0, 0]
    let edge = false
    while (stack.length) {
      const i = stack.pop()!
      pixels.push(i)
      const [x, y] = [i % width, Math.floor(i / width)]
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) edge = true
      ;[x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)]
      for (const j of [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, i - width, i + width]) {
        if (j < 0 || j >= kind.length || kind[j] === NONE || kind[j] === SEEN) continue
        if (kind[j] === COLORED) colored.push(j)
        kind[j] = SEEN
        stack.push(j)
      }
    }
    if (edge || colored.length < COLORED_SHARE * pixels.length) continue
    const whole = { x0, y0, x1: x1 + 1, y1: y1 + 1, pixels, colored }
    for (const blob of splitAtWaist(whole, width)) {
      const [w, h] = [blob.x1 - blob.x0, blob.y1 - blob.y0]
      const shaped =
        blob.pixels.length >= least &&
        Math.max(w, h) / Math.min(w, h) <= LONGEST &&
        blob.pixels.length / (w * h) >= FILLS
      if (shaped) found.push(blob)
    }
  }
  const within = (a: Blob, b: Blob) =>
    a !== b && a.x0 >= b.x0 && a.x1 <= b.x1 && a.y0 >= b.y0 && a.y1 <= b.y1
  return found.filter((a) => !found.some((b) => within(a, b)))
}

/** How thin a sticker's waist is, at most, a share of its short side, for
 *  it to be two stickers; and where along it the waist is looked for. */
const WAIST = 0.3
const WAIST_MIDDLE = [0.2, 0.8] as const

/** A sticker too long, two stickers a glint joins across their black
 *  frames (two big cubes, a glint over the seam between them, 2026-11-05):
 *  cut at its waist, where fewest of its pixels lie across, each part cut
 *  again if need be; else itself. */
function splitAtWaist(blob: Blob, width: number): Blob[] {
  const [w, h] = [blob.x1 - blob.x0, blob.y1 - blob.y0]
  if (Math.max(w, h) / Math.min(w, h) <= LONGEST) return [blob]
  const tall = h > w
  const along = (i: number) => (tall ? Math.floor(i / width) - blob.y0 : (i % width) - blob.x0)
  const counts = new Array<number>(Math.max(w, h)).fill(0)
  for (const i of blob.pixels) counts[along(i)]!++
  const [from, to] = WAIST_MIDDLE.map((k) => Math.round(k * counts.length))
  let waist = from!
  for (let k = from!; k < to!; k++) if (counts[k]! < counts[waist]!) waist = k
  if (counts[waist]! > WAIST * Math.min(w, h)) return [blob]
  const part = (pixels: number[], colored: number[]): Blob[] => {
    if (!colored.length) return []
    let [x0, y0, x1, y1] = [Infinity, Infinity, 0, 0]
    for (const i of pixels) {
      const [x, y] = [i % width, Math.floor(i / width)]
      ;[x0, y0, x1, y1] = [
        Math.min(x0, x),
        Math.min(y0, y),
        Math.max(x1, x + 1),
        Math.max(y1, y + 1),
      ]
    }
    return splitAtWaist({ x0, y0, x1, y1, pixels, colored }, width)
  }
  const side = (before: boolean) => (i: number) => (before ? along(i) < waist : along(i) > waist)
  return [true, false].flatMap((before) =>
    part(blob.pixels.filter(side(before)), blob.colored.filter(side(before))),
  )
}

/** Where stickers `unit` wide a cell, starting at `starts` along an axis,
 *  have their grid start: the mean of their starts, round the cell. */
function offsetOf(starts: readonly number[], unit: number): number {
  const angles = starts.map((e) => (2 * Math.PI * e) / unit)
  const [s, c] = [
    angles.reduce((a, t) => a + Math.sin(t), 0),
    angles.reduce((a, t) => a + Math.cos(t), 0),
  ]
  return (Math.atan2(s, c) / (2 * Math.PI)) * unit
}

/** Whether a face's stickers draw what a face can show: within its canvas
 *  (`n` cells a side), as many big ones as a face shows (`bigs`), all of
 *  them where no small one shows. */
function drawable(
  owner: readonly number[],
  spans: readonly number[],
  n: number,
  bigs: FaceEntry['bigs'],
): boolean {
  const shown = owner.flatMap((o, i) => (o >= 0 ? [i] : []))
  if (!shown.length) return false
  const rows = shown.map((i) => Math.floor(i / COLS))
  const cols = shown.map((i) => i % COLS)
  if (Math.max(...rows) - Math.min(...rows) >= n || Math.max(...cols) - Math.min(...cols) >= n)
    return false
  if (!bigs) return true
  const big = spans.filter((s) => s > 1).length
  return big >= bigs.least && big <= bigs.all && (big < spans.length || big === bigs.all)
}

/** A sticker's color as the picture shows it: its pixels' mean, in Lab. */
function labOfPixels({ rgba }: Picture, pixels: readonly number[]): Lab {
  let [r, g, b] = [0, 0, 0]
  for (const i of pixels) {
    r += rgba[4 * i]!
    g += rgba[4 * i + 1]!
    b += rgba[4 * i + 2]!
  }
  const n = Math.max(1, pixels.length)
  return labOf(r / n, g / n, b / n)
}

/** A face read on its picture, the frame shown at `frame` in it: its
 *  stickers (`entry`, its colors `colors`), big or small by their sizes,
 *  each placed on the grid by its middle; none if they draw no face the
 *  puzzle shows. */
export function readGrid(
  picture: Picture,
  [, , fw]: Rect,
  entry: Pick<FaceEntry, 'spans' | 'bigs' | 'canvas'>,
  colors: readonly Color[],
): GridFace | null {
  const spanned = Object.values(entry.spans ?? {})
  const [small, big] = [Math.min(1, ...spanned), Math.max(1, ...spanned)]
  const blobs = blobsOf(picture, colors, LEAST_AREA * (fw / COLS) ** 2)
  if (!blobs.length) return null
  // Big or small: apart at the first gap from the smallest; all big if
  // none (a face of big cubes only).
  const sides = blobs.map(({ x0, y0, x1, y1 }) => Math.sqrt((x1 - x0) * (y1 - y0)))
  const sorted = [...sides].sort((a, b) => a - b)
  let cut = 0
  for (let i = 1; i < sorted.length && !cut; i++) {
    if (sorted[i]! / sorted[i - 1]! >= SIZES_APART) cut = Math.sqrt(sorted[i]! * sorted[i - 1]!)
  }
  const spans = sides.map((side) => (side > cut ? big : small))
  const units = sides.map((side, i) => side / (spans[i]! - FRAME)).sort((a, b) => a - b)
  const unit = units[units.length >> 1]!
  // Each sticker's first cell, round its middle.
  const starts = blobs.map(({ x0, y0, x1, y1 }, i) => [
    (x0 + x1 - spans[i]! * unit) / 2,
    (y0 + y1 - spans[i]! * unit) / 2,
  ])
  const origin = [0, 1].map((a) =>
    offsetOf(
      starts.map((s) => s[a]!),
      unit,
    ),
  )
  const cells = starts.map((s) => [0, 1].map((a) => Math.round((s[a]! - origin[a]!) / unit)))
  const [c0, r0] = [0, 1].map((a) => Math.min(...cells.map((c) => c[a]!))) as [number, number]
  const owner = Array.from({ length: COLS * COLS }, () => -1)
  for (let s = 0; s < blobs.length; s++) {
    const [c, r] = [cells[s]![0]! - c0, cells[s]![1]! - r0]
    for (let dr = 0; dr < spans[s]!; dr++) {
      for (let dc = 0; dc < spans[s]!; dc++) {
        const i = (r + dr) * COLS + c + dc
        if (r + dr >= COLS || c + dc >= COLS || owner[i]! >= 0) return null
        owner[i] = s
      }
    }
  }
  if (!drawable(owner, spans, entry.canvas, entry.bigs)) return null
  const stickers = blobs.map(({ colored }, s) => ({
    span: spans[s]!,
    lab: labOfPixels(picture, colored),
  }))
  const at = [origin[0]! + c0 * unit, origin[1]! + r0 * unit] as const
  return { cols: COLS, owner, stickers, at, unit }
}

/** Where a face's stickers lay in its picture, to show them (scanDebug). */
export function gridRects({ cols, owner, stickers, at: [ox, oy], unit }: GridFace): Rect[] {
  return stickers.map(({ span }, s) => {
    const first = owner.indexOf(s)
    const [row, col] = [Math.floor(first / cols), first % cols]
    return [ox + col * unit, oy + row * unit, span * unit, span * unit]
  })
}

/** How many stickers of each color the solved puzzle has. */
function stickerCounts(solved: Cube): Map<Color, number> {
  const counts = new Map<Color, number>()
  for (const s of solved.flatMap((c) => c.stickers))
    counts.set(s.color, (counts.get(s.color) ?? 0) + 1)
  return counts
}

/** The stickers' colors, of all faces at once (each face's in its order):
 *  a sticker the color of its span (`spans`) closest in hue; no color on
 *  more stickers than the puzzle has (under some light, yellow reads
 *  nearer lime): while one is, the sticker of it that turns least to
 *  another color of its span with room left takes that one. */
export function gridColors(
  faces: readonly GridFace[],
  solved: Cube,
  spans: Partial<Record<Color, number>>,
): Color[][] {
  const counts = stickerCounts(solved)
  const all = faces.flatMap((f) => f.stickers)
  const ofSpan = (span: number) => (Object.keys(spans) as Color[]).filter((c) => spans[c] === span)
  const out = all.map(({ span, lab }) => nearestHue(lab, ofSpan(span)))
  const used = (c: Color) => out.filter((x) => x === c).length
  for (let left = out.length; left > 0; left--) {
    const over = [...counts.keys()].find((c) => used(c) > counts.get(c)!)
    if (!over) break
    let best: { i: number; to: Color; cost: number } | undefined
    out.forEach((c, i) => {
      if (c !== over) return
      const { lab, span } = all[i]!
      for (const to of ofSpan(span)) {
        if (to === over || used(to) >= (counts.get(to) ?? 0)) continue
        const cost = turnTo(lab, to) - turnTo(lab, over)
        if (!best || cost < best.cost) best = { i, to, cost }
      }
    })
    if (!best) break
    out[best.i] = best.to
  }
  let at = 0
  return faces.map((f) => f.stickers.map(() => out[at++]!))
}

/** A face's canvas, `n` cells a side, its stickers in their colors, joined
 *  within, its drawing at the top left: the puzzle turned from one face to
 *  the next brings it from the picture's right (turned left, to a camera
 *  behind the user), or `fromLeft` (turned right; or left, to a camera
 *  facing the user, the gesture mirrored: `orderFor`), where tilted toward
 *  the lens it comes from the top; the picture read a quarter round so that
 *  it does. */
export function gridCanvas(
  { cols, owner }: GridFace,
  colors: readonly Color[],
  fromLeft: boolean,
  n: number,
): Canvas {
  // Row r, column c of the face upright, from the picture's.
  const turned = owner.map((_, i) => {
    const [r, c] = [Math.floor(i / cols), i % cols]
    return fromLeft ? owner[(cols - 1 - c) * cols + r]! : owner[c * cols + (cols - 1 - r)]!
  })
  const shown = turned.flatMap((o, i) => (o >= 0 ? [i] : []))
  const r0 = Math.min(...shown.map((i) => Math.floor(i / cols)))
  const c0 = Math.min(...shown.map((i) => i % cols))
  const at = (r: number, c: number) =>
    r + r0 < cols && c + c0 < cols ? turned[(r + r0) * cols + c + c0]! : -1
  const cells = Array.from({ length: n * n }, (_, i) => at(Math.floor(i / n), i % n))
  const joins: string[] = []
  cells.forEach((o, i) => {
    if (o < 0) return
    if (i % n < n - 1 && cells[i + 1] === o) joins.push(joinKey(i, i + 1))
    if (i + n < n * n && cells[i + n] === o) joins.push(joinKey(i, i + n))
  })
  return { cells: cells.map((o) => (o < 0 ? 'absent' : colors[o]!)), joins }
}
