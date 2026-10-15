import { mapVec, normalIndex } from '@/lib/core/geometry'
import type { Cubie, Vec3 } from '@/lib/core/types'
import { face, type P3, type PiecePolygon } from '../../core/polygons'
import { polyhedron, type Plane } from '../../core/polyhedron'

/**
 * Geometry of the Skewb's pieces (lib/puzzles/shared/skewbs.ts): the cube
 * |x|, |y|, |z| <= 1 cut through its middle by the four planes square to
 * its diagonals. A corner is the part beyond the three planes square to the
 * diagonals next to its own (a triangle on each of its faces); a center
 * what is left about its axis (a diamond on its face). A piece's shape
 * only depends on where it stands, so it is drawn there.
 */

/** Model units to scene units, its corners about as far out as a 3x3's. */
const SCALE = 1.5
/** Each piece shrunk about its center, leaving dark seams between them. */
const SHRINK = 0.99
const STICKER_SCALE = 0.9

const AXES: readonly Vec3[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
]
const CUBE: Plane[] = AXES.map((normal) => ({ normal, offset: 1 }))

const SHAPES = new Map<string, { corners: P3[]; normal: Vec3 }[]>()

/** The cuts bounding the piece at `position`: a corner's, each diagonal
 *  next to its own (one sign flipped), it on the far side; a center's, each
 *  diagonal of a corner on its face with the two other signs flipped. */
function cutsOf(position: Vec3): Plane[] {
  const corner = position.every((v) => v !== 0)
  if (corner) {
    return [0, 1, 2].map((flip) => ({
      normal: mapVec(position, (v, a) => (a === flip ? v : -v)),
      offset: 0,
    }))
  }
  const axis = position.findIndex((v) => v !== 0)
  return [1, -1].flatMap((s) =>
    [1, -1].map((t) => {
      const [u, v] = [0, 1, 2].filter((a) => a !== axis) as [number, number]
      const normal = [0, 0, 0] as [number, number, number]
      normal[axis] = -position[axis]!
      normal[u] = s
      normal[v] = t
      return { normal, offset: 0 }
    }),
  )
}

/** Every polygon of a Skewb piece, as it stands. */
export function skewbPolygons(cubie: Cubie): PiecePolygon[] {
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
