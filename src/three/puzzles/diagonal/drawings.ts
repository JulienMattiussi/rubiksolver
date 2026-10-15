import type { CubeShape } from '@/lib/core/types'
import type { PolyDrawing } from '../../core/polyDrawing'
import { dinoPolygons } from '../shared/dinoGeometry'
import { fisherPolygons, fisherThumbnail } from './fisherGeometry'
import { rexCut, rexPolygons } from './rexGeometry'
import { skewbPolygons } from './skewbGeometry'
import { masterSkewbPolygons } from './masterSkewbGeometry'
import {
  copter3Polygons,
  copter3Thumbnail,
  copterPolygons,
  copterThumbnail,
} from './copterGeometry'
import { windmillPolygons, windmillThumbnail } from './windmillGeometry'

export const DIAGONAL_DRAWINGS = {
  // Upright and square to the view, as the cubes are.
  dino: { polygons: dinoPolygons, yaw: 0 },
  // Held as the Dino.
  skewb: { polygons: skewbPolygons, yaw: 0 },
  masterSkewb: { polygons: masterSkewbPolygons, yaw: 0 },
  rex: { polygons: rexPolygons, yaw: 0, cut: rexCut },
  copter: { polygons: copterPolygons, yaw: 0, thumbnail: copterThumbnail },
  copter3: { polygons: copter3Polygons, yaw: 0, thumbnail: copter3Thumbnail },
  // Upright as the cubes, turned a sixteenth: two sides of its solid show.
  fisher: { polygons: fisherPolygons, yaw: Math.PI / 8, thumbnail: fisherThumbnail },
  windmill: { polygons: windmillPolygons, yaw: 0, thumbnail: windmillThumbnail },
} satisfies Partial<Record<CubeShape, PolyDrawing>>
