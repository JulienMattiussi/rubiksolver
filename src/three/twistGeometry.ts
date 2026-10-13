import { FACE_COLOR, solvedCube } from '@/lib/cube'
import { AXIS_ROTATIONS, normalIndex, rotateN } from '@/lib/geometry'
import { colorsOf } from '@/lib/pieces'
import type { Color, Cubie, Vec3 } from '@/lib/types'
import type { P3, PiecePolygon } from './polygons'

/**
 * Geometry of the Z-Twist's pieces (see lib/twist.ts). Its mechanism is a
 * 3x3's, cut by the same square planes; only its solid is twisted: the top
 * square in place, the bottom one a quarter turn round, each vertical edge
 * a straight line between them. At height y its cross-section mixes the
 * two, (1 - t) the top's and t the bottom's: a square still, turned and
 * shrunk (a diamond through the faces' middles at mid-height), never out of
 * the cube. A piece is its 3x3 cell cut out of that solid: its share of the
 * twisted sides, colored as each side is (so one face of the cube can show
 * two colors, the side centers among them), of the top or bottom, and its
 * cuts in plastic; then carried as the piece stands (the turn from its
 * solved place, read on its colors, and a side center's quarter turn). A
 * shape mod, as the mirror cube.
 */

/** The cube's half side, and each piece shrunk about its cell's middle. */
const HALF = 1.5
const SHRINK = 1
/** A colored patch stops this far short of the cuts inside the cube (the
 *  seams: the plastic underneath shows), its corners cut back this much
 *  (the pieces' rounded corners). */
const SEAM = 0.018
const CORNER = 0.03
/** Steps across a side and up a cell, for the twist to bend smoothly; and
 *  bands up an upright cut. */
const ACROSS = 30
const UP = 10
const CUT = 20

/** How far down the twist is at height y: 0 at the top, 1 at the bottom. */
const depth = (y: number) => (1 - y / HALF) / 2

/** A point of the top square brought to height y: the mix of where it is
 *  and a quarter turn round. */
const atHeight = (x: number, z: number, y: number): number[] => {
  const t = depth(y)
  return [(1 - t) * x + t * z, y, (1 - t) * z - t * x]
}

/** How round the solid's upright edges are (in the top square's frame). */
const ROUND = 0.1
const ARC = 6

/** The top square with its corners rounded, counter-clockwise seen from
 *  above (x then z), straight sides split for the twist to bend them. */
const OUTLINE: [number, number][] = (() => {
  const points: [number, number][] = []
  const inner = HALF - ROUND
  const corners: [number, number, number][] = [
    [-1, -1, Math.PI],
    [1, -1, 1.5 * Math.PI],
    [1, 1, 0],
    [-1, 1, Math.PI / 2],
  ]
  const arcPoint = ([sx, sz, start]: [number, number, number], f: number): [number, number] => {
    const angle = start + (Math.PI / 2) * f
    return [sx * inner + ROUND * Math.cos(angle), sz * inner + ROUND * Math.sin(angle)]
  }
  corners.forEach((corner, k) => {
    for (let i = 0; i <= ARC; i++) points.push(arcPoint(corner, i / ARC))
    // The straight side to the next corner, split.
    const from = arcPoint(corner, 1)
    const to = arcPoint(corners[(k + 1) % 4]!, 0)
    for (let i = 1; i < ACROSS; i++) {
      const f = i / ACROSS
      points.push([from[0] + (to[0] - from[0]) * f, from[1] + (to[1] - from[1]) * f])
    }
  })
  return points
})()

/** The solid's cross-section at height y: the rounded top square, mixed. */
const section = (y: number) => OUTLINE.map(([x, z]) => atHeight(x, z, y))

/** A horizontal polygon at height y clipped to the cross-section there
 *  (convex: one half-plane per side). */
