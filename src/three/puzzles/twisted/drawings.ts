import type { CubeShape } from '@/lib/core/types'
import type { PolyDrawing } from '../../core/polyDrawing'
import { aiPolygons } from './aiGeometry'
import { quarterPolygons } from './quarterGeometry'
import { roadblockPolygons } from './roadblockGeometry'
import { twistPolygons, twistThumbnail } from './twistGeometry'
import { VIOLET_OFFSET, violetPolygons } from './violetGeometry'

/** Upright as the cubes. */
export const TWISTED_DRAWINGS = {
  violet: { polygons: violetPolygons, yaw: 0, offset: VIOLET_OFFSET },
  twist: { polygons: twistPolygons, yaw: 0, thumbnail: twistThumbnail },
  quarter: { polygons: quarterPolygons, yaw: 0 },
  ai: { polygons: aiPolygons, yaw: 0 },
  roadblock: { polygons: roadblockPolygons, yaw: 0 },
} satisfies Partial<Record<CubeShape, PolyDrawing>>
