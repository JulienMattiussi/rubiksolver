import type { P2 } from '../../core/plane'
import type { Picture } from './outlines'

/**
 * The anchor of a puzzle read by its outlines found on its picture (pure):
 * the Floppy Ghost's pentagon, the one piece that never moves, a light
 * patch round the picture's middle. Its sides are fitted as straight
 * lines on the patch's border, so its corners land between pixels, and a
 * corner the light rounds off is found all the same (where its two sides
 * meet).
 */

/** The anchor as seen: its corners (pixels, y down), counterclockwise as
 *  seen (y up), and its middle. */
export interface AnchorSeen {
  readonly corners: readonly P2[]
  readonly middle: P2
}

/** The lightness that best splits some values in two (Otsu). */
function splitLight(values: ArrayLike<number>): number {
  const bins = new Float64Array(101)
  for (let i = 0; i < values.length; i++)
    bins[Math.round(Math.min(100, Math.max(0, values[i]!)))]! += 1
  const total = values.length
  const sum = bins.reduce((s, n, l) => s + n * l, 0)
  let [below, belowSum, best, cut] = [0, 0, -1, 50]
  for (let l = 0; l < 100; l++) {
    below += bins[l]!
    belowSum += l * bins[l]!
    const above = total - below
    if (!below || !above) continue
    const spread = below * above * ((sum - belowSum) / above - belowSum / below) ** 2
    if (spread > best) [best, cut] = [spread, l + 0.5]
  }
  return cut
}

/** The light patch round the picture's middle, light as the middle half
 *  of the picture splits it (the shade of the room left out): each of its
 *  pixels, or none if it reaches the picture's border. */
function middlePatch({ width, height, light }: Picture): Uint8Array | undefined {
  const window: number[] = []
  for (let y = height >> 2; y < (3 * height) >> 2; y++)
    for (let x = width >> 2; x < (3 * width) >> 2; x++) window.push(light[y * width + x]!)
  const cut = splitLight(window)
  const lit = (i: number) => light[i]! > cut
  const [cx, cy] = [width >> 1, height >> 1]
  let start = -1
  for (let r = 0; r < Math.min(width, height) / 8 && start < 0; r++)
    for (let dy = -r; dy <= r && start < 0; dy++)
      for (let dx = -r; dx <= r && start < 0; dx++)
        if (lit((cy + dy) * width + cx + dx)) start = (cy + dy) * width + cx + dx
  if (start < 0) return undefined
  const patch = new Uint8Array(width * height)
  patch[start] = 1
  const stack = [start]
  while (stack.length) {
    const i = stack.pop()!
    const [x, y] = [i % width, Math.floor(i / width)]
    if (x === 0 || y === 0 || x === width - 1 || y === height - 1) return undefined
    for (const j of [i - 1, i + 1, i - width, i + width])
      if (!patch[j] && lit(j)) {
        patch[j] = 1
        stack.push(j)
      }
  }
  return patch
}

/** The convex hull of points (monotone chain), counterclockwise in their
 *  own frame. */
function hull(points: readonly P2[]): P2[] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o: P2, a: P2, b: P2) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const half = (list: readonly P2[]) => {
    const out: P2[] = []
    for (const p of list) {
      while (out.length >= 2 && cross(out[out.length - 2]!, out[out.length - 1]!, p) <= 0) out.pop()
      out.push(p)
    }
    out.pop()
    return out
  }
  return [...half(sorted), ...half([...sorted].reverse())]
}

/** A convex polygon cut down to `n` corners, its gentlest turns merged
 *  away first. */
function cornersOf(polygon: readonly P2[], n: number): P2[] {
  const out = [...polygon]
  const turn = (i: number) => {
    const a = out[(i + out.length - 1) % out.length]!
    const p = out[i]!
    const b = out[(i + 1) % out.length]!
    const d = Math.atan2(b[1] - p[1], b[0] - p[0]) - Math.atan2(p[1] - a[1], p[0] - a[0])
    return Math.abs(Math.atan2(Math.sin(d), Math.cos(d)))
  }
  while (out.length > n) {
    let [gentlest, least] = [0, Infinity]
    for (let i = 0; i < out.length; i++) {
      const t = turn(i)
      if (t < least) [gentlest, least] = [i, t]
    }
    out.splice(gentlest, 1)
  }
  return out
}

/** A line through points (least squares, both ways): a point on it and
 *  its direction. */
