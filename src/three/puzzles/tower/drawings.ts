import type { CubeShape } from '@/lib/core/types'
import type { PolyDrawing } from '../../core/polyDrawing'
import { camoPolygons } from './camoGeometry'
import { tower234Polygons } from './tower234Geometry'

/** Upright as the cubes. */
export const TOWER_DRAWINGS = {
  '234': { polygons: tower234Polygons, yaw: 0 },
  camo: { polygons: camoPolygons, yaw: 0 },
} satisfies Partial<Record<CubeShape, PolyDrawing>>
