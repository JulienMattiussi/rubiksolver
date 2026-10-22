import { dot, mapVec, normalIndex } from '@/lib/core/geometry'
import type { Cubie, Vec3 } from '@/lib/core/types'
import { face, type P3, type PiecePolygon } from '../../core/polygons'
import { polyhedron, type Plane } from '../../core/polyhedron'

/**
 * Geometry of the Rainbow's pieces (see lib/puzzles/shared/rainbow.ts): the cuboctahedron
 * |x|, |y|, |z| <= 1 (its squares), |x| + |y| + |z| <= 2 (its triangles),
 * shared out between its 12 corners (each corner's cell: nearer it than
 * any other, which splits each square into four) and the 8 fixed centers
 * (the middle of each triangle, cut off toward the center). A piece's shape
 * only depends on its slot, so it is drawn where it stands.
 */

/** Model units to scene units. */
const SCALE = 1.35
/** Each piece shrunk about its center, leaving dark seams between them. */
const SHRINK = 0.98
const STICKER_SCALE = 0.82

const AXES: readonly Vec3[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
]
const DIAGONALS: readonly Vec3[] = [-1, 1].flatMap((x) =>
  [-1, 1].flatMap((y) => [-1, 1].map((z): Vec3 => [x, y, z])),
)
/** The 12 corners: two coordinates +-1, one 0. */
const CORNERS: readonly Vec3[] = [0, 1, 2].flatMap((zero) =>
  [-1, 1].flatMap((a) =>
    [-1, 1].map((b) => {
      const p = [a, b]
      return mapVec([0, 1, 2], (d) => (d === zero ? 0 : p.shift()!))
    }),
  ),
)

const SOLID: Plane[] = [
  ...AXES.map((normal) => ({ normal, offset: 1 })),
  ...DIAGONALS.map((normal) => ({ normal, offset: 2 })),
]

const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]

/** The plane through the center and the middles of the two triangle edges
 *  leaving corner `v` on triangle `d`: the fixed center lies beyond it. */
function centerCut(v: Vec3, d: Vec3): Plane {
  const ends = CORNERS.filter((w) => dot(w, d) === 2 && w.join() !== v.join())
  const [m1, m2] = ends.map((w) => mapVec(v, (x, i) => (x + w[i]!) / 2))
  // Oriented so that the corner's side is normal . p <= 0.
  const normal = cross(m1!, m2!)
  return {
    normal: dot(normal, v) > 0 ? mapVec(normal, (x) => -x) : normal,
    offset: 0,
  }
}

const SHAPES = new Map<string, { corners: P3[]; normal: Vec3 }[]>()

function pieceFaces(position: Vec3) {
  const id = position.join()
  let faces = SHAPES.get(id)
  if (faces) return faces
  const isCenter = position.every((x) => x !== 0)
  let planes: Plane[]
  if (isCenter) {
    // The middle of a triangle: beyond the cuts of its three corners.
    const corners = CORNERS.filter((w) => dot(w, position) === 2)
    planes = corners.map((w) => {
      const cut = centerCut(w, position)
      return { normal: mapVec(cut.normal, (x) => -x), offset: 0 }
    })
  } else {
    // Nearer this corner than any other, short of the triangles' middles.
    const neighbours = CORNERS.filter((w) => w.join() !== id && dot(w, position) > 0)
    planes = [
      ...neighbours.map((w) => ({
        normal: mapVec(w, (x, i) => x - position[i]!),
        offset: 0,
      })),
      ...DIAGONALS.filter((d) => dot(d, position) === 2).map((d) => centerCut(position, d)),
    ]
  }
  faces = polyhedron([...SOLID, ...planes])
  SHAPES.set(id, faces)
  return faces
}

/** Every polygon of a Rainbow piece, as it stands. */
export function rainbowPolygons(cubie: Cubie): PiecePolygon[] {
  const faces = pieceFaces(cubie.position)
  const points = faces.flatMap((f) => f.corners)
  const center = [0, 1, 2].map((d) => points.reduce((s, p) => s + p[d]!, 0) / points.length)
  const toScene = (p: P3): P3 =>
    p.map((v, d) => (center[d]! + (v - center[d]!) * SHRINK) * SCALE) as P3
  return faces.flatMap(({ corners, normal }) => {
    const length = Math.hypot(...normal)
    // The faces on the solid (a square: an axis; a triangle: a diagonal).
    const outer = SOLID.some((p) => p.normal.join() === normal.join())
    return face(
      corners.map(toScene),
      normal.map((v) => v / length) as P3,
      cubie,
      outer ? normalIndex(normal) : undefined,
      STICKER_SCALE,
    )
  })
}

/** How the drawing holds the Rainbow: an eighth of a turn about the front
 *  square's axis, its triangles above, below and on its sides (a
 *  quaternion). */
export const RAINBOW_ORIENT: [number, number, number, number] = [
  0,
  0,
  Math.sin(Math.PI / 8),
  Math.cos(Math.PI / 8),
]

/** Its front square toward the camera (which looks from the right), a
 *  little of the right one showing. */
export const RAINBOW_YAW = Math.PI / 6
