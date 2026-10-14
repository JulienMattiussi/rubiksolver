import { FACE_NORMAL, normalIndex } from '@/lib/core/geometry'
import type { Cubie, Face } from '@/lib/core/types'
import { face, type P3, type PiecePolygon } from '../../core/polygons'

/**
 * Geometry of the 2x3x4 tower's pieces (lib/puzzles/tower/tower234.ts): cubes, 1 grid
 * unit across on x, 2 on y and z, each outer face with its sticker.
 */

/** Grid units to scene units, per axis: a cube 0.75 across (the tower
 *  3 units high). */
const SCALE = [0.75, 0.75 / 2, 0.75 / 2]
const HALF = [0.5, 1, 1]
const SHRINK = 0.97
const STICKER_SCALE = 0.86

const SHAPES = new Map<string, PiecePolygon[]>()

/** Every polygon of a piece, where it stands. */
export function tower234Polygons(cubie: Cubie): PiecePolygon[] {
  if (!cubie.stickers.length) return []
  const key = cubie.position.join() + cubie.stickers.map((s) => s.normal.join() + s.color).join('|')
  const known = SHAPES.get(key)
  if (known) return known
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
      p[a] = p[a]! + n[a]! * HALF[a]! * SHRINK
      p[b] = p[b]! + u! * HALF[b]! * SHRINK
      p[c] = p[c]! + v! * HALF[c]! * SHRINK * n[a]!
      return p.map((x, d) => x * SCALE[d]!) as P3
    })
    return face(corners, [...n] as P3, cubie, normalIndex(n), STICKER_SCALE)
  })
  SHAPES.set(key, polygons)
  return polygons
}
