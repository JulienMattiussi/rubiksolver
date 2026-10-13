import type * as THREE from 'three'
import { isStar, type CubeShape, type Cubie } from '@/lib/types'
import { GHOST_STICKER } from './colors'
import { GHOST_YAW, ghostPolygons } from './ghostGeometry'
import { jingCut, jingPolygons, jingThumbnail } from './jingGeometry'
import { MORPH_ORIENT, morphPolygons } from './morphGeometry'
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
import { dinoPolygons, edgeOnlyPolygons } from './dinoGeometry'
import { rexCut, rexPolygons } from './rexGeometry'
import { camoPolygons } from './camoGeometry'
import {
  numbered,
  PUCK_ORIENT,
  puckNumberPicture,
  puckNumberPlace,
  puckPolygons,
  puckThumbnail,
} from './puckGeometry'
import { toriPolygons, toriThumbnail } from './toriGeometry'
import { twistPolygons, twistThumbnail } from './twistGeometry'
import { RAINBOW_ORIENT, RAINBOW_YAW, rainbowPolygons } from './rainbowGeometry'
import { VIOLET_OFFSET, violetPolygons } from './violetGeometry'
import { gemEmblemPicture } from './gemEmblem'
import type { DecalPlace, PiecePolygon } from './polygons'
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
  /** How the model's frame stands in the scene (a quaternion), when its
   *  polygons and turns are in it (the Pyramorphinx turns like a 2x2). */
  readonly orient?: readonly [number, number, number, number]
  /** Where the model's origin stands in its frame, when its turns are about
   *  a point off its middle (the Violet's core). */
  readonly offset?: readonly [number, number, number]
  /** A picture on some pieces (the GEM-0's emblems):
   *  which pieces (by index, or by what they are), where on each, and the
   *  picture, drawn once. */
  readonly decal?: {
    readonly on: (index: number, cubie: Cubie) => boolean
    readonly place: (cubie: Cubie) => DecalPlace
    readonly picture: (cubie: Cubie) => THREE.Texture
  }
  /** The one color of every sticker, when the puzzle wears a single one
   *  (the Floppy Ghost's silver): its pieces are told apart by shape. */
  readonly skin?: string
}

const STAR: PolyDrawing = { polygons: (c) => starPolygons(c, false), yaw: STAR_YAW }
const STAR4: PolyDrawing = { polygons: (c) => starPolygons(c, true), yaw: STAR_YAW }
const PYRAMINX: PolyDrawing = { polygons: pyraPolygons(3), yaw: PYRA_YAW }
/** The Tetraminx: the Pyraminx's cells, its cut tips colored. */
const TETRAMINX: PolyDrawing = { polygons: pyraPolygons(3, true), yaw: PYRA_YAW }
const MASTER: PolyDrawing = { polygons: pyraPolygons(4), yaw: PYRA_YAW }
const PROFESSOR: PolyDrawing = { polygons: pyraPolygons(5), yaw: PYRA_YAW }
const JING: PolyDrawing = {
  polygons: jingPolygons,
  yaw: PYRA_YAW,
  thumbnail: jingThumbnail,
  cut: jingCut,
}

const MORPH: PolyDrawing = { polygons: morphPolygons, yaw: PYRA_YAW, orient: MORPH_ORIENT }

const OCT4: PolyDrawing = { polygons: octPolygons, yaw: OCT_YAW, thumbnail: octThumbnail }
const VTO: PolyDrawing = { polygons: vtoPolygons, yaw: OCT_YAW, thumbnail: vtoThumbnail }
const GEM: PolyDrawing = {
  polygons: gemPolygons,
  yaw: OCT_YAW,
  thumbnail: gemThumbnail,
  decal: { on: (_, c) => c.stickers.length === 5, place: gemEmblem, picture: gemEmblemPicture },
}
const RAINBOW: PolyDrawing = {
  polygons: rainbowPolygons,
  yaw: RAINBOW_YAW,
  orient: RAINBOW_ORIENT,
}

