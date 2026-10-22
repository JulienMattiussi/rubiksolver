import type { Cube, Cubie } from '../../core/types'
import { inset, inside, type P2 } from '../../core/plane'

/**
 * A puzzle read from one picture by the outlines of its pieces, not their
 * colors (pure): a Floppy Ghost, all silver, each piece a sticker framed by
 * its black body. The picture is split into light (a sticker) and dark (a
 * body, a seam) by a threshold its lightness sets (Otsu); the piece that
 * never moves (its anchor, the Ghost's pentagon) is the light patch round
 * the frame's middle, which says where the puzzle stands, how big, and how
 * turned (but for its own symmetry). Each way it may then be held, each
 * pose of a piece (its outline where it stands) scores the picture: light
 * where its sticker is, dark round it; a state scores the sum of its
 * pieces' (they never overlap), and every state is tried.
 */

/** How a model is read by its outlines (`PuzzleModel.scan`). */
export interface OutlineScan {
  /** Every state it can stand in. */
  readonly states: () => readonly Cube[]
  /** A piece's outline where it stands, seen from the front,
   *  counterclockwise, in the model's frame (its anchor's middle at the
   *  origin). */
  readonly outline: (cubie: Cubie) => readonly P2[]
  /** The piece that never moves, and its symmetry (it looks the same
   *  turned by a `order`th of a turn, or seen from the back). */
  readonly anchor: number
  readonly order: number
  /** How far a sticker lies inside its piece's outline (its black frame). */
  readonly border: number
}

/** A picture's lightness (0 to 100), row by row. */
export interface Picture {
  readonly width: number
  readonly height: number
  readonly light: ArrayLike<number>
}

export type OutlineReading = { ok: true; cube: Cube } | { ok: false }

interface Pose {
  readonly outline: readonly P2[]
  readonly sticker: readonly P2[]
  readonly box: readonly [number, number, number, number]
}

interface Poses {
  readonly poses: readonly Pose[]
  /** Each state's poses, one per piece. */
  readonly of: readonly Int32Array[]
  readonly states: readonly Cube[]
  /** Half the side of the square every pose fits in. */
  readonly reach: number
}

const POSES = new WeakMap<OutlineScan, Poses>()

/** Each piece's poses over every state (memoized). */
function posesOf(scan: OutlineScan): Poses {
  let found = POSES.get(scan)
  if (found) return found
  const ids = new Map<string, number>()
  const poses: Pose[] = []
  const states = scan.states()
  const of = states.map((cube) =>
    Int32Array.from(cube, (cubie) => {
      const outline = scan.outline(cubie)
      const key = outline.map((p) => p.map((x) => x.toFixed(4)).join()).join(';')
      let id = ids.get(key)
      if (id === undefined) {
        id = poses.length
        ids.set(key, id)
        const xs = outline.map((p) => p[0])
        const ys = outline.map((p) => p[1])
        poses.push({
          outline,
          sticker: inset(outline, scan.border),
          box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
        })
      }
      return id
    }),
  )
  const reach = Math.max(...poses.flatMap((p) => p.box.map(Math.abs)))
  found = { poses, of, states, reach }
  POSES.set(scan, found)
  return found
}

/** Where its anchor goes in a frame `size` units wide (y down): the
 *  shape marked there, which the user puts it in. */
export function outlineMark(scan: OutlineScan, size: number): P2[] {
  const { poses, of, reach } = posesOf(scan)
  const unit = size / (2 * reach)
  return poses[of[0]![scan.anchor]!]!.sticker.map(([x, y]) => [
    size / 2 + x * unit,
    size / 2 - y * unit,
  ])
}

/** Half the side of the frame a puzzle read by its outlines is shown in,
 *  in its model's units: every state fits. */
export const outlineReach = (scan: OutlineScan): number => posesOf(scan).reach

/** The lightness that best splits a picture in two (Otsu), and how light
 *  each side is on average. */
function threshold(light: ArrayLike<number>): Split {
  const bins = new Float64Array(101)
  for (let i = 0; i < light.length; i++)
    bins[Math.round(Math.min(100, Math.max(0, light[i]!)))]! += 1
  const total = light.length
  const sum = bins.reduce((s, n, l) => s + n * l, 0)
  let [below, belowSum, best] = [0, 0, -1]
  let split: Split = { cut: 50, dark: 0, light: 100 }
  for (let l = 0; l < 100; l++) {
    below += bins[l]!
    belowSum += l * bins[l]!
    const above = total - below
    if (!below || !above) continue
    const [dark, lit] = [belowSum / below, (sum - belowSum) / above]
    const spread = below * above * (lit - dark) ** 2
    if (spread > best) [best, split] = [spread, { cut: l + 0.5, dark, light: lit }]
  }
  return split
}

interface Split {
  readonly cut: number
  readonly dark: number
  readonly light: number
}

/** How light a pixel looks, from -1 (as dark as the dark side) to 1. */
function lookOf(l: number, { cut, dark, light }: Split): number {
  return l > cut ? Math.min(1, (l - cut) / (light - cut)) : Math.max(-1, (l - cut) / (cut - dark))
}

/** A polygon's area and its `order`th complex moment (its turn shows in
 *  its argument), from points on a fine grid. */
