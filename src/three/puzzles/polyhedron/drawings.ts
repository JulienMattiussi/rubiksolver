import type { CubeShape } from '@/lib/core/shapes'
import type { PolyDrawing } from '../../core/polyDrawing'
import { FTO_ORIENT, ftoPolygons, ftoThumbnail } from './ftoGeometry'
import { gemEmblemPicture } from './gemEmblem'
import { crystalPolygons, crystalThumbnail, megaPolygons, megaThumbnail } from './megaGeometry'
import {
  gemEmblem,
  gemPolygons,
  gemThumbnail,
  OCT_YAW,
  octPolygons,
  octThumbnail,
  vtoPolygons,
  vtoThumbnail,
} from './octGeometry'
import { RAINBOW_ORIENT, RAINBOW_YAW, rainbowPolygons } from './rainbowGeometry'
import { real, skewbUPolygons, skewbUThumbnail } from './skewbUGeometry'

/** The Megaminx, its top up, a face in front. */
export const MEGAMINX_DRAWING: PolyDrawing = {
  polygons: megaPolygons,
  yaw: 0,
  thumbnail: megaThumbnail,
}

export const POLYHEDRON_DRAWINGS = {
  oct4: { polygons: octPolygons, yaw: OCT_YAW, thumbnail: octThumbnail },
  vto: { polygons: vtoPolygons, yaw: OCT_YAW, thumbnail: vtoThumbnail },
  gem: {
    polygons: gemPolygons,
    yaw: OCT_YAW,
    thumbnail: gemThumbnail,
    decal: { on: (_, c) => c.stickers.length === 5, place: gemEmblem, picture: gemEmblemPicture },
  },
  fto: { polygons: ftoPolygons, yaw: Math.PI / 4, thumbnail: ftoThumbnail, orient: FTO_ORIENT },
  rainbow: { polygons: rainbowPolygons, yaw: RAINBOW_YAW, orient: RAINBOW_ORIENT },
  megaminx: MEGAMINX_DRAWING,
  // Held as the Megaminx.
  crystal: { polygons: crystalPolygons, yaw: 0, thumbnail: crystalThumbnail },
  // Held as the Dino.
  skewbU: { polygons: skewbUPolygons, yaw: 0, thumbnail: skewbUThumbnail, direction: real },
} satisfies Partial<Record<CubeShape, PolyDrawing>>
