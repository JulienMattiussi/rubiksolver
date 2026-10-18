import type { CubeShape } from '@/lib/core/types'
import type { PolyDrawing } from '../../core/polyDrawing'
import { jingCut, jingPolygons, jingThumbnail } from './jingGeometry'
import { mmorphPolygons, mmorphThumbnail } from './mmorphGeometry'
import { MORPH_ORIENT, morphPolygons } from './morphGeometry'
import { PYRA_YAW, pyraDirection, pyraPolygons } from './pyraGeometry'

export const PYRAMID_DRAWINGS = {
  pyra: { polygons: pyraPolygons(3), yaw: PYRA_YAW, direction: pyraDirection },
  // The Pyraminx's cells, its cut tips colored.
  tetra: { polygons: pyraPolygons(3, true), yaw: PYRA_YAW },
  pyra4: { polygons: pyraPolygons(4), yaw: PYRA_YAW },
  pyra5: { polygons: pyraPolygons(5), yaw: PYRA_YAW },
  jing: { polygons: jingPolygons, yaw: PYRA_YAW, thumbnail: jingThumbnail, cut: jingCut },
  morph: { polygons: morphPolygons, yaw: PYRA_YAW, orient: MORPH_ORIENT },
  // On a face, as the Pyramorphinx.
  mmorph: {
    polygons: mmorphPolygons,
    thumbnail: mmorphThumbnail,
    yaw: PYRA_YAW,
    orient: MORPH_ORIENT,
  },
} satisfies Partial<Record<CubeShape, PolyDrawing>>
