import type * as THREE from 'three'
import type { CubeShape, Cubie } from '@/lib/core/types'
import type { DecalPlace, PiecePolygon } from './polygons'
import { BANDAGED_DRAWINGS } from '../puzzles/bandaged/drawings'
import { DIAGONAL_DRAWINGS } from '../puzzles/diagonal/drawings'
import { FLAT_DRAWINGS } from '../puzzles/flat/drawings'
import { HOLEY_DRAWINGS } from '../puzzles/holey/drawings'
import { POLYHEDRON_DRAWINGS } from '../puzzles/polyhedron/drawings'
import { PYRAMID_DRAWINGS } from '../puzzles/pyramid/drawings'
import { ROUND_DRAWINGS } from '../puzzles/round/drawings'
import { STANDARD_DRAWINGS } from '../puzzles/standard/drawings'
import { TOWER_DRAWINGS } from '../puzzles/tower/drawings'
import { TWISTED_DRAWINGS } from '../puzzles/twisted/drawings'

/** How a puzzle drawn from polygons is drawn: its pieces' polygons, and its yaw on
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
   *  a point off its middle (the Purple's core). */
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

/**
 * The puzzles drawn from polygons, each category's from its folder's
 * drawings.ts; the others (the cubes, the cuboids, the Gear Cubes) are drawn
 * from cubies (CubeView).
 */
const DRAWINGS: Partial<Record<CubeShape, PolyDrawing>> = {
  ...STANDARD_DRAWINGS,
  ...TOWER_DRAWINGS,
  ...FLAT_DRAWINGS,
  ...PYRAMID_DRAWINGS,
  ...POLYHEDRON_DRAWINGS,
  ...ROUND_DRAWINGS,
  ...DIAGONAL_DRAWINGS,
  ...HOLEY_DRAWINGS,
  ...TWISTED_DRAWINGS,
  ...BANDAGED_DRAWINGS,
}

/** Whether a shape is drawn from polygons (PolyView), not from cubies. */
export const isPolyDrawn = (shape: CubeShape): boolean => shape in DRAWINGS

/** The drawing of a shape drawn from polygons. */
export function polyDrawing(shape: CubeShape): PolyDrawing {
  const drawing = DRAWINGS[shape]
  if (!drawing) throw new Error(`polyDrawing: ${shape} is drawn from cubies`)
  return drawing
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
