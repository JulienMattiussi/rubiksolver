import { normalIndex } from '@/lib/core/geometry'
import type { Color, Cubie } from '@/lib/core/types'

/**
 * Pieces of the gridless puzzles (the star prisms, the Pyraminx) drawn as
 * flat polygons: each face of a piece's body, in plastic, plus a sticker
 * laid on every face that shows a color. Shared by the 3D view, the editor
 * and the picker thumbnail.
 */

export type P3 = [number, number, number]

export interface PiecePolygon {
  readonly points: readonly P3[]
  /** The plastic body, or a sticker of this color. */
  readonly paint: 'body' | Color
  /** Outward normal (unit), for lighting and back-face culling. */
  readonly normal: P3
  /** A normal per point, when the surface is curved (smooth lighting). */
  readonly normals?: readonly P3[]
  /** On a sticker: the normal index of the piece's sticker it shows. */
  readonly ni?: number
  /** Printed on the polygon before it (a mark on a sticker): the picker's
   *  thumbnail draws it right after that one, whatever their depths. */
  readonly on?: true
}

/** Where a decal lies on a piece: the middle of a face, lifted off it, which
 *  way is up on it, and its width (scene units). */
export interface DecalPlace {
  readonly center: P3
  readonly normal: P3
  readonly up: P3
  readonly size: number
}

/** Share of a face its sticker covers, unless told otherwise. */
const STICKER_SCALE = 0.84

/** The same polygon shrunk towards its center, then lifted off its face. */
function sticker(points: readonly P3[], normal: P3, scale: number): P3[] {
  const c = [0, 1, 2].map((a) => points.reduce((s, p) => s + p[a]!, 0) / points.length)
  return points.map((p) => p.map((v, a) => c[a]! + (v - c[a]!) * scale + normal[a]! * 0.004) as P3)
}

/** The color of a piece's sticker of normal index `ni`, if it has one. */
export function colorFacing(cubie: Cubie, ni: number): Color | undefined {
  return cubie.stickers.find((s) => normalIndex(s.normal) === ni)?.color
}

/** A face of a piece's body, plus its sticker when the piece shows a color
 *  there (its sticker of normal index `ni`). */
export function face(
  points: P3[],
  normal: P3,
  cubie?: Cubie,
  ni?: number,
  scale = STICKER_SCALE,
): PiecePolygon[] {
  const body: PiecePolygon = { points, paint: 'body', normal }
  const color = cubie && ni !== undefined ? colorFacing(cubie, ni) : undefined
  return color
    ? [body, { points: sticker(points, normal, scale), paint: color, normal, ni }]
    : [body]
}
