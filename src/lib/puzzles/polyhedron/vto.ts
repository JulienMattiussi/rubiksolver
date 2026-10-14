import { layerCoords } from '../../core/geometry'
import { OCT_FACE_COLOR } from './oct4'
import type { Cube, Sticker, Vec3 } from '../../core/types'

/**
 * Octahedra cut from a 3x3x3 a third of the way from each corner, so each
 * face splits like a Pyraminx's, in 9 triangles: the VTO and the GEM-0.
 *
 * The Octahedron VTO (Vertex Turning Octahedron, fan2cube.fr/VTO1): its six
 * corners are the cube's six faces, and turn a quarter at a time, like them,
 * each taking its tip, the four triangles beside it (fan2cube's "centres")
 * and its four edges. Its tips also turn alone, cut two thirds of the way
 * (fan2cube counts their turns apart: 4^6 twice). So it turns on a 5x5's
 * grid: a tip at 2 along its axis, its triangles at 1, the cube's edges at
 * (1, 1, 0); a wide turn (Rw) is the corner's, an outer one (R) its tip's.
 * The cube's corners only meet the faces at their middle point and lie
 * unseen inside, like the core: left out.
 *
 * The cells are not alike: in the octahedron's units (|x| + |y| + |z| <=
 * 3/2), a layer at 0 spans -1/2 to 1/2, at 1 from 1/2 to 1, a tip from 1 on
 * (`VTO_CELL`). A piece shows a face when the face's plane crosses its cell,
 * on its side; it then bears the face's color, as on the 4-Trajber's
 * Octahedron (opposite faces a pair).
 */

/** The octahedron's reach in its own units. */
export const OCT3_REACH = 3 / 2

/** Where a layer coordinate's cell lies along its axis (outer ones open). */
export type CellBounds = (c: number) => readonly [number, number]

/** The VTO's cells: the core's layer, the triangles', the tips'. */
export const VTO_CELL: CellBounds = (c) => {
  const lo = [0.5, 1][Math.abs(c) - 1]
  const hi = [0.5, 1, Infinity][Math.abs(c)]!
  return c === 0 ? [-0.5, 0.5] : c > 0 ? [lo!, hi] : [-hi, -lo!]
}

/** The GEM-0's cells: a 3x3x3's, its outer layers open (then cut flat). */
export const GEM_CELL: CellBounds = (c) =>
  c === 0 ? [-0.5, 0.5] : c > 0 ? [0.5, Infinity] : [-Infinity, -0.5]

/** The faces of the octahedron, by their octant's signs. */
const DIAGONALS: readonly Vec3[] = [-1, 1].flatMap((x) =>
  [-1, 1].flatMap((y) => [-1, 1].map((z): Vec3 => [x, y, z])),
)

/** Whether the cell at `position` shows on the face across diagonal `d`:
 *  the face's plane d . p = reach cuts the cell's part on that side. */
function shows(position: Vec3, d: Vec3, cell: CellBounds): boolean {
  let low = 0
  let high = 0
  for (let a = 0; a < 3; a++) {
    const along = cell(position[a]!).map((v) => d[a]! * v)
    const top = Math.max(...along)
    if (top <= 0) return false // the cell lies on the other side
    low += Math.max(0, Math.min(...along))
    high += top
  }
  return low < OCT3_REACH && OCT3_REACH < high
}

/** Every piece of a grid of `size` layers that shows a face. */
function octahedron(size: number, cell: CellBounds): Cube {
  const cubies: Cube[number][] = []
  for (const x of layerCoords(size)) {
    for (const y of layerCoords(size)) {
      for (const z of layerCoords(size)) {
        const position: Vec3 = [x, y, z]
        const stickers = DIAGONALS.filter((d) => shows(position, d, cell)).map((d): Sticker => ({
          normal: d,
          color: OCT_FACE_COLOR.get(d.join())!,
        }))
        if (stickers.length) cubies.push({ position, stickers })
      }
    }
  }
  return cubies
}

/** The solved VTO: its 6 tips, the 24 triangles beside them (6 pieces of
 *  four), its 12 edges. */
export const solvedVto = (): Cube => octahedron(5, VTO_CELL)

/**
 * The GEM-0 (Jewel, fan2cube.fr/GEM-O1, Christoph Bandelow, 2010): the VTO
 * without its tips, cut flat where they would part from the triangles beside
 * them (|x|, |y|, |z| <= 1). Each corner is a square, golden as on the real
 * puzzle, on the cube's center, beside its four triangles: a 3x3x3's turns.
 */
export function solvedGem(): Cube {
  return octahedron(3, GEM_CELL).map((c) =>
    c.stickers.length === 4
      ? { ...c, stickers: [...c.stickers, { normal: c.position, color: 'C' }] }
      : c,
  )
}
