/**
 * A mirror cube's face read by the sizes of its stickers (pure): the
 * rectangles found on its picture (workers/stickersWorker.ts, OpenCV) set
 * in their places round its center, which the user put in the frame's
 * marked cell. Its cuts are planes, so every sticker leans on the center's
 * lines: an edge's against one of its sides, along it; a corner's past two
 * of them, against both. Each rectangle goes to one place at most, the
 * closest first; a place none fits stays unmeasured (a sticker whose black
 * frame is broken, which the reading deduces).
 */

/** A rectangle on a picture: left, top, width, height (pixels). */
export type Rect = readonly [number, number, number, number]

/** A place round the center: its row (-1 top) and column (-1 left). */
export type Slot = readonly [number, number]

/** A face's stickers as placed: each place's rectangle, the center's
 *  first; none without a center at the marked point. */
export type Placed = ReadonlyMap<string, Rect>

export const slotKey = ([r, k]: Slot): string => `${r},${k}`

const EDGES: Slot[] = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
]
const CORNERS: Slot[] = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
]

/** How far past the center's line a sticker may start (the seam, the
 *  perspective), in its widths. */
const REACH = 0.35
/** How much of the center's side an edge's sticker must run along. */
const ALONG = 0.6

/** Between two neighbors, the share of the room each seam takes (two black
 *  frames): a center's sticker is some three quarters of it. */
const SEAM = 0.13

/** The center when none was found at the marked point (a glint, ink, a
 *  scratch broke it): the room its neighbors leave round the point, less
 *  a seam on each side, square; none if no two neighbors face each other
 *  across it. */
function centerAround(
  rects: readonly Rect[],
  [px, py]: readonly [number, number],
): Rect | undefined {
  const across = (r: Rect) => r[1] <= py && py <= r[1] + r[3]
  const along = (r: Rect) => r[0] <= px && px <= r[0] + r[2]
  const most = (values: number[], pick: (...v: number[]) => number) =>
    values.length ? pick(...values) : undefined
  const left = most(
    rects.filter((r) => across(r) && r[0] + r[2] <= px).map((r) => r[0] + r[2]),
    Math.max,
  )
  const right = most(
    rects.filter((r) => across(r) && r[0] >= px).map((r) => r[0]),
    Math.min,
  )
  const top = most(
    rects.filter((r) => along(r) && r[1] + r[3] <= py).map((r) => r[1] + r[3]),
    Math.max,
  )
  const bottom = most(
    rects.filter((r) => along(r) && r[1] >= py).map((r) => r[1]),
    Math.min,
  )
  const span =
    left !== undefined && right !== undefined
      ? right - left
      : top !== undefined && bottom !== undefined
        ? bottom - top
        : undefined
  if (span === undefined) return undefined
  const [seam, side] = [SEAM * span, (1 - 2 * SEAM) * span]
  // Each axis from a neighbor past the seam, or round the point.
  const start = (near: number | undefined, far: number | undefined, at: number) =>
    near !== undefined ? near + seam : far !== undefined ? far - seam - side : at - side / 2
  return [start(left, right, px), start(top, bottom, py), side, side]
}

const overlap = (a0: number, a1: number, b0: number, b1: number) =>
  Math.max(0, Math.min(a1, b1) - Math.max(a0, b0))

/** The stickers of a face set in their places round the center at `at`
 *  (the marked cell's middle). */
export function placeStickers(rects: readonly Rect[], at: readonly [number, number]): Placed {
  const holds = ([x, y, w, h]: Rect) => x <= at[0] && at[0] <= x + w && y <= at[1] && at[1] <= y + h
  const center =
    rects.filter(holds).sort((a, b) => a[2] * a[3] - b[2] * b[3])[0] ?? centerAround(rects, at)
  const placed = new Map<string, Rect>()
  if (!center) return placed
  placed.set(slotKey([0, 0]), center)
  const [X0, Y0] = [center[0], center[1]]
  const [X1, Y1] = [X0 + center[2], Y0 + center[3]]
  const reach = REACH * center[2]
  const free = rects.filter((r) => r !== center)
  const take = (slot: Slot, cost: (r: Rect) => number) => {
    let best: { r: Rect; c: number } | undefined
    for (const r of free) {
      const c = cost(r)
      if (Number.isFinite(c) && (!best || c < best.c)) best = { r, c }
    }
    if (!best) return
    placed.set(slotKey(slot), best.r)
    free.splice(free.indexOf(best.r), 1)
  }
  // How far a rectangle starts past the center's line on a side.
  const gapX = ([x, , w]: Rect, k: number) => (k > 0 ? x - X1 : X0 - (x + w))
  const gapY = ([, y, , h]: Rect, r: number) => (r > 0 ? y - Y1 : Y0 - (y + h))
  const near = (g: number) => g >= -5 && g <= reach
  for (const [r, k] of EDGES) {
    take([r, k], (rect) => {
      const g = k ? gapX(rect, k) : gapY(rect, r)
      const along = k
        ? overlap(rect[1], rect[1] + rect[3], Y0, Y1) / (Y1 - Y0)
        : overlap(rect[0], rect[0] + rect[2], X0, X1) / (X1 - X0)
      return near(g) && along >= ALONG ? g + (1 - along) * center[2] : Infinity
    })
  }
  for (const [r, k] of CORNERS) {
    take([r, k], (rect) => {
      const [gx, gy] = [gapX(rect, k), gapY(rect, r)]
      return near(gx) && near(gy) ? gx + gy : Infinity
    })
  }
  return placed
}

/** What a face's stickers measure, in the center's sizes (the middle
 *  layers): each place's width and height, the middle ones left out (they
 *  are the center's own). */
export function stickerSizes(placed: Placed): Map<string, readonly [number | null, number | null]> {
  const center = placed.get(slotKey([0, 0]))
  const out = new Map<string, readonly [number | null, number | null]>()
  if (!center) return out
  for (const [key, [, , w, h]] of placed) {
    const [r, k] = key.split(',').map(Number) as [number, number]
    if (!r && !k) continue
    out.set(key, [k ? w / center[2] : null, r ? h / center[3] : null])
  }
  return out
}
