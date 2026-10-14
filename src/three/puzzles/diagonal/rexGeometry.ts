import { normalIndex } from '@/lib/core/geometry'
import type { Cubie, Vec3 } from '@/lib/core/types'
import { face, type P3, type PiecePolygon } from '../../core/polygons'

/**
 * Geometry of the Rex Cube's pieces (see lib/puzzles/shared/rainbow.ts). Each face is cut
 * by four circles, one per corner, each through the two corners beside it
 * (they meet at the corners, so no corner piece): inside all four, the
 * center; inside three (all but the far corner's), the petal toward the
 * near corner; inside the two of an edge's ends only, that edge's half. A
 * region is traced by rays from a point inside it (each is star-shaped
 * about it), then drawn as a plate a little deep. A piece's shape only
 * depends on its slot, so it is drawn where it stands.
 */

/** Model units (a face at 4) to scene units, the cube as big as a 3x3. */
const SCALE = 1.5 / 4
/** A plate's depth, in model units (a face at 4), and the seams left
 *  around it. Thin: its sides stand square to the face, not along the cut
 *  sphere, so a deep one would sweep through its neighbors as it turns. */
const DEPTH = 0.25
const SHRINK = 0.97
const STICKER_SCALE = 0.86
const RAYS = 96

/** The two axes across a face, and where a face point (u, v in -1..1)
 *  stands in the model. */
function frame(normal: Vec3) {
  const a = normal.findIndex((x) => x !== 0)
  const [u, v] = [0, 1, 2].filter((d) => d !== a) as [number, number]
  const at = (p: readonly [number, number], depth = 0): P3 => {
    const out = [0, 0, 0] as P3
    out[a] = (4 - depth) * normal[a]!
    out[u] = 4 * p[0]
    out[v] = 4 * p[1]
    return out
  }
  return { u, v, at }
}

const CORNERS: readonly [number, number][] = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
]
/**
 * A corner's circle passes through the face's two corners beside it (the
 * cuts meet at the corners), its center out along the diagonal so that the
 * center region reaches `CENTER` along the diagonals (a face being -1..1):
 * the further out its center, the wider the circle and the gentler its
 * curve. From k + CENTER = sqrt(k² + 1), its center at k (1, 1) for the
 * corner (1, 1).
 */
const CENTER = (Math.SQRT2 - 1) / 2
const OUT = (1 - CENTER ** 2) / (2 * CENTER)
const RADIUS = Math.sqrt(2 * OUT ** 2 + 2)
const inside = (p: readonly [number, number], c: readonly [number, number]) =>
  Math.hypot(p[0] - c[0] * OUT, p[1] - c[1] * OUT) < RADIUS

/** A region, by the corners whose circles hold it, traced from `seed`. */
function region(corners: readonly (readonly [number, number])[], seed: [number, number]) {
  const want = (p: readonly [number, number]) =>
    Math.abs(p[0]) <= 1 &&
    Math.abs(p[1]) <= 1 &&
    CORNERS.every((c) => inside(p, c) === corners.some((k) => k[0] === c[0] && k[1] === c[1]))
  const points: [number, number][] = []
  for (let k = 0; k < RAYS; k++) {
    const angle = (2 * Math.PI * k) / RAYS
    const dir = [Math.cos(angle), Math.sin(angle)]
    let [lo, hi] = [0, 3]
    for (let step = 0; step < 30; step++) {
      const mid = (lo + hi) / 2
      if (want([seed[0] + dir[0]! * mid, seed[1] + dir[1]! * mid])) lo = mid
      else hi = mid
    }
    points.push([seed[0] + dir[0]! * lo, seed[1] + dir[1]! * lo])
  }
  return points
}