function clipToSection(points: number[][], y: number): number[][] {
  const corners = section(y)
  let out = points
  corners.forEach((p, i) => {
    const q = corners[(i + 1) % corners.length]!
    // Inside: to the left of p -> q (the section turns counter-clockwise
    // seen from above, x then z).
    const side = (v: readonly number[]) =>
      (q[0]! - p[0]!) * (v[2]! - p[2]!) - (q[2]! - p[2]!) * (v[0]! - p[0]!)
    const next: number[][] = []
    out.forEach((v, k) => {
      const w = out[(k + 1) % out.length]!
      const [sv, sw] = [side(v), side(w)]
      if (sv >= 0) next.push(v)
      if (sv >= 0 !== sw >= 0) {
        const f = sv / (sv - sw)
        next.push(v.map((c, d) => c + (w[d]! - c) * f))
      }
    })
    out = next
  })
  return out.length >= 3 ? out : []
}

/** Where an upright cut (coordinate `a` fixed at `value`) lies in the solid
 *  at height y: the range of the other horizontal coordinate, where the
 *  cross-section's outline crosses the cut. */
function across(a: number, value: number, y: number): [number, number] {
  const b = 2 - a
  const points = section(y)
  const hits: number[] = []
  points.forEach((p, i) => {
    const q = points[(i + 1) % points.length]!
    if ((p[a]! - value) * (q[a]! - value) > 0 || p[a] === q[a]) return
    const f = (value - p[a]!) / (q[a]! - p[a]!)
    hits.push(p[b]! + (q[b]! - p[b]!) * f)
  })
  return hits.length ? [Math.min(...hits), Math.max(...hits)] : [1, 0]
}

/** The color of the side a point of the outline is on: the one it faces
 *  most (each rounded corner split between its two sides). */
const sideColor = ([x, z]: readonly number[]): Color =>
  Math.abs(x!) > Math.abs(z!) ? FACE_COLOR[x! > 0 ? 'R' : 'L'] : FACE_COLOR[z! > 0 ? 'F' : 'B']

/** A polygon clipped to an axis-aligned box (Sutherland-Hodgman). */
function clip(points: number[][], low: readonly number[], high: readonly number[]): number[][] {
  let out = points
  for (let a = 0; a < 3; a++) {
    for (const [bound, keep] of [
      [low[a]!, (v: number) => v >= low[a]! - 1e-12],
      [high[a]!, (v: number) => v <= high[a]! + 1e-12],
    ] as const) {
      const next: number[][] = []
      out.forEach((p, i) => {
        const q = out[(i + 1) % out.length]!
        if (keep(p[a]!)) next.push(p)
        if (keep(p[a]!) !== keep(q[a]!)) {
          const f = (bound - p[a]!) / (q[a]! - p[a]!)
          next.push(p.map((v, d) => v + (q[d]! - v) * f))
        }
      })
      out = next
      if (out.length < 3) return []
    }
  }
  return out
}

const normalOf = (points: readonly number[][]): P3 => {
  const [a, b, c] = points as [number[], number[], number[]]
  const u = [0, 1, 2].map((d) => b[d]! - a[d]!)
  const v = [0, 1, 2].map((d) => c[d]! - a[d]!)
  const n = [
    u[1]! * v[2]! - u[2]! * v[1]!,
    u[2]! * v[0]! - u[0]! * v[2]!,
    u[0]! * v[1]! - u[1]! * v[0]!,
  ]
  const length = Math.hypot(...n) || 1
  return n.map((x) => x / length) as P3
}

/** A patch of a piece; `cut` on its inner cuts (the outside's otherwise). */
type Patch = { points: number[][]; paint: Color | 'body'; cut?: true }

/** A polygon clipped to the half-space normal . p <= offset. */
function clipHalf(points: number[][], normal: readonly number[], offset: number): number[][] {
  const side = (p: readonly number[]) =>
    offset - (normal[0]! * p[0]! + normal[1]! * p[1]! + normal[2]! * p[2]!)
  const next: number[][] = []
  points.forEach((p, i) => {
    const q = points[(i + 1) % points.length]!
    const [sp, sq] = [side(p), side(q)]
    if (sp >= 0) next.push(p)
    if (sp >= 0 !== sq >= 0) {
      const f = sp / (sp - sq)
      next.push(p.map((v, d) => v + (q[d]! - v) * f))
    }
  })
  return next.length >= 3 ? next : []
}

/** A colored patch kept off the cell's inner cuts (not the cube's own
 *  outside), and its corners there cut back. */
