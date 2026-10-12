import { isStar, type CubeShape, type Cubie } from '@/lib/types'
import { jingCut, jingPolygons, jingThumbnail } from './jingGeometry'
import type { PiecePolygon } from './polygons'
import { PYRA_YAW, pyraPolygons } from './pyraGeometry'
import { STAR_YAW, starPolygons } from './starGeometry'

/** How a gridless puzzle is drawn: its pieces' polygons, and its yaw on
 *  screen (the turn about the vertical that shows it best). */
export interface PolyDrawing {
  readonly polygons: (cubie: Cubie) => PiecePolygon[]
  readonly yaw: number
  /** Lighter polygons for the picker thumbnail, when the 3D ones are many. */
  readonly thumbnail?: (cubie: Cubie) => PiecePolygon[]
  /** What to draw, still, while these pieces turn: the inside the turn
   *  opens (the Jing's cut sphere), when the pieces do not close it. */
  readonly cut?: (moving: readonly Cubie[]) => PiecePolygon[]
}

const STAR: PolyDrawing = { polygons: (c) => starPolygons(c, false), yaw: STAR_YAW }
const STAR4: PolyDrawing = { polygons: (c) => starPolygons(c, true), yaw: STAR_YAW }
const PYRAMINX: PolyDrawing = { polygons: pyraPolygons(3), yaw: PYRA_YAW }
const MASTER: PolyDrawing = { polygons: pyraPolygons(4), yaw: PYRA_YAW }
const JING: PolyDrawing = {
  polygons: jingPolygons,
  yaw: PYRA_YAW,
  thumbnail: jingThumbnail,
  cut: jingCut,
}

/** The drawing of a gridless shape (the star prisms, the Pyraminxes, the Jing). */
export function polyDrawing(shape: CubeShape): PolyDrawing {
  if (isStar(shape)) return shape === 'star4' ? STAR4 : STAR
  return shape === 'pyra4' ? MASTER : shape === 'jing' ? JING : PYRAMINX
}