/** The Dino Cube, upright and square to the view, as the cubes are. */
const DINO: PolyDrawing = { polygons: dinoPolygons, yaw: 0 }
/** The Z-Twist, upright as the cubes. */
const TWIST: PolyDrawing = { polygons: twistPolygons, yaw: 0, thumbnail: twistThumbnail }
/** The Tori, upright as the cubes. */
const TORI: PolyDrawing = { polygons: toriPolygons, yaw: 0, thumbnail: toriThumbnail }
/** The Camouflage, upright as the cubes. */
const CAMO: PolyDrawing = { polygons: camoPolygons, yaw: 0 }
/** The Edge Only, held as the Dino. */
const EDGE: PolyDrawing = { polygons: edgeOnlyPolygons, yaw: 0 }
/** The Hockey Puck, lying flat, its numbers on its pieces' tops. */
const PUCK: PolyDrawing = {
  polygons: puckPolygons,
  thumbnail: puckThumbnail,
  yaw: 0,
  orient: PUCK_ORIENT,
  decal: {
    on: (_, c) => numbered(c),
    place: puckNumberPlace,
    picture: puckNumberPicture,
  },
}
/** The Rex Cube, held as the Dino. */
const REX: PolyDrawing = { polygons: rexPolygons, yaw: 0, cut: rexCut }

const VIOLET: PolyDrawing = {
  polygons: violetPolygons,
  yaw: 0,
  offset: VIOLET_OFFSET,
}

const GHOST: PolyDrawing = { polygons: ghostPolygons, yaw: GHOST_YAW, skin: GHOST_STICKER }

/** The drawing of a shape drawn from polygons (the star prisms, the
 *  Pyraminxes, the Jing, the Pyramorphinx, the Floppy Ghost). */
export function polyDrawing(shape: CubeShape): PolyDrawing {
  if (isStar(shape)) return shape === 'star4' ? STAR4 : STAR
  if (shape === 'morph') return MORPH
  if (shape === 'ghost') return GHOST
  if (shape === 'puck') return PUCK
  if (shape === 'oct4') return OCT4
  if (shape === 'vto') return VTO
  if (shape === 'gem') return GEM
  if (shape === 'rainbow') return RAINBOW
  if (shape === 'dino') return DINO
  if (shape === 'rex') return REX
  if (shape === 'twist') return TWIST
  if (shape === 'tori') return TORI
  if (shape === 'edge') return EDGE
  if (shape === 'camo') return CAMO
  if (shape === 'violet') return VIOLET
  if (shape === 'pyra5') return PROFESSOR
  return shape === 'pyra4'
    ? MASTER
    : shape === 'jing'
      ? JING
      : shape === 'tetra'
        ? TETRAMINX
        : PYRAMINX
}

/** A vector of a drawing's polygons as it stands in the scene: turned by
 *  its frame (`orient`), then its yaw. */
export function inScene(
  drawing: PolyDrawing,
  [x, y, z]: readonly number[],
): [number, number, number] {
  let v: [number, number, number] = [x!, y!, z!]
  if (drawing.orient) {
    const [qx, qy, qz, qw] = drawing.orient
    // v + 2w (q x v) + 2 q x (q x v), q the quaternion's vector part.
    const t = [qy * v[2] - qz * v[1], qz * v[0] - qx * v[2], qx * v[1] - qy * v[0]].map(
      (c) => 2 * c,
    )
    v = [
      v[0] + qw * t[0]! + (qy * t[2]! - qz * t[1]!),
      v[1] + qw * t[1]! + (qz * t[0]! - qx * t[2]!),
      v[2] + qw * t[2]! + (qx * t[1]! - qy * t[0]!),
    ]
  }
  const [cos, sin] = [Math.cos(drawing.yaw), Math.sin(drawing.yaw)]
  return [v[0] * cos + v[2] * sin, v[1], -v[0] * sin + v[2] * cos]
}
