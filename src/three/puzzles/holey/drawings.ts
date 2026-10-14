import type { CubeShape } from '@/lib/core/types'
import type { PolyDrawing } from '../../core/polyDrawing'
import { edgeOnlyPolygons } from '../shared/dinoGeometry'
import { MEGAMINX_DRAWING } from '../polyhedron/drawings'
import { toriPolygons, toriThumbnail } from './toriGeometry'

export const HOLEY_DRAWINGS = {
  holey: MEGAMINX_DRAWING,
  // Upright as the cubes.
  tori: { polygons: toriPolygons, yaw: 0, thumbnail: toriThumbnail },
  // Held as the Dino.
  edge: { polygons: edgeOnlyPolygons, yaw: 0 },
} satisfies Partial<Record<CubeShape, PolyDrawing>>
