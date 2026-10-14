import type { CubeShape } from '@/lib/core/types'
import type { PolyDrawing } from '../../core/polyDrawing'
import { superPolygons } from './superGeometry'

export const STANDARD_DRAWINGS = {
  super4: { polygons: superPolygons(3), yaw: 0 },
  super5: { polygons: superPolygons(2), yaw: 0 },
} satisfies Partial<Record<CubeShape, PolyDrawing>>