function moments(polygon: readonly P2[], order: number) {
  const xs = polygon.map((p) => p[0])
  const ys = polygon.map((p) => p[1])
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const step = Math.max(x1 - x0, y1 - y0) / 200
  const points: P2[] = []
  for (let x = x0; x <= x1; x += step)
    for (let y = y0; y <= y1; y += step) if (inside(polygon, [x, y])) points.push([x, y])
  return { area: points.length * step * step, moment: complexMoment(points, order) }
}

/** Σ (x + iy)^order, as an angle. */
function complexMoment(points: readonly P2[], order: number): number {
  let [re, im] = [0, 0]
  for (const [x, y] of points) {
    const r = Math.hypot(x, y) ** order
    const a = order * Math.atan2(y, x)
    re += r * Math.cos(a)
    im += r * Math.sin(a)
  }
  return Math.atan2(im, re)
}

/** The light patch round the picture's middle: its pixels (as points, y
 *  up, from the middle), if one. */
function middlePatch(picture: Picture, light: (i: number) => boolean): P2[] | undefined {
  const { width, height } = picture
  const [cx, cy] = [Math.floor(width / 2), Math.floor(height / 2)]
  // The light pixel nearest the middle.
  let start = -1
  for (let r = 0; r < Math.min(width, height) / 4 && start < 0; r++)
    for (let dy = -r; dy <= r && start < 0; dy++)
      for (let dx = -r; dx <= r && start < 0; dx++) {
        const i = (cy + dy) * width + cx + dx
        if (light(i)) start = i
      }
  if (start < 0) return undefined
  const seen = new Uint8Array(width * height)
  const stack = [start]
  seen[start] = 1
  const points: P2[] = []
  while (stack.length) {
    const i = stack.pop()!
    const [x, y] = [i % width, Math.floor(i / width)]
    // Touching the frame's edge: not the anchor alone.
    if (x === 0 || y === 0 || x === width - 1 || y === height - 1) return undefined
    points.push([x, y])
    for (const j of [i - 1, i + 1, i - width, i + width])
      if (!seen[j] && light(j)) {
        seen[j] = 1
        stack.push(j)
      }
  }
  return points
}

/** A puzzle read by its outlines from a picture of its front (or its
 *  back), its anchor round the middle: the state whose pieces agree best
 *  with it, however it is turned; none when no anchor shows there. */
export function readOutlines(scan: OutlineScan, picture: Picture): OutlineReading {
  const { poses, of, states, reach } = posesOf(scan)
  const split = threshold(picture.light)
  const patch = middlePatch(picture, (i) => picture.light[i]! > split.cut)
  if (!patch) return { ok: false }
  const anchor = poses[of[0]![scan.anchor]!]!
  const model = moments(anchor.sticker, scan.order)
  // Where the anchor's middle is, how many pixels a unit, how turned.
  const [cx, cy] = [
    patch.reduce((s, p) => s + p[0], 0) / patch.length,
    patch.reduce((s, p) => s + p[1], 0) / patch.length,
  ]
  const scale = Math.sqrt(patch.length / model.area)
  // Too small or too big for the anchor in its place in the frame.
  const nominal = Math.min(picture.width, picture.height) / (2 * reach)
  if (scale < nominal / 2 || scale > nominal * 2) return { ok: false }
  const seen = complexMoment(
    patch.map(([x, y]): P2 => [x - cx, cy - y]),
    scan.order,
  )

  let best: { score: number; state: number } | undefined
  for (const mirrored of [false, true]) {
    // Seen from the back, mirrored (x to -x: z^n to (-1)^n conj(z^n)).
    const base = mirrored
      ? (seen + model.moment - scan.order * Math.PI) / scan.order
      : (seen - model.moment) / scan.order
    for (let k = 0; k < scan.order; k++) {
      const turn = base + (2 * Math.PI * k) / scan.order
      const scores = scorePoses(picture, split, poses, { cx, cy, scale, turn, mirrored })
      of.forEach((ids, state) => {
        let score = 0
        for (const id of ids) score += scores[id]!
        if (!best || score > best.score) best = { score, state }
      })
    }
  }
  return best ? { ok: true, cube: states[best.state]! } : { ok: false }
}

/** What a dark pixel round a sticker weighs against a light one on it: a
 *  dark background hides a body's outer edge, never a sticker. */
const BODY = 0.5

/** How much each pose agrees with the picture, held as `at` says: each
 *  pixel it covers, light on its sticker, dark round it. */
function scorePoses(
  picture: Picture,
  split: Split,
  poses: readonly Pose[],
  at: { cx: number; cy: number; scale: number; turn: number; mirrored: boolean },
): Float64Array {
  const scores = new Float64Array(poses.length)
  const [c, s] = [Math.cos(at.turn), Math.sin(at.turn)]
  for (let y = 0; y < picture.height; y++)
    for (let x = 0; x < picture.width; x++) {
      // Back to the model: unturned, unmirrored.
      const [qx, qy] = [(x - at.cx) / at.scale, (at.cy - y) / at.scale]
      const px = c * qx + s * qy
      const p: P2 = [at.mirrored ? -px : px, -s * qx + c * qy]
      const look = lookOf(picture.light[y * picture.width + x]!, split)
      poses.forEach((pose, id) => {
        const [x0, y0, x1, y1] = pose.box
        if (p[0] < x0 || p[0] > x1 || p[1] < y0 || p[1] > y1) return
        if (inside(pose.sticker, p)) scores[id]! += look
        else if (inside(pose.outline, p)) scores[id]! -= BODY * look
      })
    }
  return scores
}
