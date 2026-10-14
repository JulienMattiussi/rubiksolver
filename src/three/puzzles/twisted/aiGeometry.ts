import { FACE_NORMAL, normalIndex } from '@/lib/core/geometry'
import { isBlock } from '@/lib/puzzles/twisted/ai'
import type { Cubie, Face } from '@/lib/core/types'
import { face, type P3, type PiecePolygon } from '../../core/polygons'

/**
 * Geometry of the AI Cube's pieces (lib/puzzles/twisted/ai.ts): boxes on the 4x4x4's grid
 * (units of half a cubie), a small cube one cell wide, a big block two, each
 * outer face with its sticker.
 */

/** Grid units to scene units: as big as the other cubes. */
const SCALE = 0.4
const SHRINK = 0.97
const STICKER_SCALE = 0.86

const SHAPES = new Map<string, PiecePolygon[]>()

/** Every polygon of a piece, where it stands. */
export function aiPolygons(cubie: Cubie): PiecePolygon[] {
  const key = cubie.position.join() + cubie.stickers.map((s) => s.normal.join() + s.color).join('|')
  const known = SHAPES.get(key)
  if (known) return known
  const h = (isBlock(cubie) ? 2 : 1) * SHRINK
  const polygons = (Object.keys(FACE_NORMAL) as Face[]).flatMap((f) => {
    const n = FACE_NORMAL[f]
    const a = n.findIndex((v) => v !== 0)
    const [b, c] = [(a + 1) % 3, (a + 2) % 3]
    const corners = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ].map(([u, v]) => {
      const p: number[] = [...cubie.position]
      p[a] = p[a]! + n[a]! * h
      p[b] = p[b]! + u! * h
      p[c] = p[c]! + v! * h * n[a]!
      return p.map((x) => x * SCALE) as P3
    })
    return face(corners, [...n] as P3, cubie, normalIndex(n), STICKER_SCALE)
  })
  SHAPES.set(key, polygons)
  return polygons
}
