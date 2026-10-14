import { FACE_COLOR, solvedCube } from '@/lib/core/cube'
import { AXIS_ROTATIONS, normalIndex } from '@/lib/core/geometry'
import { colorsOf } from '@/lib/core/pieces'
import type { Color, Cubie, Face, Vec3 } from '@/lib/core/types'
import type { P3, PiecePolygon } from '../../core/polygons'

/**
 * Geometry of the Tori's pieces (a 3x3 without corners, see cube.ts). Its
 * solid is a rounded cube, |x|^N + |y|^N + |z|^N <= R^N, cut by the 3x3's
 * planes, set deep enough (at D) that nothing is left where a corner would
 * be: each face's center is a big rounded square, each edge a thin almond
 * along the cube's edge, and the corners meet in a point. A hole goes down
 * the middle of every face to the core: the centers are rings, colored all
 * the way down the hole, as the real puzzle's plastic is.
 *
 * Each piece is meshed in its solved place (its share of the surface, in a
 * polar grid about each face's middle so the holes come out round; its cuts
 * in plastic), then carried as it stands (the turn from its solved place,
 * read on its colors).
 */

/** The solid's size and roundness, where the cuts lie, the holes' radius. */
const R = 1.5
const N = 3
const D = 1.05
const HOLE = 0.5
/** A colored patch stops this far short of the cuts (the seams). */
const SEAM = 0.025
const FAR = 9

const AXES = [0, 1, 2] as const
const FACE_OF: Record<string, Face> = {
  '0,1': 'R',
  '0,-1': 'L',
  '1,1': 'U',
  '1,-1': 'D',
  '2,1': 'F',
  '2,-1': 'B',
}

const norm = (p: readonly number[]) => p.reduce((s, v) => s + Math.abs(v) ** N, 0) ** (1 / N)
/** The surface point along a direction from the middle. */
const onSurface = (dir: readonly number[]): number[] => {
  const k = R / norm(dir)
  return dir.map((v) => v * k)
}
/** The surface's outward normal at a point (the gradient). */
const gradient = (p: readonly number[]): P3 => {
  const g = p.map((v) => Math.sign(v) * Math.abs(v) ** (N - 1))
  const length = Math.hypot(...g) || 1
  return g.map((v) => v / length) as P3
}

/** A point of the face (axis a, side s) at polar (rho, theta) of its square. */
function direction(a: number, s: number, rho: number, theta: number): number[] {
  const dir = [0, 0, 0]
  dir[a] = s
  dir[(a + 1) % 3] = rho * Math.cos(theta)
  dir[(a + 2) % 3] = rho * Math.sin(theta)
  return dir
}

/** How far out the hole's rim is at angle theta (a polar radius of the
 *  face's square): where the surface is HOLE from the axis. */
