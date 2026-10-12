import { isStar, type CubeShape, type Cubie } from '@/lib/types'
import type { PiecePolygon } from './polygons'
import { PYRA_YAW, pyraPolygons } from './pyraGeometry'
import { STAR_YAW, starPolygons } from './starGeometry'

/** How a gridless puzzle is drawn: its pieces' polygons, and its yaw on
 *  screen (the turn about the vertical that shows it best). */
export interface PolyDrawing {
  readonly polygons: (cubie: Cubie) => PiecePolygon[]
  readonly yaw: number
}

const STAR: PolyDrawing = { polygons: (c) => starPolygons(c, false), yaw: STAR_YAW }
const STAR4: PolyDrawing = { polygons: (c) => starPolygons(c, true), yaw: STAR_YAW }
const PYRAMINX: PolyDrawing = { polygons: pyraPolygons(3), yaw: PYRA_YAW }
const MASTER: PolyDrawing = { polygons: pyraPolygons(4), yaw: PYRA_YAW }

/** The drawing of a gridless shape (the star prisms, the Pyraminxes). */
export function polyDrawing(shape: CubeShape): PolyDrawing {
  if (isStar(shape)) return shape === 'star4' ? STAR4 : STAR
  return shape === 'pyra4' ? MASTER : PYRAMINX
}
