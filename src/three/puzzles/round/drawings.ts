import type { CubeShape } from '@/lib/core/types'
import type { PolyDrawing } from '../../core/polyDrawing'
import { barrelPolygons, barrelThumbnail } from './barrelGeometry'
import { dinoCylPolygons, dinoCylThumbnail } from './dinoCylGeometry'
import {
  numbered,
  PUCK_ORIENT,
  puckNumberPicture,
  puckNumberPlace,
  puckPolygons,
  puckThumbnail,
} from './puckGeometry'
import { STAR_YAW, starPolygons } from './starGeometry'

export const ROUND_DRAWINGS = {
  star: { polygons: (c) => starPolygons(c, false), yaw: STAR_YAW },
  star4: { polygons: (c) => starPolygons(c, true), yaw: STAR_YAW },
  // Lying flat, its numbers on its pieces' tops.
  puck: {
    polygons: puckPolygons,
    thumbnail: puckThumbnail,
    yaw: 0,
    orient: PUCK_ORIENT,
    decal: { on: (_, c) => numbered(c), place: puckNumberPlace, picture: puckNumberPicture },
  },
  dinoCyl: { polygons: dinoCylPolygons, yaw: 0, thumbnail: dinoCylThumbnail },
  // Upright as the cubes.
  barrel: { polygons: barrelPolygons, yaw: 0, thumbnail: barrelThumbnail },
} satisfies Partial<Record<CubeShape, PolyDrawing>>
