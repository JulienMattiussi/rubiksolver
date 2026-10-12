import { AXIS_ROTATIONS, normalIndex, TET_NORMALS } from '@/lib/geometry'
import { PYRA_CORNERS, PYRA_VERTICES } from '@/lib/pyraminx'
import type { Cubie, Vec3 } from '@/lib/types'
import { face, type P3, type PiecePolygon } from './polygons'

/**
 * Geometry of the Pyramorphinx's pieces (see lib/morph.ts): each is its
 * cubie's cell of the 2x2 (an octant of the cube [-2, 2]^3) cut by the
 * tetrahedron inscribed in the cube, a convex polyhedron found from its
 * planes. Two kinds only: a corner of the tetrahedron (three stickers) and
 * the middle of a face (one). A piece is drawn as its kind's, turned by the
 * whole-cube rotation that brings it where it stands, its stickers facing
 * as the model says. Everything in the model's frame: the drawing's
 * orientation (`MORPH_ORIENT`) stands it on a face.
 */

/** Model units to scene units: its corners about as far out as a Pyraminx's. */
const SCALE = 0.72
/** Each piece shrunk about its center, leaving dark seams between them. */
const SHRINK = 0.95
const STICKER_SCALE = 0.82
const EPSILON = 1e-9

/** A half-space `normal . p <= offset`, its normal pointing out of the piece. */
interface Plane {
  readonly normal: Vec3
  readonly offset: number
}

const dot = (a: readonly number[], b: readonly number[]) =>
  a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!
const cross = (a: readonly number[], b: readonly number[]): P3 => [
  a[1]! * b[2]! - a[2]! * b[1]!,
  a[2]! * b[0]! - a[0]! * b[2]!,
  a[0]! * b[1]! - a[1]! * b[0]!,
]

/** The point where three planes meet, if they do at a single point. */
function meet(a: Plane, b: Plane, c: Plane): P3 | null {
  const bc = cross(b.normal, c.normal)
  const det = dot(a.normal, bc)
  if (Math.abs(det) < EPSILON) return null
  const ca = cross(c.normal, a.normal)
  const ab = cross(a.normal, b.normal)
  return [0, 1, 2].map(
    (d) => (a.offset * bc[d]! + b.offset * ca[d]! + c.offset * ab[d]!) / det,
  ) as P3
}

/** A convex polyhedron's faces from its planes: every corner where three
 *  planes meet inside all the others, each plane's corners in turn order. */
function polyhedron(planes: readonly Plane[]): { corners: P3[]; normal: Vec3 }[] {
  const points: P3[] = []
  for (let i = 0; i < planes.length; i++)
    for (let j = i + 1; j < planes.length; j++)
      for (let k = j + 1; k < planes.length; k++) {
        const p = meet(planes[i]!, planes[j]!, planes[k]!)
        if (!p || planes.some((q) => dot(q.normal, p) > q.offset + 1e-7)) continue
        if (!points.some((o) => o.every((v, d) => Math.abs(v - p[d]!) < 1e-7))) points.push(p)
      }
  return planes.flatMap(({ normal, offset }) => {
    const on = points.filter((p) => Math.abs(dot(normal, p) - offset) < 1e-7)
    if (on.length < 3) return []
    const center = [0, 1, 2].map((d) => on.reduce((s, p) => s + p[d]!, 0) / on.length)
    // Two directions across the face, to sort its corners by angle.
    const u = on[0]!.map((v, d) => v - center[d]!)
    const w = cross(normal, u)
    const angle = (p: P3) => {
      const r = p.map((v, d) => v - center[d]!)
      return Math.atan2(dot(r, w), dot(r, u))
    }
    return [{ corners: [...on].sort((a, b) => angle(a) - angle(b)), normal }]
  })
}

