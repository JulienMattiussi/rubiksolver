import { normalIndex } from '@/lib/core/geometry'
import type { Cubie, Vec3 } from '@/lib/core/types'
import { colorFacing, type P3, type PiecePolygon } from '../../core/polygons'
import { IVY_CORNERS } from '@/lib/puzzles/shared/skewbs'
import { RAINBOW_CORNERS } from '@/lib/puzzles/shared/rainbow'
import { faceAxes, onFace } from './faceFan'

/**
 * Geometry of the Ivy Cube (lib/puzzles/shared/skewbs.ts), drawn on the
 * cube |x|, |y|, |z| <= 1. On each face, its two corners stand at two
 * opposite corners of the square; each is the part of the face beyond the
 * circle of radius 2 about the other one (a curved triangle, its tips at the
 * square's two other corners). What is left between them, inside both
 * circles, is the center's leaf. A corner is drawn as a fan from its corner
 * of the square, a leaf from its middle (the drawing takes convex
 * polygons), each body under its sticker. What a corner's turn takes is
 * the part of the cube within the sphere of radius 2 about it (its arcs on
 * the faces): the spheres' caps inside the cube, in plastic, close the cuts,
 * each part carried by the piece that holds that place (`capsOf`).
 */

/** Model units to scene units, as the Skewb's. */
const SCENE = 1.5
const STICKER_SCALE = 0.86
const BODY_SCALE = 1
const LIFT = 0.004
/** Steps along a quarter circle. */
const STEPS = 40
/** A cap's steps round its axis, and toward its rim; how many times a
 *  triangle across the edge of another corner's sphere is cut in four. */
const ROUND = 40
const RINGS = 10
const SPLITS = 3
/** The sign its corners' coordinates multiply to. */
const IVY_SIGN = RAINBOW_CORNERS[IVY_CORNERS[0]!].reduce((p, x) => p * x, 1)

type UV = readonly [number, number]

/** The quarter circle of radius 2 about `c`, from `p` to `q`, both on it. */
function arc(c: UV, p: UV, q: UV): UV[] {
  const from = Math.atan2(p[1] - c[1], p[0] - c[0])
  let turn = Math.atan2(q[1] - c[1], q[0] - c[0]) - from
  if (turn > Math.PI) turn -= 2 * Math.PI
  if (turn < -Math.PI) turn += 2 * Math.PI
  return Array.from({ length: STEPS + 1 }, (_, k): UV => {
    const angle = from + (turn * k) / STEPS
    return [c[0] + 2 * Math.cos(angle), c[1] + 2 * Math.sin(angle)]
  })
}

/** A piece's region on a face, where it stands: the point its fan goes
 *  round, and the ring of its outline (a corner's open, from one tip to
 *  the other). */
function regionOf(position: Vec3, normal: Vec3): { apex: UV; ring: UV[]; closed: boolean } {
  const { axis, a, b } = faceAxes(normal)
  if (position.every((v) => v !== 0)) {
    const [u, v] = [position[a]!, position[b]!]
    return { apex: [u, v], ring: arc([-u, -v], [u, -v], [-u, v]), closed: false }
  }
  // The face's corners: their coordinates multiplying to the set's sign,
  // so the ones across it multiply to its own sign times that.
  const n = normal[axis]! * IVY_SIGN
  const [near, far, tip1, tip2]: UV[] = [
    [1, n],
    [-1, -n],
    [1, -n],
    [-1, n],
  ]
  return {
    apex: [0, 0],
    ring: [...arc(far!, tip1!, tip2!).slice(0, -1), ...arc(near!, tip2!, tip1!).slice(0, -1)],
    closed: true,
  }
}

/** A region as a fan of triangles about its apex, shrunk by `scale` about
 *  its middle, lifted off the face. */
function fan(region: ReturnType<typeof regionOf>, normal: Vec3, scale: number, lift: number) {
  const { apex, ring, closed } = region
  const all = [apex, ...ring]
  const middle = [0, 1].map((i) => all.reduce((s, p) => s + p[i]!, 0) / all.length)
  const clamp = (x: number) => Math.max(-1, Math.min(1, x))
  const at = ([u, v]: UV): P3 =>
    onFace(
      normal,
      clamp(middle[0]! + (u - middle[0]!) * scale),
      clamp(middle[1]! + (v - middle[1]!) * scale),
      lift,
      SCENE,
    )
  const steps = closed ? ring.length : ring.length - 1
  return Array.from({ length: steps }, (_, i) => [
    at(apex),
    at(ring[i]!),
    at(ring[(i + 1) % ring.length]!),
  ])
}

