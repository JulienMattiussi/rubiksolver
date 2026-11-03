import type { CubeShape } from '@/lib/core/shapes'
import type { PolyDrawing } from '../../core/polyDrawing'
import { PURPLE_OFFSET, purplePolygons } from './purpleGeometry'
import { quarterPolygons } from './quarterGeometry'
import { latchPolygons, latchThumbnail, UNPAINTED } from './latchGeometry'
import { fashionPolygons } from './fashionGeometry'
import { twistPolygons, twistThumbnail } from './twistGeometry'
import { SQUARE1_ORIENT, square1Polygons, square1Thumbnail } from './square1Geometry'

/** Upright as the cubes. */
export const TWISTED_DRAWINGS = {
  purple: { polygons: purplePolygons, yaw: 0, offset: PURPLE_OFFSET },
  twist: {
    polygons: twistPolygons,
    yaw: 0,
    thumbnail: twistThumbnail,
  },
  quarter: { polygons: quarterPolygons, yaw: 0 },
  latch: {
    polygons: latchPolygons,
    yaw: 0,
    thumbnail: latchThumbnail,
    // Entered, its pieces drawn in their entered colors (their arrows and
    // circles follow them; none until all is painted).
    editLook: (plain, { colors }) => ({
      ...plain,
      stickers: plain.stickers.map((s, i) => ({ ...s, color: colors[i] ?? UNPAINTED })),
    }),
  },
  fashion: { polygons: fashionPolygons, yaw: 0 },
  // Its model lying in its plane, as the Hockey Puck's: stood up as a cube.
  square1: {
    polygons: square1Polygons,
    thumbnail: square1Thumbnail,
    yaw: 0,
    orient: SQUARE1_ORIENT,
  },
} satisfies Partial<Record<CubeShape, PolyDrawing>>