/** The face regions a piece covers: a normal and the region on it. */
function regionsOf(position: Vec3): { normal: Vec3; points: [number, number][] }[] {
  const nonzero = [0, 1, 2].filter((d) => position[d] !== 0)
  const normalAlong = (d: number) => {
    const n = [0, 0, 0] as [number, number, number]
    n[d] = Math.sign(position[d]!)
    return n
  }
  if (nonzero.length === 1) {
    // A center: inside all four circles.
    return [{ normal: normalAlong(nonzero[0]!), points: region(CORNERS, [0, 0]) }]
  }
  const faces = nonzero.filter((d) => Math.abs(position[d]!) === 4)
  if (faces.length === 1) {
    // A petal: all but the far corner's circle.
    const normal = normalAlong(faces[0]!)
    const { u, v } = frame(normal)
    const near: [number, number] = [Math.sign(position[u]!), Math.sign(position[v]!)]
    const corners = CORNERS.filter((c) => c[0] !== -near[0] || c[1] !== -near[1])
    return [{ normal, points: region(corners, [near[0] * 0.75, near[1] * 0.75]) }]
  }
  // An edge: on each of its two faces, its ends' circles only.
  return nonzero.map((d) => {
    const normal = normalAlong(d)
    const { u, v } = frame(normal)
    const side: [number, number] = [Math.sign(position[u]!), Math.sign(position[v]!)]
    const ends = CORNERS.filter((c) => (side[0] ? c[0] === side[0] : c[1] === side[1]))
    return { normal, points: region(ends, [side[0] * 0.95, side[1] * 0.95]) }
  })
}

const SHAPES = new Map<string, ReturnType<typeof regionsOf>>()

/** Every polygon of a Rex piece, as it stands: per face region, its
 *  plate (sticker on a body) with sides and a bottom. */
export function rexPolygons(cubie: Cubie): PiecePolygon[] {
  const id = cubie.position.join()
  let regions = SHAPES.get(id)
  if (!regions) {
    regions = regionsOf(cubie.position)
    SHAPES.set(id, regions)
  }
  return regions.flatMap(({ normal, points }) => {
    const { at } = frame(normal)
    const cx = points.reduce((s, p) => s + p[0], 0) / points.length
    const cy = points.reduce((s, p) => s + p[1], 0) / points.length
    const shrunk = points.map(
      ([x, y]) => [cx + (x - cx) * SHRINK, cy + (y - cy) * SHRINK] as [number, number],
    )
    const scene = (p: P3): P3 => p.map((x) => x * SCALE) as P3
    const top = shrunk.map((p) => scene(at(p)))
    const bottom = shrunk.map((p) => scene(at(p, DEPTH)))
    const n = normal.map((x) => x) as P3
    const middle = [0, 1, 2].map((d) => top.reduce((s, p) => s + p[d]!, 0) / top.length)
    const sides: PiecePolygon[] = top.map((p, i) => {
      const q = top[(i + 1) % top.length]!
      // Across the side, away from the plate's middle (unit).
      const along = [0, 1, 2].map((d) => q[d]! - p[d]!)
      const across = [
        along[1]! * n[2] - along[2]! * n[1],
        along[2]! * n[0] - along[0]! * n[2],
        along[0]! * n[1] - along[1]! * n[0],
      ]
      const length = Math.hypot(...across) || 1
      const away = [0, 1, 2].reduce((s, d) => s + across[d]! * (p[d]! - middle[d]!), 0)
      const outward = across.map((x) => (away < 0 ? -x : x) / length) as P3
      return {
        points: [p, q, bottom[(i + 1) % top.length]!, bottom[i]!],
        paint: 'body',
        normal: outward,
      }
    })
    return [
      ...face(top, n, cubie, normalIndex(normal), STICKER_SCALE),
      ...sides,
      { points: [...bottom].reverse(), paint: 'body', normal: n.map((x) => -x) as P3 },
    ]
  })
}

/** The eight corners' directions, in the model. */
const DIAGONALS: readonly Vec3[] = [-1, 1].flatMap((x) =>
  [-1, 1].flatMap((y) => [-1, 1].map((z): Vec3 => [x, y, z])),
)