/** How far from the square's corners a corner's sticker stops: its two
 *  tips, too thin to hold, left to the plastic (alone in the air once the
 *  leaf beside them turns away). A leaf keeps its own. */
const TIP = 0.4

/** A corner's region without its tips: its ring's points near a corner of
 *  the square dropped (a leaf's, as it is). */
const trimmed = (region: ReturnType<typeof regionOf>): ReturnType<typeof regionOf> =>
  region.closed
    ? region
    : {
        ...region,
        ring: region.ring.filter(([u, v]) => Math.hypot(1 - Math.abs(u), 1 - Math.abs(v)) > TIP),
      }

const unit = (normal: Vec3) => normal.map((v) => v + 0) as unknown as P3

const scaled = (v: readonly number[], k: number): P3 => [v[0]! * k, v[1]! * k, v[2]! * k]
const norm = (v: readonly number[]): P3 => scaled(v, 1 / Math.hypot(...v))
const sum = (...vs: (readonly number[])[]): P3 =>
  [0, 1, 2].map((a) => vs.reduce((s, v) => s + v[a]!, 0)) as P3
const crossed = (a: readonly number[], b: readonly number[]): P3 => [
  a[1]! * b[2]! - a[2]! * b[1]!,
  a[2]! * b[0]! - a[0]! * b[2]!,
  a[0]! * b[1]! - a[1]! * b[0]!,
]

/** The corners' places (they never leave them). */
const CORNERS: readonly Vec3[] = IVY_CORNERS.map((t) => RAINBOW_CORNERS[t])
const near = (p: readonly number[], c: Vec3) =>
  Math.hypot(p[0]! - c[0], p[1]! - c[1], p[2]! - c[2]) < 2

/** A triangle of a corner's cap, and the other corners whose spheres it
 *  lies in (by its middle). */
interface CapPart {
  readonly polygon: PiecePolygon
  readonly within: readonly string[]
}

const CAPS = new Map<string, readonly CapPart[]>()

/** The cap of the sphere of radius 2 about a corner, inside the cube, in
 *  triangles: rings round the axis toward the center, each meridian out to
 *  where it leaves the cube (on the arcs of its three faces). */
function capOf(corner: Vec3): readonly CapPart[] {
  const key = corner.join()
  const known = CAPS.get(key)
  if (known) return known
  const toward = norm(scaled(corner, -1))
  const side = norm(crossed(toward, [0, 1, 0]))
  const other = crossed(toward, side)
  const at = (t: number, phi: number): P3 =>
    sum(
      corner,
      scaled(
        sum(
          scaled(toward, Math.cos(phi)),
          scaled(side, Math.sin(phi) * Math.cos(t)),
          scaled(other, Math.sin(phi) * Math.sin(t)),
        ),
        2,
      ),
    )
  const inside = (p: P3) => p.every((x) => Math.abs(x) <= 1 + 1e-9)
  // How far each meridian goes, inside the cube.
  const reach = (t: number) => {
    let [lo, hi] = [0, Math.PI / 2]
    for (let k = 0; k < 30; k++) {
      const mid = (lo + hi) / 2
      if (inside(at(t, mid))) lo = mid
      else hi = mid
    }
    return lo
  }
  const ts = Array.from({ length: ROUND }, (_, k) => (2 * Math.PI * k) / ROUND)
  const grid = ts.map((t) => {
    const far = reach(t)
    return Array.from({ length: RINGS + 1 }, (_, i) => at(t, (far * i) / RINGS))
  })
  const triangles: P3[][] = []
  grid.forEach((meridian, k) => {
    const next = grid[(k + 1) % ROUND]!
    for (let i = 0; i < RINGS; i++) {
      triangles.push([meridian[i]!, meridian[i + 1]!, next[i + 1]!])
      if (i) triangles.push([meridian[i]!, next[i + 1]!, next[i]!])
    }
  })
  /** The other corners whose spheres a point lies in. */
  const withinOf = (p: readonly number[]) =>
    CORNERS.filter((c) => c !== corner && near(p, c)).map((c) => c.join())
  // Halfway between two points, on the sphere (on the chord, at the rim,
  // where the sphere would leave the cube).
  const between = (p: P3, q: P3): P3 => {
    const chord = scaled(sum(p, q), 1 / 2)
    const on = sum(corner, scaled(norm(sum(chord, scaled(corner, -1))), 2))
    return inside(on) ? on : chord
  }
  // A triangle across the edge of a sphere (its corners within different
  // ones) cut in four, again and again, so that the parts follow it.
  const parts: CapPart[] = []
  const add = (points: P3[], depth: number) => {
    const sets = points.map((p) => withinOf(p).join('|'))
    if (depth > 0 && new Set(sets).size > 1) {
      const [a, b, c] = points as [P3, P3, P3]
      const [ab, bc, ca] = [between(a, b), between(b, c), between(c, a)]
      for (const t of [
        [a, ab, ca],
        [ab, b, bc],
        [ca, bc, c],
        [ab, bc, ca],
      ]) {
        add(t, depth - 1)
      }
      return
    }
    const middle = scaled(sum(...points), 1 / 3)
    parts.push({
      polygon: {
        points: points.map((p) => scaled(p, SCENE)),
        paint: 'body',
        // Away from its corner: the side its turn leaves behind.
        normal: norm(sum(middle, scaled(corner, -1))),
      },
      within: withinOf(middle),
    })
  }
  for (const t of triangles) add(t, SPLITS)
  CAPS.set(key, parts)
  return parts
}

