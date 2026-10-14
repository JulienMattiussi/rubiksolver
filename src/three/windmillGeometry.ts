import { solvedCube } from '@/lib/cube'
import type { Color, Cubie } from '@/lib/types'
import { cutSolidPolygons } from './cutSolid'

/**
 * Geometry of the Windmill's pieces (lib/fisher.ts): a 3x3x3's mechanism
 * cut to a cube as big as the 3x3 (sides at 1.5), turned about the
 * vertical by the angle that lays each of its upright edges on a vertical
 * cut (cutSolid.ts): cos - sin = 1/3, about 31.4°, its top's corners at
 * (0.5, 2.06), (2.06, -0.5) and the like. Each side shows two columns of
 * the mechanism, a corner's (its corners and middle edge, the wider) and a
 * side center's (its center and two edges); a corner shows two colors, a
 * middle edge one.
 */

const COS = (1 + Math.sqrt(17)) / 6
const SIN = (Math.sqrt(17) - 1) / 6
/** Each side's normal: (cos, 0, sin) and its quarter turns. */
const SIDES = [
  [COS, SIN],
  [SIN, -COS],
  [-COS, -SIN],
  [-SIN, COS],
] as const

/** A side's color: the 3x3 center it mostly faces (along its larger
 *  coordinate). */
const SOLVED_3 = solvedCube('3')
const centerColor = (x: number, z: number): Color =>
  SOLVED_3.find(
    (c) =>
      c.stickers.length === 1 && c.position[0] === x && c.position[1] === 0 && c.position[2] === z,
  )!.stickers[0]!.color

const pieces = cutSolidPolygons(
  {
    planes: [
      { normal: [0, 1, 0], offset: 1.5 },
      { normal: [0, -1, 0], offset: 1.5 },
      ...SIDES.map(([x, z]) => ({ normal: [x, 0, z] as [number, number, number], offset: 1.5 })),
    ],
    cutColor: ([x, y, z]) =>
      y === 0 && x !== 0 && z !== 0
        ? Math.abs(x) > Math.abs(z)
          ? centerColor(Math.sign(x), 0)
          : centerColor(0, Math.sign(z))
        : undefined,
    // Its corners reach past the 3x3's: drawn a little smaller.
    scale: 0.75,
  },
  solvedCube('windmill'),
)

/** The Windmill's pieces, for the 3D view and for the thumbnail. */
export const windmillPolygons = (cubie: Cubie) => pieces(cubie, false)
export const windmillThumbnail = (cubie: Cubie) => pieces(cubie, true)
