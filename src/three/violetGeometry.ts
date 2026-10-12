import { FACE_NORMAL, normalIndex } from '@/lib/geometry'
import type { Cubie, Face } from '@/lib/types'
import { face, type P3, type PiecePolygon } from './polygons'

/**
 * Geometry of the Violet's pieces (see lib/violet.ts): each is a box about
 * its position, 4 model units wide for a big cube (odd coordinates), 2 for
 * a mini (even ones). The real puzzle is violet all over, so every face of a
 * piece is, the ones a turn brings out included; the model's stickers only
 * say which face looks out.
 */

/** Model units to scene units: the solved cube (8 units) about as big as a
 *  3x3's. */
const SCALE = 3 / 8
/** Each piece shrunk about its center, leaving dark seams between them. */
const SHRINK = 0.96
const STICKER_SCALE = 0.9

/** Where the solved cube's center is in the model, its box being off the
 *  core (-5 to 3 on every axis), in scene units: the drawing's offset. */
export const VIOLET_OFFSET: readonly [number, number, number] = [SCALE, SCALE, SCALE]

/** Every polygon of a piece, as it stands. */
export function violetPolygons(cubie: Cubie): PiecePolygon[] {
  const h = (Math.abs(cubie.position[0]) % 2 === 1 ? 2 : 1) * SHRINK
  return (Object.keys(FACE_NORMAL) as Face[]).flatMap((f) => {
    const n = FACE_NORMAL[f]
    const a = n.findIndex((v) => v !== 0)
    // (b, c) a right-handed pair with a, so their quarter is counter-clockwise
    // seen from outside (flipped on a negative face).
    const [b, c] = [(a + 1) % 3, (a + 2) % 3]
    const corners = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ].map(([u, v]) => {
      const p = [...cubie.position] as number[]
      p[a] = p[a]! + n[a]! * h
      p[b] = p[b]! + u! * h
      p[c] = p[c]! + v! * h * n[a]!
      return p.map((x) => x * SCALE) as P3
    })
    const ni = normalIndex(n)
    // Violet everywhere: a face with no sticker in the model still is.
    const shown = cubie.stickers.some((s) => normalIndex(s.normal) === ni)
      ? cubie
      : { ...cubie, stickers: [...cubie.stickers, { normal: n, color: 'V' as const }] }
    return face(corners, [...n] as P3, shown, ni, STICKER_SCALE)
  })
}
