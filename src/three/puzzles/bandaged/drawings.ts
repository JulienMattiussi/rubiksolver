import type { CubeShape } from '@/lib/core/types'
import { BLOCKS } from '@/lib/puzzles/bandaged/blocks'
import type { PolyDrawing } from '../../core/polyDrawing'
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

/** Upright as the cubes; the 3x3x3s alike, but turned to show their blocks. */
export const BANDAGED_DRAWINGS = {
  ...(Object.fromEntries(
    (Object.keys(BLOCKS) as (keyof typeof BLOCKS)[]).map((shape) => [
      shape,
      { polygons: bandagedPolygons, thumbnail: bandagedThumbnail, yaw: YAW[shape] ?? 0 },
    ]),
  ) as Record<keyof typeof BLOCKS, PolyDrawing>),
  ai: { polygons: aiPolygons, yaw: 0 },
  roadblock: { polygons: roadblockPolygons, yaw: 0 },
} satisfies Partial<Record<CubeShape, PolyDrawing>>