function rimAt(a: number, theta: number): number {
  let [lo, hi] = [0, 1]
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2
    const p = onSurface(direction(a, 1, mid, theta))
    const off = Math.hypot(p[(a + 1) % 3]!, p[(a + 2) % 3]!)
    if (off < HOLE) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/** A polygon clipped to the half-space normal . p <= offset (its normals
 *  recomputed at the new points). */
type Pt = { p: number[]; n: P3 }
function clipHalf(points: Pt[], normal: readonly number[], offset: number): Pt[] {
  const side = (p: readonly number[]) => offset - normal.reduce((s, v, d) => s + v * p[d]!, 0)
  const out: Pt[] = []
  points.forEach((v, i) => {
    const w = points[(i + 1) % points.length]!
    const [sv, sw] = [side(v.p), side(w.p)]
    if (sv >= 0) out.push(v)
    if (sv >= 0 !== sw >= 0) {
      const f = sv / (sv - sw)
      const p = v.p.map((c, d) => c + (w.p[d]! - c) * f)
      out.push({ p, n: gradient(p) })
    }
  })
  return out.length >= 3 ? out : []
}

/** A cell's box: per axis, its low and high bound. */
type Box = [number, number][]
const boxOf = (cell: Vec3): Box =>
  cell.map((c): [number, number] => (c > 0 ? [D, FAR] : c < 0 ? [-FAR, -D] : [-D, D]))

/** A polygon clipped to a box, kept `inset` off its inner cuts. */
function clipBox(points: Pt[], box: Box, inset = 0): Pt[] {
  let out = points
  for (const a of AXES) {
    const [lo, hi] = box[a]!
    const unit = (sign: number) => AXES.map((d) => (d === a ? sign : 0))
    if (lo > -FAR) out = clipHalf(out, unit(-1), -(lo + inset))
    if (out.length && hi < FAR) out = clipHalf(out, unit(1), hi - inset)
    if (!out.length) return out
  }
  return out
}

/** A patch of a piece, in its solved frame. */
type Patch = { points: Pt[]; paint: Color | 'body'; normal?: P3 }

/** The face color a surface point shows: its largest coordinate's face. */
function colorAt(p: readonly number[]): Color {
  const a = AXES.reduce((m, d) => (Math.abs(p[d]!) > Math.abs(p[m]!) ? d : m), 0)
  return FACE_COLOR[FACE_OF[`${a},${Math.sign(p[a]!)}`]!]
}

/** The surface in quads, face by face, polar about each face's middle. */
function surfaceQuads(around: number, out: number): Pt[][] {
  const quads: Pt[][] = []
  for (const a of AXES) {
    for (const s of [1, -1]) {
      for (let k = 0; k < around; k++) {
        const t0 = (2 * Math.PI * k) / around
        const t1 = (2 * Math.PI * (k + 1)) / around
        // From the hole's rim out to the face square's edge.
        const reach = (t: number) => 1 / Math.max(Math.abs(Math.cos(t)), Math.abs(Math.sin(t)))
        const ring = (t: number, j: number) => {
          const rim = rimAt(a, t)
          // Finer out by the edges, where the surface bends most.
          const f = 1 - (1 - j / out) ** 2
          const p = onSurface(direction(a, s, rim + (reach(t) * 1.02 - rim) * f, t))
          return { p, n: gradient(p) }
        }
        for (let j = 0; j < out; j++) {
          // Reaching a little past the square, then cut where the next face
          // begins (its largest coordinate changes): no crack, no overlap.
          let quad = [ring(t0, j), ring(t1, j), ring(t1, j + 1), ring(t0, j + 1)]
          for (const b of [(a + 1) % 3, (a + 2) % 3]) {
            for (const sign of [1, -1]) {
              const normal = [0, 0, 0]
              normal[b] = sign
              normal[a] = -s
              if (quad.length) quad = clipHalf(quad, normal, 0)
            }
          }
          if (quad.length) quads.push(quad)
        }
      }
    }
  }
  return quads
}

const FINE = surfaceQuads(64, 14)

/** The solid's section at a cut (axis a at value v): a superellipse in the
 *  other two coordinates. */
function section(a: number, v: number, steps = 96): Pt[] {
  const radius = (R ** N - Math.abs(v) ** N) ** (1 / N)
  return Array.from({ length: steps }, (_, i) => {
    const t = (2 * Math.PI * i) / steps
    const [c, s] = [Math.cos(t), Math.sin(t)]
    const k = radius / (Math.abs(c) ** N + Math.abs(s) ** N) ** (1 / N)
    const p = [0, 0, 0]
    p[a] = v
    p[(a + 1) % 3] = k * c
    p[(a + 2) % 3] = k * s
    return { p, n: [0, 0, 0] as P3 }
  })
}

/** The thumbnail's surface of a cell, in a few big patches (a fine mesh
 *  would show as a grid in the flat picture): a center's ring in quarters,
 *  an edge's two halves, each kept off the cuts. */
function bigPatches(cell: Vec3): Patch[] {
  const outer = cell.flatMap((c, a) => (c ? [a] : []))
  const point = (p: number[]): Pt => ({ p, n: gradient(p) })
  if (outer.length === 1) {
    const a = outer[0]!
    const s = cell[a]!
    const color = FACE_COLOR[FACE_OF[`${a},${s}`]!]
    // How far out the ring reaches at angle t: until it leaves the cell.
    const inCell = (p: readonly number[]) =>
      Math.abs(p[a]!) >= D + SEAM &&
      Math.max(Math.abs(p[(a + 1) % 3]!), Math.abs(p[(a + 2) % 3]!)) <= D - SEAM
    const edge = (t: number) => {
      let [lo, hi] = [rimAt(a, t), 2]
      for (let i = 0; i < 30; i++) {
        const mid = (lo + hi) / 2
        if (inCell(onSurface(direction(a, s, mid, t)))) lo = mid
        else hi = mid
      }
      return lo
    }
    return [0, 1, 2, 3].map((q) => {
      const ts = Array.from({ length: 13 }, (_, i) => ((q + i / 12) * Math.PI) / 2)
      const out = ts.map((t) => point(onSurface(direction(a, s, edge(t), t))))
      const rim = [...ts].reverse().map((t) => point(onSurface(direction(a, s, rimAt(a, t), t))))
      return { points: [...out, ...rim], paint: color }
    })
  }
  // An edge: its half on each face, from the cut to the ridge between them.
  const [a, b] = outer as [number, number]
  const c = 3 - a - b
  const cut = D + SEAM
  const span = Math.min((R ** N - 2 * cut ** N) ** (1 / N), D - SEAM)
  const ts = Array.from({ length: 17 }, (_, i) => -span + (2 * span * i) / 16)
  return [
    [a, b],
    [b, a],
  ].map(([own, other]) => {
    const at = (mine: number, theirs: number, t: number) => {
      const p = [0, 0, 0]
      p[own!] = cell[own!]! * mine
      p[other!] = cell[other!]! * theirs
      p[c] = t
      return point(p)
    }
    const onCut = ts.map((t) => at((R ** N - cut ** N - Math.abs(t) ** N) ** (1 / N), cut, t))
    const ridge = [...ts].reverse().map((t) => {
      const x = ((R ** N - Math.abs(t) ** N) / 2) ** (1 / N)
      return at(x, x, t)
    })
    return {
      points: [...onCut, ...ridge],
      paint: FACE_COLOR[FACE_OF[`${own},${cell[own!]}`]!],
    }
  })
}

/** The cell's share of the solid: its surface (in plastic underneath, its
 *  colors on top, kept off the cuts), its hole for a center, its cuts. */
function cellShape(cell: Vec3, inside: boolean): Patch[] {
  const box = boxOf(cell)
  const out: Patch[] = inside ? [] : bigPatches(cell)
  for (const quad of inside ? FINE : []) {
    const whole = clipBox(quad, box)
    if (!whole.length) continue
    if (inside) out.push({ points: whole, paint: 'body' })
    const patch = clipBox(quad, box, SEAM)
    if (patch.length) {
      const middle = AXES.map((d) => patch.reduce((s, q) => s + q.p[d]!, 0) / patch.length)
      out.push({ points: patch, paint: colorAt(middle) })
    }
  }
  const axis = cell.findIndex((c) => c !== 0)
  const centered = cell.filter((c) => c !== 0).length === 1
  if (centered) {
    // The hole: its wall in the face's color, down to the core, dark.
    const s = cell[axis]!
    const steps = inside ? 64 : 24
    const at = (t: number, depth: number): Pt => {
      const p = [0, 0, 0]
      p[axis] = depth * s
      p[(axis + 1) % 3] = HOLE * Math.cos(t)
      p[(axis + 2) % 3] = HOLE * Math.sin(t)
      const n = [0, 0, 0]
      n[(axis + 1) % 3] = -Math.cos(t)
      n[(axis + 2) % 3] = -Math.sin(t)
      return { p, n: n as P3 }
    }
    const color = FACE_COLOR[FACE_OF[`${axis},${s}`]!]
    const bottom: Pt[] = []
    for (let k = 0; k < steps; k++) {
      const t0 = (2 * Math.PI * k) / steps
      const t1 = (2 * Math.PI * (k + 1)) / steps
      const top = (t: number) => Math.abs(onSurface(direction(axis, 1, rimAt(axis, t), t))[axis]!)
      const wall = [at(t0, D), at(t1, D), at(t1, top(t1)), at(t0, top(t0))]
      out.push({ points: wall, paint: color })
      bottom.push(at(t0, D))
    }
    const facing = [0, 0, 0]
    facing[axis] = s
    out.push({ points: bottom, paint: 'body', normal: facing as P3 })
  }
  if (!inside) return out
  // Its cuts: the solid's section at each inner bound, within the cell.
  for (const a of AXES) {
    box[a]!.forEach((bound, i) => {
      if (Math.abs(bound) === FAR) return
      const cut = clipBox(
        section(a, bound),
        box.map((b, d) => (d === a ? [-FAR, FAR] : b)),
      )
      if (!cut.length) return
      const normal = [0, 0, 0]
      normal[a] = i === 0 ? -1 : 1
      out.push({ points: cut, paint: 'body', normal: normal as P3 })
    })
  }
  return out
}

const SOLVED = solvedCube('tori')
const HOME = new Map(SOLVED.map((c) => [colorsOf(c), c]))

/** The whole-puzzle turn taking a piece from its solved place to where it
 *  stands (a center never leaves, and turns into itself). */
function turnOf(cubie: Cubie): (v: Vec3) => Vec3 {
  const home = HOME.get(colorsOf(cubie))!
  if (cubie.stickers.length === 1) return (v) => v
  const at = (c: Cubie, color: string) => c.stickers.find((s) => s.color === color)!.normal.join()
  return AXIS_ROTATIONS.find((turn) =>
    home.stickers.every((s) => turn(s.normal).join() === at(cubie, s.color)),
  )!
}

const normalOf = (points: readonly P3[]): P3 => {
  // Newell's method: robust on any polygon.
  const n: P3 = [0, 0, 0]
  points.forEach((p, i) => {
    const q = points[(i + 1) % points.length]!
    n[0] += (p[1] - q[1]) * (p[2] + q[2])
    n[1] += (p[2] - q[2]) * (p[0] + q[0])
    n[2] += (p[0] - q[0]) * (p[1] + q[1])
  })
  const length = Math.hypot(...n) || 1
  return n.map((x) => x / length) as P3
}

const SHAPES = new Map<string, PiecePolygon[]>()

/** Every polygon of a Tori piece, as it stands (`thumbnail`: coarser, its
 *  outside only, for the flat picture drawn in depth order). */
function piecePolygons(cubie: Cubie, thumbnail: boolean): PiecePolygon[] {
  if (cubie.stickers.length === 0) return [] // the core never shows
  const id = cubie.stickers.map((s) => s.normal.join() + s.color).join('|') + (thumbnail ? 't' : '')
  const known = SHAPES.get(id)
  if (known) return known
  const home = HOME.get(colorsOf(cubie))!
  const turn = turnOf(cubie)
  const carry = (p: readonly number[]): P3 => turn(p as unknown as Vec3) as unknown as P3
  const patches = cellShape(home.position, !thumbnail)
  const polygons = patches.flatMap(({ points, paint, normal }): PiecePolygon[] => {
    const placed = points.map((q) => carry(q.p))
    const flat = normalOf(placed)
    if (flat.every((x) => x === 0) || placed.length < 3) return []
    // Facing as its normal says, or as its points' normals do (the surface).
    const mean = AXES.map((d) => points.reduce((sum, q) => sum + q.n[d]!, 0))
    const facing = carry(normal ?? mean)
    // Points counter-clockwise seen from where the polygon faces.
    const ordered = flat[0] * facing[0] + flat[1] * facing[1] + flat[2] * facing[2] < 0
    const pts = ordered ? [...placed].reverse() : placed
    const smooth = normal ? undefined : points.map((q) => carry(q.n))
    const normals = smooth && (ordered ? [...smooth].reverse() : smooth)
    const outward = normal ? facing : (flat.map((x) => (ordered ? -x : x)) as P3)
    if (paint === 'body')
      return [{ points: pts, paint, normal: outward, ...(normals && { normals }) }]
    // A colored patch answers clicks (entry) as the cube's face it is on.
    const middle = AXES.map((d) => pts.reduce((s, p) => s + p[d]!, 0) / pts.length)
    const a = AXES.reduce((m, d) => (Math.abs(middle[d]!) > Math.abs(middle[m]!) ? d : m), 0)
    const face = [0, 0, 0] as P3
    face[a] = Math.sign(middle[a]!)
    // The thumbnail shades a face's surface as one (its fine mesh would
    // show as a grid), the hole's walls as they face.
    const flatShade =
      thumbnail && AXES.reduce((sum: number, d) => sum + outward[d]! * face[d]!, 0) > 0.1
    // The picture looks from (1, 1, 1): a hole on a hidden face would only
    // peek through the seams.
    if (thumbnail && !flatShade && face[0] + face[1] + face[2] < 0) return []
    return [
      {
        points: pts,
        paint,
        normal: flatShade ? face : outward,
        ni: normalIndex(face),
        ...(normals && { normals }),
      },
    ]
  })
  SHAPES.set(id, polygons)
  return polygons
}

/** The Tori's pieces, for the 3D view and for the thumbnail. */
export const toriPolygons = (cubie: Cubie) => piecePolygons(cubie, false)
export const toriThumbnail = (cubie: Cubie) => piecePolygons(cubie, true)
