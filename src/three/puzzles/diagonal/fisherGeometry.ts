import { solvedCube } from '@/lib/core/cube'
import type { Color, Cubie } from '@/lib/core/types'
import { cutSolidPolygons } from '../../core/cutSolid'

/**
 * Geometry of the Fisher Cube's pieces (lib/puzzles/diagonal/fisher.ts): a 3x3x3's
 * mechanism cut to a cube turned an eighth about the vertical, as big as
 * the 3x3 (cutSolid.ts). Seen from above, its top is a square standing on
 * a corner of the mechanism's grid: the top center a square, the corners
 * triangles in the middle of its sides, the edges at its corners, on three
 * faces. The side centers are wedges along its upright edges, the middle
 * edges squares in the middle of its sides.
 */

/** How far the sides lie along their (unnormalized) diagonals: as far as
 *  a 3x3's faces, 1.5, once normalized. */
const SIDE = 1.5 * Math.SQRT2

/** The color of each side, by the signs of its x and z. */
const SIDE_COLOR: Record<string, Color> = {
  '1,1': 'G',
  '1,-1': 'R',
  '-1,-1': 'B',
  '-1,1': 'O',
}

const SIGNS = [
  [1, 1],
  [1, -1],
  [-1, -1],
  [-1, 1],
] as const

const pieces = cutSolidPolygons(
  {
    planes: [
      { normal: [0, 1, 0], offset: 1.5 },
      { normal: [0, -1, 0], offset: 1.5 },
      ...SIGNS.map(([x, z]) => ({ normal: [x, 0, z] as [number, number, number], offset: SIDE })),
    ],
    cutColor: ([x, y, z]) => (y === 0 && x !== 0 && z !== 0 ? SIDE_COLOR[`${x},${z}`] : undefined),
  },
  solvedCube('fisher'),
)

/** The Fisher Cube's pieces, for the 3D view and for the thumbnail. */
export const fisherPolygons = (cubie: Cubie) => pieces(cubie, false)
export const fisherThumbnail = (cubie: Cubie) => pieces(cubie, true)
