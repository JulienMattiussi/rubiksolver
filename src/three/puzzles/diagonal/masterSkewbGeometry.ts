import { normalIndex } from '@/lib/core/geometry'
import type { Cubie, Vec3 } from '@/lib/core/types'
import { face, type P3, type PiecePolygon } from '../../core/polygons'
import { polyhedron, type Plane } from '../../core/polyhedron'

/**
 * Geometry of the Master Skewb's pieces (lib/puzzles/shared/rainbow.ts): the
 * cube |x|, |y|, |z| <= 4 cut along each of its four diagonals by two planes,
 * at 2 either side of the middle. Each piece is the cell of those cuts its
 * place lies in: on each face, a small center (a diamond), four petals
 * around it, four edges (half diamonds on the face's edges) and four corners
 * (small triangles). A piece's shape only depends on where it stands, so it
 * is drawn there.
 */

/** Model units to scene units, its corners about as far out as a 3x3's. */
const SCALE = 1.5 / 4
/** Each piece shrunk about its center, leaving dark seams between them. */
const SHRINK = 0.98
const STICKER_SCALE = 0.86
/** Where each diagonal is cut, either side of the middle. */
const CUT = 2

const AXES: readonly Vec3[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
]
const CUBE: Plane[] = AXES.map((normal) => ({ normal, offset: 4 }))
const DIAGONALS: readonly Vec3[] = [
  [1, 1, 1],
  [1, 1, -1],
  [1, -1, 1],
  [-1, 1, 1],
]
const minus = (v: Vec3) => v.map((x) => -x + 0) as unknown as Vec3
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

const SHAPES = new Map<string, { corners: P3[]; normal: Vec3 }[]>()

/** The cuts bounding the cell at `position`: along each diagonal, beyond
 *  a cut, or between the two. */
function cutsOf(position: Vec3): Plane[] {
  return DIAGONALS.flatMap((d) => {
    const along = dot(d, position)
    if (along > CUT) return [{ normal: minus(d), offset: -CUT }]
    if (along < -CUT) return [{ normal: d, offset: -CUT }]
    return [
      { normal: d, offset: CUT },
      { normal: minus(d), offset: CUT },
    ]
  })
}

/** Every polygon of a Master Skewb piece, as it stands. */
export function masterSkewbPolygons(cubie: Cubie): PiecePolygon[] {
  const id = cubie.position.join()
  let faces = SHAPES.get(id)
  if (!faces) {
    faces = polyhedron([...CUBE, ...cutsOf(cubie.position)])
    SHAPES.set(id, faces)
  }
  const points = faces.flatMap((f) => f.corners)
  const center = [0, 1, 2].map((d) => points.reduce((s, p) => s + p[d]!, 0) / points.length)
  const toScene = (p: P3): P3 =>
    p.map((v, d) => (center[d]! + (v - center[d]!) * SHRINK) * SCALE) as P3
  return faces.flatMap(({ corners, normal }) => {
    const length = Math.hypot(...normal)
    // Its faces on the cube's carry its stickers.
    const outer = AXES.some((a) => a.join() === normal.join())
    return face(
      corners.map(toScene),
      normal.map((v) => v / length) as P3,
      cubie,
      outer ? normalIndex(normal) : undefined,
      STICKER_SCALE,
    )
  })
}
