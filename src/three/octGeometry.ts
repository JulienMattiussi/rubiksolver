import { normalIndex } from '@/lib/geometry'
import type { Cubie, Vec3 } from '@/lib/types'
import { face, type P3, type PiecePolygon } from './polygons'
import { polyhedron, type Plane } from './polyhedron'

/**
 * Geometry of the 4-Trajber's Octahedron's pieces (see lib/oct4.ts): each
 * is its cubie's cell of the 4x4x4 (the outer layers open outward) cut by
 * the octahedron |x| + |y| + |z| <= REACH, a convex polyhedron found from
 * its planes. A piece's shape only depends on its slot, so it is drawn
 * where it stands; the face on the octahedron bears its sticker.
 */

/** The octahedron's corners, in model units (cells 2 wide): far enough for
 *  the cube's corners to show a triangle in the middle of each face. */
const REACH = 8
/** Model units to scene units: about the Pyraminx's size. */
const SCALE = 0.3
/** Each piece shrunk about its center, leaving dark seams between them. */
const SHRINK = 0.94
const STICKER_SCALE = 0.84

const DIAGONALS: readonly Vec3[] = [-1, 1].flatMap((x) =>
  [-1, 1].flatMap((y) => [-1, 1].map((z): Vec3 => [x, y, z])),
)

const SHAPES = new Map<string, { corners: P3[]; normal: Vec3 }[]>()

/** The faces of the piece in the cell at `position`. */
function pieceFaces(position: Vec3) {
  const id = position.join()
  let faces = SHAPES.get(id)
  if (!faces) {
    const cell: Plane[] = [0, 1, 2].flatMap((a) => {
      const axis = (sign: number) => [0, 1, 2].map((d) => (d === a ? sign : 0)) as unknown as Vec3
      const c = position[a]!
      // The cell spans c - 1 to c + 1; an outer layer opens outward.
      return [
        ...(c < 3 ? [{ normal: axis(1), offset: c + 1 }] : []),
        ...(c > -3 ? [{ normal: axis(-1), offset: -(c - 1) }] : []),
      ]
    })
    const octahedron = DIAGONALS.map((normal) => ({ normal, offset: REACH }))
    faces = polyhedron([...cell, ...octahedron])
    SHAPES.set(id, faces)
  }
  return faces
}

/** Every polygon of a piece, as it stands. */
export function octPolygons(cubie: Cubie): PiecePolygon[] {
  const faces = pieceFaces(cubie.position)
  const points = faces.flatMap((f) => f.corners)
  const center = [0, 1, 2].map((d) => points.reduce((s, p) => s + p[d]!, 0) / points.length)
  const toScene = (p: P3): P3 =>
    p.map((v, d) => (center[d]! + (v - center[d]!) * SHRINK) * SCALE) as P3
  return faces.flatMap(({ corners, normal }) => {
    const length = Math.hypot(...normal)
    // A face on the octahedron lies across a diagonal: it bears the sticker.
    const ni = length > 1.5 ? normalIndex(normal) : undefined
    return face(corners.map(toScene), normal.map((v) => v / length) as P3, cubie, ni, STICKER_SCALE)
  })
}

/** The octahedron's yaw on screen: its front corner a little to the left. */
export const OCT_YAW = -Math.PI / 12