/**
 * A corner's cut is a sphere about its axis, the one its face circles lie
 * on: centered at OUT along the diagonal (the face being -1..1), through
 * the face circles (radius RADIUS at a face, a unit off its center).
 */
const SPHERE = Math.sqrt(RADIUS ** 2 + (OUT - 1) ** 2)
const CUT_STEPS = 80

const CUTS = new Map<string, PiecePolygon[]>()

/** The cut sphere's part inside the cube, in plastic, for the corner `d`:
 *  what a turn opens, drawn still (a sphere about the axis turns into
 *  itself), as on the Jing. */
function cutOf(d: Vec3): PiecePolygon[] {
  const center = d.map((x) => x * OUT)
  // Two directions across the axis, for the cap's angles.
  const axis = d.map((x) => -x / Math.sqrt(3))
  const across = [1, -1, 0].map((x, i) => x * d[i]!)
  const lengthA = Math.hypot(...across)
  const u = across.map((x) => x / lengthA)
  const v = [
    axis[1]! * u[2]! - axis[2]! * u[1]!,
    axis[2]! * u[0]! - axis[0]! * u[2]!,
    axis[0]! * u[1]! - axis[1]! * u[0]!,
  ]
  // How far round from the axis the cap reaches (beyond, it leaves the cube).
  const reach = Math.PI / 3
  const point = (i: number, j: number) => {
    const tilt = (reach * i) / CUT_STEPS
    const turn = (2 * Math.PI * j) / CUT_STEPS
    return [0, 1, 2].map(
      (k) =>
        center[k]! +
        SPHERE *
          (Math.cos(tilt) * axis[k]! +
            Math.sin(tilt) * (Math.cos(turn) * u[k]! + Math.sin(turn) * v[k]!)),
    )
  }
  // Under the plates only (in face units), not up into them: each patch
  // clipped to that box, so its edge runs straight along the walls.
  const under = 1 - DEPTH / 4 - 0.01
  const scene = (p: number[]): P3 => p.map((x) => x * 4 * SCALE) as P3
  const polygons: PiecePolygon[] = []
  for (let i = 0; i < CUT_STEPS; i++) {
    for (let j = 0; j < CUT_STEPS; j++) {
      const corners = clipToBox(
        [point(i, j), point(i + 1, j), point(i + 1, j + 1), point(i, j + 1)],
        under,
      )
      if (corners.length < 3) continue
      const mid = [0, 1, 2].map((k) => corners.reduce((s, p) => s + p[k]!, 0) / corners.length)
      const out = mid.map((x, k) => (x - center[k]!) / SPHERE) as P3
      polygons.push({ points: corners.map(scene), paint: 'body', normal: out })
    }
  }
  return polygons
}

/** A polygon clipped to the box |x|, |y|, |z| <= `edge`, one wall at a
 *  time (Sutherland-Hodgman). */
function clipToBox(points: number[][], edge: number): number[][] {
  let out = points
  for (let axis = 0; axis < 3; axis++) {
    for (const sign of [1, -1]) {
      const inside = (p: number[]) => sign * p[axis]! <= edge
      const next: number[][] = []
      out.forEach((p, i) => {
        const q = out[(i + 1) % out.length]!
        if (inside(p)) next.push(p)
        if (inside(p) !== inside(q)) {
          const t = (sign * edge - p[axis]!) / (q[axis]! - p[axis]!)
          next.push(p.map((x, k) => x + (q[k]! - x) * t))
        }
      })
      out = next
      if (out.length === 0) return out
    }
  }
  return out
}

/** What a Rex turn opens: the cut sphere of the corner whose pieces turn. */
export function rexCut(moving: readonly Cubie[]): PiecePolygon[] {
  const d = DIAGONALS.find((c) =>
    moving.every((p) => p.position[0] * c[0] + p.position[1] * c[1] + p.position[2] * c[2] >= 4),
  )
  if (!d) return []
  const id = d.join()
  let cut = CUTS.get(id)
  if (!cut) {
    cut = cutOf(d)
    CUTS.set(id, cut)
  }
  return cut
}
