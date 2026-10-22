import {
  AXIS_ROTATIONS,
  dot,
  mapVec,
  normalIndex,
  parseVecKey,
  TET_NORMALS,
} from '@/lib/core/geometry'
import { PYRA_CORNERS, PYRA_VERTICES } from '@/lib/puzzles/pyramid/pyraminx'
import type { Cubie, Vec3 } from '@/lib/core/types'
import { face, type P3, type PiecePolygon } from '../../core/polygons'
import { polyhedron, type Plane } from '../../core/polyhedron'

/**
 * Geometry of the Pyramorphinx's pieces (see lib/puzzles/pyramid/morph.ts): each is its
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
const SHRINK = 0.985
const STICKER_SCALE = 0.82

/** A cubie's cell (the octant of `signs`) cut by the tetrahedron. */
function pieceFaces(signs: Vec3) {
  const cell: Plane[] = [0, 1, 2].flatMap((a) => {
    const axis = mapVec([0, 0, 0], (_, d) => (d === a ? signs[a]! : 0))
    return [
      { normal: mapVec(axis, (v) => -v), offset: 0 }, // the cube's middle
      { normal: axis, offset: 2 }, // its outside
    ]
  })
  // Each face of the tetrahedron, opposite a corner v: v . p >= -2.
  const tetra = PYRA_VERTICES.map((v) => ({
    normal: mapVec(PYRA_CORNERS[v], (x) => -x),
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
        .map((n) => turn(parseVecKey(n)).join())
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