/** What of the corners' caps a piece carries, so that whatever lies within
 *  the sphere of a corner turns with it, and nothing else does: a corner,
 *  the part of its own cap within no other sphere; a leaf between corners
 *  a and b, the part of a's within b's sphere only, of b's within a's only,
 *  and of the other two corners' within both a's and b's. Within all three
 *  others' (by the core), none. */
function capsOf(cubie: Cubie): PiecePolygon[] {
  const pick = (corner: Vec3, within: readonly Vec3[]) => {
    const want = within
      .map((c) => c.join())
      .sort()
      .join('|')
    return capOf(corner)
      .filter((part) => [...part.within].sort().join('|') === want)
      .map((part) => part.polygon)
  }
  if (cubie.stickers.length === 3) return pick(cubie.position, [])
  const normal = cubie.stickers[0]!.normal
  const axis = normal.findIndex((v) => v !== 0)
  const [a, b] = CORNERS.filter((c) => c[axis] === normal[axis]) as [Vec3, Vec3]
  return [
    ...pick(a, [b]),
    ...pick(b, [a]),
    ...CORNERS.filter((c) => c !== a && c !== b).flatMap((c) => pick(c, [a, b])),
  ]
}

/** Every polygon of an Ivy Cube piece, as it stands, the parts of the caps
 *  it carries too. */
export function ivyPolygons(cubie: Cubie): PiecePolygon[] {
  return [
    ...capsOf(cubie),
    ...cubie.stickers.flatMap((s) => {
      const normal = unit(s.normal)
      const region = regionOf(cubie.position, s.normal)
      const ni = normalIndex(s.normal)
      const color = colorFacing(cubie, ni)
      return [
        // The body, flush with the face: it meets the caps' rims.
        ...fan(region, s.normal, BODY_SCALE, -0.001).map((points): PiecePolygon => ({
          points,
          paint: 'body',
          normal,
        })),
        ...(color
          ? fan(trimmed(region), s.normal, STICKER_SCALE, LIFT).map((points): PiecePolygon => ({
              points,
              paint: color,
              normal,
              ni,
            }))
          : []),
      ]
    }),
  ]
}

/** For the picker's thumbnail (an SVG, which takes any polygon): each
 *  region whole, its body then its sticker. */
export function ivyThumbnail(cubie: Cubie): PiecePolygon[] {
  return cubie.stickers.flatMap((s) => {
    const normal = unit(s.normal)
    const region = regionOf(cubie.position, s.normal)
    const ni = normalIndex(s.normal)
    const color = colorFacing(cubie, ni)
    const outline = (scale: number) => {
      const tris = fan(region, s.normal, scale, 0)
      // The apex, then each triangle's far side (a leaf's ring only).
      return region.closed
        ? tris.map((t) => t[1]!)
        : [tris[0]![0]!, ...tris.map((t) => t[1]!), tris[tris.length - 1]![2]!]
    }
    return [
      { points: outline(1), paint: 'body', normal } satisfies PiecePolygon,
      ...(color ? [{ points: outline(STICKER_SCALE), paint: color, normal, ni }] : []),
    ]
  })
}
