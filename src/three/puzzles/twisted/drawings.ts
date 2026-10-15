import type { CubeShape } from '@/lib/core/types'
import type { PolyDrawing } from '../../core/polyDrawing'
import { PURPLE_OFFSET, purplePolygons } from './purpleGeometry'
import { quarterPolygons } from './quarterGeometry'
import { latchPolygons, latchThumbnail, UNPAINTED } from './latchGeometry'
import { fashionPolygons } from './fashionGeometry'
import { twistPolygons, twistThumbnail } from './twistGeometry'

/** Upright as the cubes. */
export const TWISTED_DRAWINGS = {
  purple: { polygons: purplePolygons, yaw: 0, offset: PURPLE_OFFSET },
  twist: {
    polygons: twistPolygons,
    yaw: 0,
    thumbnail: twistThumbnail,
    // Its side centers turn a quarter on a click, entered.
    editTurns: (position) => position[1] === 0,
  },
  quarter: { polygons: quarterPolygons, yaw: 0, editTurns: () => true },
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
} satisfies Partial<Record<CubeShape, PolyDrawing>>