function fitLine(points: readonly P2[]): { at: P2; dir: P2 } {
  const [mx, my] = [
    points.reduce((s, p) => s + p[0], 0) / points.length,
    points.reduce((s, p) => s + p[1], 0) / points.length,
  ]
  let [xx, xy, yy] = [0, 0, 0]
  for (const [x, y] of points) {
    xx += (x - mx) ** 2
    xy += (x - mx) * (y - my)
    yy += (y - my) ** 2
  }
  const angle = Math.atan2(2 * xy, xx - yy) / 2
  return { at: [mx, my], dir: [Math.cos(angle), Math.sin(angle)] }
}

function meet(a: { at: P2; dir: P2 }, b: { at: P2; dir: P2 }): P2 | undefined {
  const cross = a.dir[0] * b.dir[1] - a.dir[1] * b.dir[0]
  if (Math.abs(cross) < 1e-6) return undefined
  const t = ((b.at[0] - a.at[0]) * b.dir[1] - (b.at[1] - a.at[1]) * b.dir[0]) / cross
  return [a.at[0] + t * a.dir[0], a.at[1] + t * a.dir[1]]
}

/** How far from its corners a side's border pixels are kept to fit it,
 *  as a share of its length, and how far off its line. */
const CORNER_SHARE = 0.15
const OFF_LINE = 0.12
/** How many pixels inside a side's line a border pixel is a dent. */
const DENT = 1.5
/** How unequal the anchor's sides may look (a puzzle held aslant). */
const UNEQUAL = 1.6

/** The anchor, an `n`-sided convex polygon round the picture's middle,
 *  if one shows there. */
export function findAnchor(picture: Picture, n: number): AnchorSeen | undefined {
  const { width, height } = picture
  const patch = middlePatch(picture)
  if (!patch) return undefined
  // Its border: its pixels beside one out of it, at their middles.
  const border: P2[] = []
  for (let i = 0; i < patch.length; i++)
    if (patch[i] && (!patch[i - 1] || !patch[i + 1] || !patch[i - width] || !patch[i + width]))
      border.push([(i % width) + 0.5, Math.floor(i / width) + 0.5])
  if (border.length < 8 * n) return undefined
  const rough = cornersOf(hull(border), n)
  if (rough.length < n) return undefined
  const middle: P2 = [
    rough.reduce((s, p) => s + p[0], 0) / n,
    rough.reduce((s, p) => s + p[1], 0) / n,
  ]
  // Each side fitted on the border pixels along it, away from its corners,
  // then pushed out half a pixel (the pixels lie inside the sticker's edge).
  const lines = rough.map((a, i) => {
    const b = rough[(i + 1) % n]!
    const length = Math.hypot(b[0] - a[0], b[1] - a[1])
    const [ux, uy] = [(b[0] - a[0]) / length, (b[1] - a[1]) / length]
    const near = border.filter(([x, y]) => {
      const along = (x - a[0]) * ux + (y - a[1]) * uy
      const off = Math.abs((x - a[0]) * uy - (y - a[1]) * ux)
      return along > CORNER_SHARE * length && along < (1 - CORNER_SHARE) * length
        ? off < OFF_LINE * length
        : false
    })
    let line = near.length >= 3 ? fitLine(near) : { at: a, dir: [ux, uy] as P2 }
    const outward = (l: typeof line): P2 => {
      const [nx, ny] = [l.dir[1], -l.dir[0]]
      return (l.at[0] - middle[0]) * nx + (l.at[1] - middle[1]) * ny < 0 ? [-nx, -ny] : [nx, ny]
    }
    // Fitted again without the pixels well inside it: a reflection that
    // dents the patch does not pull its side in.
    for (let pass = 0; pass < 2; pass++) {
      const [nx, ny] = outward(line)
      const kept = near.filter(([x, y]) => (x - line.at[0]) * nx + (y - line.at[1]) * ny > -DENT)
      if (kept.length >= 3) line = fitLine(kept)
    }
    const [nx, ny] = outward(line)
    return { at: [line.at[0] + nx / 2, line.at[1] + ny / 2] as P2, dir: line.dir }
  })
  const corners: P2[] = []
  for (let i = 0; i < n; i++) {
    const p = meet(lines[(i + n - 1) % n]!, lines[i]!)
    if (!p || p[0] < 0 || p[1] < 0 || p[0] > width || p[1] > height) return undefined
    corners.push(p)
  }
  const sides = corners.map((a, i) => {
    const b = corners[(i + 1) % n]!
    return Math.hypot(b[0] - a[0], b[1] - a[1])
  })
  if (Math.max(...sides) > UNEQUAL * Math.min(...sides)) return undefined
  // Counterclockwise as seen (y up).
  const angle = (p: P2) => Math.atan2(middle[1] - p[1], p[0] - middle[0])
  return { corners: corners.sort((a, b) => angle(a) - angle(b)), middle }
}
