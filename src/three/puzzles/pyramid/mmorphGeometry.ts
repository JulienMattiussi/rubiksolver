import { solvedCube } from '@/lib/core/cube'
import { parseVecKey } from '@/lib/core/geometry'
import type { Color, Cubie } from '@/lib/core/types'
import { cutSolidPolygons } from '../../core/cutSolid'

/**
 * Geometry of the Master Morphinx's pieces (lib/puzzles/pyramid/mmorph.ts), drawn flat: the
 * 3x3's cells cut by a tetrahedron reaching past the cube, its corners at
 * the cube's corners of even sign (the big corners) and its faces' middles
 * at the others (the small ones), each face its color (cutSolid.ts). The
 * drawing stands it on a face as the Pyramorphinx (`MORPH_ORIENT`).
 */

/** How far the faces lie along their (unnormalized) normals. */
const FAR = 2.4

/** Each face's color, by its normal: the one opposite (1, 1, 1) below,
 *  blue, as on the other pyramids (yellow and blue as a real one wears
 *  them). */
const FACE_COLOR: Record<string, Color> = {
  '-1,-1,-1': 'B',
  '-1,1,1': 'G',
  '1,-1,1': 'R',
  '1,1,-1': 'Y',
}

const pieces = cutSolidPolygons(
  {
    planes: Object.keys(FACE_COLOR).map((key) => ({
      normal: parseVecKey(key),
      offset: FAR,
    })),
    cutColor: (n) => FACE_COLOR[n.join()],
    scale: 0.62,
  },
  solvedCube('mmorph'),
)

/** The Master Morphinx's pieces, for the 3D view and for the thumbnail. */
export const mmorphPolygons = (cubie: Cubie) => pieces(cubie, false)
export const mmorphThumbnail = (cubie: Cubie) => pieces(cubie, true)