function trim(points: number[][], low: readonly number[], high: readonly number[]): number[][] {
  const inner = (v: number) => Math.abs(Math.abs(v) - HALF) > 1e-9
  // The cuts the patch keeps off: per axis, the bound and its side.
  const walls: { axis: number; sign: number; at: number }[] = []
  for (let a = 0; a < 3; a++) {
    if (inner(low[a]!)) walls.push({ axis: a, sign: -1, at: low[a]! + SEAM })
    if (inner(high[a]!)) walls.push({ axis: a, sign: 1, at: high[a]! - SEAM })
  }
  let out = points
  for (const { axis, sign, at } of walls) {
    const normal = [0, 0, 0]
    normal[axis] = sign
    out = clipHalf(out, normal, sign * at)
    if (!out.length) return out
  }
  // Where two cuts meet, the corner cut back across them.
  walls.forEach((w, i) =>
    walls.slice(i + 1).forEach((v) => {
      if (v.axis === w.axis || !out.length) return
      const normal = [0, 0, 0]
      normal[w.axis] = w.sign
      normal[v.axis] = v.sign
      out = clipHalf(out, normal, w.sign * w.at + v.sign * v.at - CORNER)
    }),
  )
  return out
}

/** The cell's share of the solid, in the solved frame: colored patches
 *  (twisted sides, top, bottom) and its cuts in plastic. */
function cellShape(cell: Vec3): Patch[] {
  const low = cell.map((c) => c - 0.5)
  const high = cell.map((c) => c + 0.5)
  const out: Patch[] = []
  // The twisted sides within the cell (clipped to it: the cuts stay flat):
  // the outline swept down, each band of it in its side's color.
  const y = (k: number) => low[1]! + k / UP
  OUTLINE.forEach((p, i) => {
    const q = OUTLINE[(i + 1) % OUTLINE.length]!
    const color = sideColor([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2])
    for (let j = 0; j < UP; j++) {
      const quad = clip(
        [
          atHeight(p[0], p[1], y(j)),
          atHeight(q[0], q[1], y(j)),
          atHeight(q[0], q[1], y(j + 1)),
          atHeight(p[0], p[1], y(j + 1)),
        ],
        low,
        high,
      )
      if (!quad.length) continue
      // In plastic underneath (the seams show it), the color on top.
      out.push({ points: quad, paint: 'body' })
      const patch = trim(quad, low, high)
      if (patch.length) out.push({ points: patch, paint: color })
    }
  })
  // The top and bottom, where the cell reaches them (rounded at the
  // corners as the sides are).
  if (high[1] === HALF || low[1] === -HALF) {
    const top = high[1] === HALF ? HALF : -HALF
    const square = [
      [low[0]!, top, low[2]!],
      [high[0]!, top, low[2]!],
      [high[0]!, top, high[2]!],
      [low[0]!, top, high[2]!],
    ]
    const whole = clipToSection(square, top)
    if (whole.length) out.push({ points: top > 0 ? [...whole].reverse() : whole, paint: 'body' })
    const cap = trim(whole, low, high)
    if (cap.length) {
      out.push({ points: top > 0 ? cap.reverse() : cap, paint: FACE_COLOR[top > 0 ? 'U' : 'D'] })
    }
  }
  // Its six cuts, where they lie in the solid. A horizontal one: the
  // cell's square clipped to the cross-section there. An upright one: in
  // thin bands, each between the solid's edges at its two heights.
  for (const side of [low, high]) {
    const y = side[1]!
    if (Math.abs(y) === HALF) continue // the top or bottom, colored
    const square = [
      [low[0]!, y, low[2]!],
      [high[0]!, y, low[2]!],
      [high[0]!, y, high[2]!],
      [low[0]!, y, high[2]!],
    ]
    const cut = clipToSection(square, y)
    if (cut.length) out.push({ points: cut, paint: 'body', cut: true })
  }
  for (const a of [0, 2]) {
    const b = 2 - a
    for (const side of [low, high]) {
      for (let j = 0; j < CUT; j++) {
        const y0 = low[1]! + j / CUT
        const y1 = low[1]! + (j + 1) / CUT
        let [from0, to0] = across(a, side[a]!, y0)
        let [from1, to1] = across(a, side[a]!, y1)
        if (to0 < from0 && to1 < from1) continue
        // Missing at one height: the band narrows to a point there.
        if (to0 < from0) from0 = to0 = (from1 + to1) / 2
        if (to1 < from1) from1 = to1 = (from0 + to0) / 2
        const at = (u: number, y: number) => {
          const p = [0, y, 0]
          p[a] = side[a]!
          p[b] = u
          return p
        }
        // Clipped to the cell (its cut is no wider than it).
        const band = clip([at(from0, y0), at(to0, y0), at(to1, y1), at(from1, y1)], low, high)
        if (band.length) out.push({ points: band, paint: 'body', cut: true })
      }
    }
  }
  return out
}

