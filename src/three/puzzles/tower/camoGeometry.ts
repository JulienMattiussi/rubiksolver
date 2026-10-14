import { camoBox } from '@/lib/puzzles/tower/camo'
import { FACE_NORMAL, normalIndex } from '@/lib/core/geometry'
import type { Cubie, Face } from '@/lib/core/types'
import { face, type P3, type PiecePolygon } from '../../core/polygons'

/**
 * Geometry of the Camouflage's pieces (lib/puzzles/tower/camo.ts): each is its box as it
 * stands, thick or thin, a sticker on each face the model gives one.
 */

/** Each piece shrunk about its center, leaving dark seams between them. */
const SEAM = 0.015
const STICKER_SCALE = 0.86

const SHAPES = new Map<string, PiecePolygon[]>()

/** Every polygon of a piece, as it stands. */
export function camoPolygons(cubie: Cubie): PiecePolygon[] {
  const id = cubie.position.join() + cubie.stickers.map((s) => s.normal.join() + s.color).join('|')
  const known = SHAPES.get(id)
  if (known) return known
  const box = camoBox(cubie).map(([lo, hi]) => [lo + SEAM, hi - SEAM] as const)
  const polygons = (Object.keys(FACE_NORMAL) as Face[]).flatMap((f) => {
    const n = FACE_NORMAL[f]
    const a = n.findIndex((v) => v !== 0)
    // (b, c) a right-handed pair with a: counter-clockwise seen from outside,
    // flipped on a negative face.
    const [b, c] = [(a + 1) % 3, (a + 2) % 3]
    const side = n[a]! > 0 ? 1 : 0
    const corners = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ].map(([u, v]) => {
      const p = [0, 0, 0]
      p[a] = box[a]![side]!
      p[b] = box[b]![u!]!
      p[c] = box[c]![n[a]! > 0 ? v! : 1 - v!]!
      return p as P3
    })
    return face(corners, [...n] as P3, cubie, normalIndex(n), STICKER_SCALE)
  })
  SHAPES.set(id, polygons)
  return polygons
}
