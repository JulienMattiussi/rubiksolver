import type { P2 } from '../../core/plane'
import { apply, fitPerspective, scaleOf, type PlaneMap } from './outlineFit'
import { lightAt } from './outlineMatch'
import type { Picture } from './outlines'

/**
 * The fit of a puzzle read by its outlines set right by its seams (pure):
 * the lines along which it is always cut, whatever its state (the Floppy
 * Ghost's five pentagram lines, across the whole plate), a dark band
 * between two light stickers. Each is looked for across where the anchor's
 * fit puts it, and the fit is made again on where they were found, in
 * perspective: they reach far from the anchor, where a pixel's error on
 * its corners would have grown, and tell a puzzle held tilted.
 * A stretch of seam that does not show (past the puzzle's edge, under a
 * finger) is left out.
 */

/** A point of a seam where it was found: in the model, on the picture. */
export interface SeamPoint {
  readonly model: P2
  readonly seen: P2
}

/** Pixels between two points looked for along a seam, and how far across
 *  a seam is looked for each way. */
const STEP = 4
const ACROSS = 8
/** How many passes, and the fewest points found to fit again on. */
const PASSES = 3
const FEWEST = 20
/** How far off the fit a point is left out: a few pixels, or twice as
 *  far as most. */
const OFF_PX = 1.5
const OFF_SPREAD = 2

/** The mean lightness across a stretch of a line (from `t0` to `t1`
 *  pixels along `n` from `q`), none off the picture. */
function meanAcross(picture: Picture, q: P2, n: P2, t0: number, t1: number) {
  let [sum, count] = [0, 0]
  for (let t = t0; t <= t1; t += 0.5) {
    const l = lightAt(picture, [q[0] + n[0] * t, q[1] + n[1] * t])
    if (l === undefined) return undefined
    sum += l
    count++
  }
  return sum / count
}

/** Where a seam crosses the line through `q` along `n`: the dark band
 *  `band` pixels wide, light on either side, nearest the darkest; none if
 *  no such band shows. */
function seamAcross(picture: Picture, q: P2, n: P2, band: number, contrast: number) {
  let best: { t: number; depth: number } | undefined
  const side = Math.max(2, band / 2)
  for (let t = -ACROSS; t <= ACROSS; t += 0.5) {
    const dark = meanAcross(picture, q, n, t - band / 2, t + band / 2)
    const before = meanAcross(picture, q, n, t - band / 2 - side, t - band / 2)
    const after = meanAcross(picture, q, n, t + band / 2, t + band / 2 + side)
    if (dark === undefined || before === undefined || after === undefined) continue
    const depth = Math.min(before, after) - dark
    if (depth > contrast / 2 && (!best || depth > best.depth)) best = { t, depth }
  }
  return best?.t
}

/** The seams found on the picture where `map` puts them. */
function findSeams(
  picture: Picture,
  map: PlaneMap,
  seams: readonly (readonly [P2, P2])[],
  width: number,
  contrast: number,
): SeamPoint[] {
  const scale = scaleOf(map)
  const found: SeamPoint[] = []
  for (const [a, b] of seams) {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1])
    const count = Math.round((length * scale) / STEP)
    // Across the seam, on the picture.
    const [mx, my] = [-(b[1] - a[1]) / length, (b[0] - a[0]) / length]
    for (let k = 0; k <= count; k++) {
      const model: P2 = [a[0] + ((b[0] - a[0]) * k) / count, a[1] + ((b[1] - a[1]) * k) / count]
      const q = apply(map, model)
      const r = apply(map, [model[0] + mx, model[1] + my])
      const across = Math.hypot(r[0] - q[0], r[1] - q[1])
      const n: P2 = [(r[0] - q[0]) / across, (r[1] - q[1]) / across]
      const t = seamAcross(picture, q, n, width * scale, contrast)
      if (t !== undefined) found.push({ model, seen: [q[0] + n[0] * t, q[1] + n[1] * t] })
    }
  }
  return found
}

/** The fit made again on the seams, a few passes (each finds them nearer
 *  where they are), and the seams last found. */
export function fitSeams(
  picture: Picture,
  map: PlaneMap,
  seams: readonly (readonly [P2, P2])[],
  width: number,
  contrast: number,
): { map: PlaneMap; seams: SeamPoint[] } {
  let found: SeamPoint[] = []
  for (let pass = 0; pass < PASSES; pass++) {
    found = findSeams(picture, map, seams, width, contrast)
    if (found.length < FEWEST) break
    map = fitOn(found) ?? map
    // Fitted again without the points far off it: where a bump of the
    // black body (the Ghost's, midway along its pentagon's sides) bulges
    // out of the seam, or another dark line lay near.
    const off = found.map((p) => {
      const [x, y] = apply(map, p.model)
      return Math.hypot(x - p.seen[0], y - p.seen[1])
    })
    const limit = Math.max(OFF_PX, OFF_SPREAD * [...off].sort((a, b) => a - b)[off.length >> 1]!)
    const near = found.filter((_, i) => off[i]! <= limit)
    if (near.length < FEWEST) continue
    found = near
    map = fitOn(found) ?? map
  }
  return { map, seams: found }
}

/** The perspective through the seams found. */
const fitOn = (found: readonly SeamPoint[]) =>
  fitPerspective(
    found.map((p) => p.model),
    found.map((p) => p.seen),
  )
