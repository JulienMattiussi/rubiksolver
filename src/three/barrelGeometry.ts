import { solvedCube } from '@/lib/cube'
import type { Color, Cubie } from '@/lib/types'
import { cutSolidPolygons } from './cutSolid'

/**
 * Geometry of the Barrel's pieces (the 3x3 model of cube.ts): an octagonal
 * prism, a 3x3x3 whose four upright edges are cut off down to the middle
 * column of each side. Each cut is a face of its own color, made of a top
 * corner, a middle edge and a bottom corner, each cut to a triangle: a
 * corner shows its top (or bottom) and its cut, a middle edge its cut only.
 * Turned out of its column, a cut corner leaves a notch, a whole edge
 * sticks out (cutSolid.ts). A shape mod, as the Z-Twist.
 */

/** The cuts: x and z adding up to at most this, on each upright edge. */
const CUT = 2

/** The color of each cut, by the signs of its x and z. */
const CUT_COLOR: Record<string, Color> = {
  '1,1': 'P',
  '1,-1': 'V',
  '-1,-1': 'T',
  '-1,1': 'L',
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
      ...[0, 1, 2].flatMap((a) =>
        [1, -1].map((sign) => {
          const normal = [0, 0, 0] as unknown as [number, number, number]
          normal[a] = sign
          return { normal, offset: 1.5 }
        }),
      ),
      ...SIGNS.map(([x, z]) => ({ normal: [x, 0, z] as [number, number, number], offset: CUT })),
    ],
    cutColor: ([x, y, z]) => (y === 0 && x !== 0 && z !== 0 ? CUT_COLOR[`${x},${z}`] : undefined),
  },
  solvedCube('barrel'),
)

/** The Barrel's pieces, for the 3D view and for the thumbnail. */
export const barrelPolygons = (cubie: Cubie) => pieces(cubie, false)
export const barrelThumbnail = (cubie: Cubie) => pieces(cubie, true)
