import { inset, inside, type P2 } from '../../core/plane'
import { apply, scaleOf, type PlaneMap } from './outlineFit'
import type { Picture } from './outlines'

/**
 * How well a pose of a piece (its sticker where it would stand) matches
 * its picture (pure). Each of its sticker's sides is probed: light just
 * inside (the silver), dark just outside (its black frame, probed half way
 * across, however thick it is there). Each probe weighs two neighboring
 * pixels against each other, so a shade over the puzzle, or a light from
 * one side, darkens both alike and changes nothing. A pose smaller than
 * the sticker there finds its outside as light as a sticker; a pose that
 * would straddle a seam finds a black band inside. A pose may slide a few
 * pixels, the error the fit leaves far from the anchor.
 */

/** A picture's lightness at a point between pixels (bilinear), none off it. */
export function lightAt({ width, height, light }: Picture, [x, y]: P2): number | undefined {
  const [fx, fy] = [x - 0.5, y - 0.5]
  const [x0, y0] = [Math.floor(fx), Math.floor(fy)]
  if (x0 < 0 || y0 < 0 || x0 + 1 >= width || y0 + 1 >= height) return undefined
  const [tx, ty] = [fx - x0, fy - y0]
  const i = y0 * width + x0
  return (
    (light[i]! * (1 - tx) + light[i + 1]! * tx) * (1 - ty) +
    (light[i + width]! * (1 - tx) + light[i + width + 1]! * tx) * ty
  )
}

/** A pose's probes on the picture: pairs of points either side of its
 *  sticker's sides, and points inside it. */
export interface Probes {
  readonly inner: readonly P2[]
  readonly outer: readonly P2[]
  readonly within: readonly P2[]
}

/** Pixels between two probes along a side, and between two inside. */
const SIDE_STEP = 3
const WITHIN_STEP = 6
/** A side's ends left out (a share of it): its corners blur. */
const END = 0.1

/** How far from a point inside a convex polygon its edge lies along `n`. */
function toEdge(polygon: readonly P2[], [x, y]: P2, [nx, ny]: P2): number {
  let far = Infinity
  polygon.forEach((a, i) => {
    const b = polygon[(i + 1) % polygon.length]!
    // Outward normal of a counterclockwise edge, and how fast `n` nears it.
    const [ex, ey] = [b[1] - a[1], a[0] - b[0]]
    const speed = nx * ex + ny * ey
    if (speed <= 1e-12) return
    far = Math.min(far, ((a[0] - x) * ex + (a[1] - y) * ey) / speed)
  })
  return far
}

/** A pose's probes (its outline and its sticker in the model,
 *  counterclockwise), `depth` model units into its sticker, and half way
 *  across its black frame (`depth` at most). */
export function probesOf(
  outline: readonly P2[],
  sticker: readonly P2[],
  map: PlaneMap,
  depth: number,
): Probes {
  const [inner, outer, within]: [P2[], P2[], P2[]] = [[], [], []]
  const scale = scaleOf(map)
  // An inner probe stays inside: near a sharp corner, a point that deep
  // in from one side would cross the other.
  const deep = inset(sticker, 0.9 * depth)
  sticker.forEach((a, i) => {
    const b = sticker[(i + 1) % sticker.length]!
    const length = Math.hypot(b[0] - a[0], b[1] - a[1])
    // Counterclockwise: the inside on the left.
    const [nx, ny] = [-(b[1] - a[1]) / length, (b[0] - a[0]) / length]
    const count = Math.max(2, Math.round((length * scale) / SIDE_STEP))
    for (let k = 0; k <= count; k++) {
      const t = END + ((1 - 2 * END) * k) / count
      const [x, y] = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]
      const p: P2 = [x + nx * depth, y + ny * depth]
      if (!inside(deep, p)) continue
      const across = Math.min(depth, toEdge(outline, [x, y], [-nx, -ny]) / 2)
      inner.push(apply(map, p))
      outer.push(apply(map, [x - nx * across, y - ny * across]))
    }
  })
  // Inside, kept off the sides (a thin sticker may have none).
  const core = inset(sticker, 2 * depth)
  const unit = WITHIN_STEP / scale
  const xs = core.map((p) => p[0])
  const ys = core.map((p) => p[1])
  for (let x = Math.min(...xs); x <= Math.max(...xs); x += unit)
    for (let y = Math.min(...ys); y <= Math.max(...ys); y += unit)
      if (inside(core, [x, y])) within.push(apply(map, [x, y]))
  return { inner, outer, within }
}

/** How a pose matched: its cost (0 at best, 3 at worst) and the slide
 *  that matched best. */
export interface Match {
  readonly cost: number
  readonly shift: P2
}

/** A probe's lightness, slid. */
const at = (picture: Picture, p: P2, [dx, dy]: P2) => lightAt(picture, [p[0] + dx, p[1] + dy])

/** How well its sides show, slid by `shift`: from 1 (every probe light
 *  inside, dark outside by `contrast`) to -1; and how light inside. */
function sidesScore(picture: Picture, probes: Probes, shift: P2, contrast: number) {
  let [score, inLight, count] = [0, 0, 0]
  probes.inner.forEach((p, i) => {
    const l = at(picture, p, shift)
    const o = at(picture, probes.outer[i]!, shift)
    // Off the picture: no help, no harm.
    if (l === undefined || o === undefined) return
    score += Math.max(-1, Math.min(1, (l - o) / contrast))
    inLight += l
    count++
  })
  return count ? { score: score / count, inLight: inLight / count } : { score: -1, inLight: 0 }
}

/** The share of points whose lightness `wrong` says is not what it should be. */
function share(picture: Picture, points: readonly P2[], shift: P2, wrong: (l: number) => boolean) {
  if (!points.length) return 0
  let count = 0
  for (const p of points) {
    const l = at(picture, p, shift)
    if (l !== undefined && wrong(l)) count++
  }
  return count / points.length
}

/** A pose matched on the picture, slid up to `reach` pixels each way (in
 *  steps of `step`) where it matches best. */
export function matchPose(
  picture: Picture,
  probes: Probes,
  contrast: number,
  reach: number,
  step: number,
): Match {
  let best = { score: -Infinity, shift: [0, 0] as P2, inLight: 0 }
  for (let dx = -reach; dx <= reach + 1e-9; dx += step)
    for (let dy = -reach; dy <= reach + 1e-9; dy += step) {
      const shift: P2 = [dx, dy]
      const seen = sidesScore(picture, probes, shift, contrast)
      if (seen.score > best.score) best = { ...seen, shift }
    }
  // Inside, nothing as dark as a black frame across it; outside, nothing
  // as light as a sticker (a pose smaller than the one there).
  const half = best.inLight - contrast / 2
  const dark = share(picture, probes.within, best.shift, (l) => l < half)
  const light = share(picture, probes.outer, best.shift, (l) => l > half)
  return { cost: (1 - best.score) / 2 + dark + light, shift: best.shift }
}

/** The contrast between a sticker and its black frame on this picture:
 *  the median of a pose's probes (the anchor's, surely there). */
export function contrastOf(picture: Picture, probes: Probes): number {
  const gaps = probes.inner
    .map((p, i) => {
      const [l, o] = [lightAt(picture, p), lightAt(picture, probes.outer[i]!)]
      return l === undefined || o === undefined ? undefined : l - o
    })
    .filter((g): g is number => g !== undefined)
    .sort((a, b) => a - b)
  return gaps[gaps.length >> 1] ?? 0
}