const SOLVED = solvedCube('3')
const HOME = new Map(SOLVED.map((c) => [colorsOf(c), c]))

/** The whole-puzzle turn taking a piece from its solved place to where it
 *  stands. */
function turnOf(cubie: Cubie): (v: Vec3) => Vec3 {
  const home = HOME.get(colorsOf(cubie))!
  if (cubie.stickers.length === 1) {
    // A center: a quarter turn about its axis, if it is off.
    const axis = (['x', 'y', 'z'] as const)[home.position.findIndex((v) => v !== 0)]!
    return (v) => rotateN(v, axis, cubie.spin ?? 0)
  }
  const at = (c: Cubie, color: string) => c.stickers.find((s) => s.color === color)!.normal.join()
  return AXIS_ROTATIONS.find((turn) =>
    home.stickers.every((s) => turn(s.normal).join() === at(cubie, s.color)),
  )!
}

const unit = (axis: number): Vec3 => [0, 1, 2].map((d) => (d === axis ? 1 : 0)) as unknown as Vec3
const SHAPES = new Map<string, PiecePolygon[]>()

/** Every polygon of a Z-Twist piece, as it stands (`outside`: its outer
 *  surface only, for the flat thumbnail, which draws in depth order). */
function piecePolygons(cubie: Cubie, outside: boolean): PiecePolygon[] {
  if (cubie.stickers.length === 0) return [] // the core never shows
  const id =
    cubie.stickers.map((s) => s.normal.join() + s.color).join('|') +
    (cubie.spin ?? '') +
    (outside ? 'out' : '')
  const known = SHAPES.get(id)
  if (known) return known
  const home = HOME.get(colorsOf(cubie))!
  const turn = turnOf(cubie)
  const carry = (p: readonly number[]): P3 => {
    // Shrunk about its cell's middle (the seams), then turned where it is.
    const q = p.map((v, d) => home.position[d]! + (v - home.position[d]!) * SHRINK)
    return [0, 1, 2].map((a) =>
      [0, 1, 2].reduce((sum, b) => sum + turn(unit(b))[a]! * q[b]!, 0),
    ) as P3
  }
  // The thumbnail keeps the colors only (its fine mesh would show as a grid).
  const patches = cellShape(home.position).filter((p) => !(outside && p.paint === 'body'))
  const polygons = patches.flatMap(({ points, paint, cut }): PiecePolygon[] => {
    const placed = points.map(carry)
    let normal = normalOf(placed)
    // A sliver left by clipping (its points in a line) shows nothing.
    if (normal.every((x) => x === 0)) return []
    // The outside faces out (away from the middle of the cube).
    if (!cut) {
      const middle = [0, 1, 2].map((d) => placed.reduce((s, p) => s + p[d]!, 0) / placed.length)
      if (normal[0] * middle[0]! + normal[1] * middle[1]! + normal[2] * middle[2]! < 0) {
        normal = normal.map((x) => -x) as P3
      }
    }
    if (paint === 'body') return [{ points: placed, paint, normal }]
    // A colored patch answers clicks (entry) as the cube's face it is on.
    const axis = [0, 1, 2].reduce(
      (m, d) => (Math.abs(normal[d]!) > Math.abs(normal[m]!) ? d : m),
      0,
    )
    const facing = [0, 0, 0] as [number, number, number]
    facing[axis] = Math.sign(normal[axis]!)
    return [{ points: placed, paint, normal, ni: normalIndex(facing) }]
  })
  SHAPES.set(id, polygons)
  return polygons
}

/** The Z-Twist's pieces, for the 3D view and for the thumbnail. */
export const twistPolygons = (cubie: Cubie) => piecePolygons(cubie, false)
export const twistThumbnail = (cubie: Cubie) => piecePolygons(cubie, true)
