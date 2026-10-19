import { solvedCube } from '@/lib/core/cube'
import type { Cubie } from '@/lib/core/types'
import type { CubeShape } from '@/lib/core/shapes'
import { entersJoints, withJoints } from '@/lib/editor/modes/joints'
import { turnedKeys } from '@/lib/editor/modes/toggles'
import { BLOCKS } from '@/lib/puzzles/bandaged/blocks'
import { fusedAs } from '@/lib/puzzles/bandaged/bonds'
import { withBars } from '@/lib/puzzles/bandaged/roadblock'
import type { EditEntry, PolyDrawing } from '../../core/polyDrawing'
import { aiPolygons } from './aiGeometry'
import { bandagedPolygons, bandagedThumbnail } from './bandagedGeometry'
import { roadblockPolygons } from './roadblockGeometry'

/** How a 3x3x3 turns on screen to show its blocks: the Fused's and the
 *  FusedStripe's 2x2x2, at their back down left, half round, their back (P)
 *  and left (G) in view (the QuadStripe's squares too); the BigBlock's 2x2x3 and the Squarebik's equator
 *  a quarter, their left (G) and front (A). */
const YAW: Partial<Record<keyof typeof BLOCKS, number>> = {
  bigBlock: Math.PI / 2,
  squarebik: Math.PI / 2,
  fused: Math.PI,
  fusedStripe: Math.PI,
  quadStripe: Math.PI,
}

/** A bandaged puzzle's piece while it is entered: fused as its joints say
 *  when they are entered, as solved otherwise. */
const fusedLook =
  (shape: CubeShape) =>
  (plain: Cubie, { joints }: EditEntry): Cubie =>
    entersJoints(shape) ? withJoints([plain], joints)[0]! : fusedAs(plain, solvedCube(shape))

/** Upright as the cubes; the 3x3x3s alike, but turned to show their blocks. */
export const BANDAGED_DRAWINGS = {
  ...(Object.fromEntries(
    (Object.keys(BLOCKS) as (keyof typeof BLOCKS)[]).map((shape) => [
      shape,
      {
        polygons: bandagedPolygons,
        thumbnail: bandagedThumbnail,
        yaw: YAW[shape] ?? 0,
        editLook: fusedLook(shape),
      },
    ]),
  ) as Record<keyof typeof BLOCKS, PolyDrawing>),
  ai: { polygons: aiPolygons, yaw: 0, editLook: fusedLook('ai') },
  // Entered, its centers drawn as their bars lie (its toggles: its faces
  // turned a quarter).
  roadblock: {
    polygons: roadblockPolygons,
    yaw: 0,
    editLook: (plain, { toggles }) => withBars([plain], turnedKeys(toggles))[0]!,
  },
} satisfies Partial<Record<CubeShape, PolyDrawing>>
