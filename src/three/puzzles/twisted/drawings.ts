import type { CubeShape } from '@/lib/core/types'
import type { PolyDrawing } from '../../core/polyDrawing'
import { PURPLE_OFFSET, purplePolygons } from './purpleGeometry'
import { quarterPolygons } from './quarterGeometry'
import { twistPolygons, twistThumbnail } from './twistGeometry'

/** Upright as the cubes. */
export const TWISTED_DRAWINGS = {
  purple: { polygons: purplePolygons, yaw: 0, offset: PURPLE_OFFSET },
  twist: { polygons: twistPolygons, yaw: 0, thumbnail: twistThumbnail },
  quarter: { polygons: quarterPolygons, yaw: 0 },
} satisfies Partial<Record<CubeShape, PolyDrawing>>
