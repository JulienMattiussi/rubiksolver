import { faceColorsOf } from '@/lib/core/cube'
import { FACE_NORMAL, normalIndex } from '@/lib/core/geometry'
import type { Cubie, Face } from '@/lib/core/types'
import { face, type P3, type PiecePolygon } from '../../core/polygons'

/**
 * Geometry of the Fashion-V's pieces (lib/puzzles/twisted/fashion.ts): its
 * model turns like a 5x5x5 (pieces within +-2), but it stays a cube of
 * three, its outer cells cut in two across one axis: a half there is half
 * as thick (the outer one at +-2, the inner one at +-1), a whole piece (an
 * equator edge, a side center) fills its cell. A half's thin axis is the
 * vertical it had solved, turned with it: the one its top or bottom color
 * faces (an outer half, a top or bottom center), or the one none of its
 * stickers faces across its cell (an inner half). Drawn from where it
 * stands and its colors, as the cube it is.
 */

const SHRINK = 0.97
const STICKER_SCALE = 0.86
const FACES = Object.keys(FACE_NORMAL) as Face[]

/** The axis a piece is half as thick across, if a half. */
function thinAxis(cubie: Cubie): number | undefined {
  const colors = faceColorsOf('fashion')
  const vertical = cubie.stickers.find((s) => s.color === colors.U || s.color === colors.D)
  if (vertical) return vertical.normal.findIndex((v) => v !== 0)
  const outer = cubie.position.findIndex((v) => Math.abs(v) === 2)
  if (outer >= 0) return outer
  // An inner half: across its cell (its non-zero axes), the one no sticker
  // faces; a whole piece's stickers face them all.
  const across = [0, 1, 2].filter((a) => cubie.position[a] !== 0)
  const bare = across.filter((a) => !cubie.stickers.some((s) => s.normal[a] !== 0))
  return bare.length === 1 && across.length > 1 ? bare[0] : undefined
}

/** A piece's box, along each axis: [low, high] in the cube of three. */
function boxOf(cubie: Cubie): [number, number][] {
  const thin = thinAxis(cubie)
  return cubie.position.map((v, a): [number, number] => {
    const s = Math.sign(v)
    if (v === 0) return [-0.5, 0.5]
    if (a !== thin) return s > 0 ? [0.5, 1.5] : [-1.5, -0.5]
    return Math.abs(v) === 2 ? (s > 0 ? [1, 1.5] : [-1.5, -1]) : s > 0 ? [0.5, 1] : [-1, -0.5]
  })
}

/** Every polygon of a piece, as it stands (the hidden core's: none). */
export function fashionPolygons(cubie: Cubie): PiecePolygon[] {
  if (!cubie.stickers.length) return []
  const box = boxOf(cubie)
  const middle = box.map(([lo, hi]) => (lo + hi) / 2)
  const half = box.map(([lo, hi]) => ((hi - lo) / 2) * SHRINK)
  return FACES.flatMap((f) => {
    const n = FACE_NORMAL[f]
    const a = n.findIndex((v) => v !== 0)
    const [b, c] = [(a + 1) % 3, (a + 2) % 3]
    const corners = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ].map(([u, v]) => {
      const p = [...middle]
      p[a] = p[a]! + n[a]! * half[a]!
      p[b] = p[b]! + u! * half[b]!
      p[c] = p[c]! + v! * half[c]! * n[a]!
      return p as P3
    })
    return face(corners, [...n] as P3, cubie, normalIndex(n), STICKER_SCALE)
  })
}
