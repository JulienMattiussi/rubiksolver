import { dot, mapVec, normalIndex } from '@/lib/core/geometry'
import type { Cubie, Vec3 } from '@/lib/core/types'
import { face, type P3, type PiecePolygon } from '../../core/polygons'
import { polyhedron, type Plane } from '../../core/polyhedron'

/**
 * Geometry of the FTO's pieces (lib/puzzles/polyhedron/fto.ts): the octahedron |x| + |y| + |z|
 * <= 6, cut a third of the way in along each of its four axes (at 2 and
 * -2 along each diagonal). A piece is the cell of its layers along the four
 * axes, read off where it stands: its shape only depends on its slot, so it
 * is drawn where it is; a face on the octahedron bears its sticker.
 */

const REACH = 6
const CUT = 2
/** Model units to scene units: about the 4-Trajber's size. */
const SCALE = 0.4
/** Each piece shrunk about its center, leaving dark seams between them. */
const SHRINK = 0.97
const STICKER_SCALE = 0.8

/** The four axes, one diagonal each, and all eight. */
const AXES: readonly Vec3[] = [
  [1, 1, 1],
  [1, 1, -1],
  [1, -1, 1],
  [-1, 1, 1],
]
const DIAGONALS: readonly Vec3[] = AXES.flatMap((n) => [n, mapVec(n, (v) => -v)])

const minus = (n: Vec3) => mapVec(n, (v) => -v)

/** The planes of a slot's piece: the octahedron, then its layer along each
 *  axis (beyond a cut, or between the two). */
function planesOf(position: Vec3): Plane[] {
  const layers = AXES.flatMap((n): Plane[] => {
    const along = dot(n, position)
    if (along >= CUT) return [{ normal: minus(n), offset: -CUT }]
    if (along <= -CUT) return [{ normal: n, offset: -CUT }]
    return [
      { normal: n, offset: CUT },
      { normal: minus(n), offset: CUT },
    ]
  })
  return [...DIAGONALS.map((normal) => ({ normal, offset: REACH })), ...layers]
}

const SHAPES = new Map<string, { corners: P3[]; normal: Vec3 }[]>()

/** Every polygon of a piece, where it stands; with `outside`, only its
 *  faces on the octahedron (the picker thumbnail, drawn back to front). */
function polygonsOf(cubie: Cubie, outside: boolean): PiecePolygon[] {
  const id = cubie.position.join()
  let faces = SHAPES.get(id)
  if (!faces) {
    faces = polyhedron(planesOf(cubie.position))
    SHAPES.set(id, faces)
  }
  const points = faces.flatMap((f) => f.corners)
  const center = [0, 1, 2].map((d) => points.reduce((s, p) => s + p[d]!, 0) / points.length)
  const toScene = (p: P3): P3 =>
    p.map((v, d) => (center[d]! + (v - center[d]!) * SHRINK) * SCALE) as P3
  return faces.flatMap(({ corners, normal }) => {
    // A face on the octahedron: all its corners on the plane of a diagonal.
    const outer =
      DIAGONALS.some((n) => n.join() === normal.join()) &&
      corners.every((p) => Math.abs(dot(normal, p as unknown as Vec3) - REACH) < 1e-9)
    if (outside && !outer) return []
    const length = Math.hypot(...normal)
    return face(
      corners.map(toScene),
      normal.map((v) => v / length) as P3,
      cubie,
      outer ? normalIndex(normal) : undefined,
      STICKER_SCALE,
    )
  })
}

export const ftoPolygons = (cubie: Cubie) => polygonsOf(cubie, false)
export const ftoThumbnail = (cubie: Cubie) => polygonsOf(cubie, true)

/**
 * How the drawing stands the model, as a quaternion: on its bottom face
 * (the top one, (1, 1, 1), up), the front one ((1, 1, -1)) toward us, as
 * the page holds it.
 */
export const FTO_ORIENT: [number, number, number, number] = (() => {
  // Rows of the rotation: the scene's x, y, z in model coordinates.
  const unit = (v: number[]) => v.map((x) => x / Math.hypot(...v))
  const m = [unit([-1, 1, 0]), unit([1, 1, 1]), unit([1, 1, -2])]
  // A rotation matrix to a quaternion, from its largest diagonal term.
  const [a, b, c] = [m[0]![0]!, m[1]![1]!, m[2]![2]!]
  const at = (i: number, j: number) => m[i]![j]!
  if (a + b + c > 0) {
    const s = Math.sqrt(a + b + c + 1) * 2
    return [(at(2, 1) - at(1, 2)) / s, (at(0, 2) - at(2, 0)) / s, (at(1, 0) - at(0, 1)) / s, s / 4]
  }
  if (a > b && a > c) {
    const s = Math.sqrt(1 + a - b - c) * 2
    return [s / 4, (at(0, 1) + at(1, 0)) / s, (at(0, 2) + at(2, 0)) / s, (at(2, 1) - at(1, 2)) / s]
  }
  if (b > c) {
    const s = Math.sqrt(1 + b - a - c) * 2
    return [(at(0, 1) + at(1, 0)) / s, s / 4, (at(1, 2) + at(2, 1)) / s, (at(0, 2) - at(2, 0)) / s]
  }
  const s = Math.sqrt(1 + c - a - b) * 2
  return [(at(0, 2) + at(2, 0)) / s, (at(1, 2) + at(2, 1)) / s, s / 4, (at(1, 0) - at(0, 1)) / s]
})()
