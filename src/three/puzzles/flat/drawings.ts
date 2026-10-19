import type { CubeShape } from '@/lib/core/shapes'
import type { PolyDrawing } from '../../core/polyDrawing'
import { GHOST_STICKER } from '../../core/colors'
import { GHOST_YAW, ghostPolygons } from './ghostGeometry'

export const FLAT_DRAWINGS = {
  ghost: { polygons: ghostPolygons, yaw: GHOST_YAW, skin: GHOST_STICKER },
} satisfies Partial<Record<CubeShape, PolyDrawing>>
