import type { Cubie } from '@/lib/core/types'
import type { CubeShape } from '@/lib/core/shapes'
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
import { starToCartesian } from '@/lib/puzzles/round/star'
import { STAR_YAW, starPolygons } from './starGeometry'

/** A star prism's screw half disc: a piece of its middle layer. */
const onScrew = (cubie: Cubie) => cubie.position[1] === 0

export const ROUND_DRAWINGS = {
  // Its screw's half discs sit on top of the points around them.
  star: {
    polygons: (c) => starPolygons(c, false),
    yaw: STAR_YAW,
    drawnOver: onScrew,
    direction: starToCartesian,
  },
  star4: {
    polygons: (c) => starPolygons(c, true),
    yaw: STAR_YAW,
    drawnOver: onScrew,
    direction: starToCartesian,
  },
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