/** A cubie's cell (the octant of `signs`) cut by the tetrahedron. */
function pieceFaces(signs: Vec3) {
  const cell: Plane[] = [0, 1, 2].flatMap((a) => {
    const axis = [0, 0, 0].map((_, d) => (d === a ? signs[a]! : 0)) as unknown as Vec3
    return [
      { normal: axis.map((v) => -v) as unknown as Vec3, offset: 0 }, // the cube's middle
      { normal: axis, offset: 2 }, // its outside
    ]
  })
  // Each face of the tetrahedron, opposite a corner v: v . p >= -2.
  const tetra = PYRA_VERTICES.map((v) => ({
    normal: PYRA_CORNERS[v].map((x) => -x) as unknown as Vec3,
    offset: 2,
  }))
  return polyhedron([...cell, ...tetra])
}

/** The two kinds of piece, as they sit when solved: a corner at (1,1,1), a
 *  face's middle at (-1,-1,-1). */
const KINDS = {
  corner: { position: [1, 1, 1] as Vec3, faces: pieceFaces([1, 1, 1]) },
  middle: { position: [-1, -1, -1] as Vec3, faces: pieceFaces([-1, -1, -1]) },
}
const normalsOf = (position: Vec3, kind: 'corner' | 'middle'): string[] =>
  kind === 'corner'
    ? TET_NORMALS.filter((n) => dot(n, position) > 0).map((n) => n.join())
    : [position.join()]

/** The whole-cube rotation laying a piece of `kind` where `cubie` stands,
 *  its stickers facing as the cubie's do (a face's middle is symmetric about
 *  its normal: any of its three turns draws the same). */
function placing(cubie: Cubie, kind: 'corner' | 'middle') {
  const home = KINDS[kind]
  const wanted = cubie.stickers
    .map((s) => s.normal.join())
    .sort()
    .join('|')
  const homeNormals = normalsOf(home.position, kind)
  return AXIS_ROTATIONS.find(
    (turn) =>
      turn(home.position).join() === cubie.position.join() &&
      homeNormals
        .map((n) => turn(n.split(',').map(Number) as unknown as Vec3).join())
        .sort()
        .join('|') === wanted,
  )
}

/** Every polygon of a Pyramorphinx piece, in the model's frame. */
export function morphPolygons(cubie: Cubie): PiecePolygon[] {
  const kind = cubie.stickers.length === 3 ? 'corner' : 'middle'
  const turn = placing(cubie, kind)
  if (!turn) return []
  const faces = KINDS[kind].faces
  const turnP = (p: readonly number[]) => turn(p as unknown as Vec3) as unknown as P3
  const center = turnP(
    [0, 1, 2].map(
      (d) =>
        faces.flatMap((f) => f.corners).reduce((s, p) => s + p[d]!, 0) /
        faces.reduce((n, f) => n + f.corners.length, 0),
    ),
  )
  const toScene = (p: P3): P3 =>
    p.map((v, d) => (center[d]! + (v - center[d]!) * SHRINK) * SCALE) as P3
  return faces.flatMap(({ corners, normal }) => {
    const n = turnP(normal)
    const length = Math.hypot(...n)
    // The faces on the tetrahedron lie across a diagonal: those bear stickers.
    const ni = length > 1.5 ? normalIndex(n as unknown as Vec3) : undefined
    return face(
      corners.map((p) => toScene(turnP(p))),
      n.map((v) => v / length) as P3,
      cubie,
      ni,
      STICKER_SCALE,
    )
  })
}

/** How the drawing stands the model on a face, its first corner up (the
 *  Pyraminx's frame: see `pyraToCartesian`), as a quaternion. */
export const MORPH_ORIENT: [number, number, number, number] = (() => {
  // Rows of the rotation: the scene's x, y, z in model coordinates.
  const x = [1, 0, -1].map((v) => v / Math.SQRT2)
  const y = [1, 1, 1].map((v) => v / Math.sqrt(3))
  const z = [1, -2, 1].map((v) => v / Math.sqrt(6))
  const m = [x, y, z] as number[][]
  const trace = m[0]![0]! + m[1]![1]! + m[2]![2]!
  const s = Math.sqrt(trace + 1) * 2
  return [
    (m[2]![1]! - m[1]![2]!) / s,
    (m[0]![2]! - m[2]![0]!) / s,
    (m[1]![0]! - m[0]![1]!) / s,
    s / 4,
  ]
})()
