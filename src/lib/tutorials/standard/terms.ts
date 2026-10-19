import { byThickness, LAYER_THICKNESS } from '../../core/shape'
import { invertMove } from '../../core/moves'
import { turnedBy } from '../../core/turn'
import type { Cube, CubeColor, Move, Vec3 } from '../../core/types'
import type { Term } from '../../teach/tutorial'

/**
 * The words the cube tutorials use, shown first: the kinds of pieces (by
 * their stickers), and on a mirror cube the six thicknesses its colors
 * stand for, thinnest first.
 */

/** The pieces showing this many stickers. */
const withStickers = (count: number) => (cube: Cube) =>
  cube.flatMap((c, i) => (c.stickers.length === count ? [i] : []))

/** A center, seen from the front; an edge, from the front a little to the
 *  right; a corner, from a corner. */
const FRONT: Vec3 = [0, 0, 1]
const FRONT_RIGHT: Vec3 = [1, 0, 1]
const FRONT_RIGHT_TOP: Vec3 = [1, 1, 1]
export const CENTER: Term = { key: 'termCenter', pieces: withStickers(1), from: () => FRONT }
export const EDGE: Term = { key: 'termEdge', pieces: withStickers(2), from: () => FRONT_RIGHT }
export const CORNER: Term = {
  key: 'termCorner',
  pieces: withStickers(3),
  from: () => FRONT_RIGHT_TOP,
}

/** The ways of turning, shown on the front side (F, then F'): its pieces
 *  lit, seen from the front. */
const FRONT_TURN: Move = { face: 'F', amount: 1 }
const frontPieces = (cube: Cube) =>
  cube.flatMap((_, i) => (turnedBy(cube, FRONT_TURN)(i) ? [i] : []))
export const CLOCKWISE: Term = {
  key: 'termClockwise',
  pieces: frontPieces,
  from: () => FRONT,
  demo: FRONT_TURN,
}
export const COUNTERCLOCKWISE: Term = {
  key: 'termCounterclockwise',
  pieces: frontPieces,
  from: () => FRONT,
  demo: invertMove(FRONT_TURN),
}

/** Where most stickers of a color face: its center's side, or with no
 *  center (a 2x2), the side wearing the most of them. */
function sideOf(cube: Cube, color: CubeColor): Vec3 | null {
  const center = cube.find((c) => c.stickers.length === 1 && c.stickers[0]!.color === color)
  if (center) return center.stickers[0]!.normal
  const normals = cube.flatMap((c) =>
    c.stickers.filter((s) => s.color === color).map((s) => s.normal),
  )
  const count = (n: Vec3) => normals.filter((m) => m.join() === n.join()).length
  return normals.reduce<Vec3 | null>(
    (best, n) => (!best || count(n) > count(best) ? n : best),
    null,
  )
}

/** A thickness: the pieces with a sticker of its color, seen from the
 *  side wearing it. */
export const thicknessKey = (color: CubeColor) => `termThickness${color}`

export const THICKNESSES: readonly Term[] = byThickness(LAYER_THICKNESS.mirror).map((color) => ({
  key: thicknessKey(color),
  only: 'mirror',
  pieces: (cube) => cube.flatMap((c, i) => (c.stickers.some((s) => s.color === color) ? [i] : [])),
  from: (cube) => sideOf(cube, color),
}))

/** The turns Ofapel's method adds: the middle slice (M, between the left
 *  and right sides, turning as the left one) and the top two layers
 *  together (Uw, written u), their pieces lit, shown turning. */
const sliceTerm = (key: string, turn: Move, from: Vec3): Term => ({
  key,
  pieces: (cube) => cube.flatMap((_, i) => (turnedBy(cube, turn)(i) ? [i] : [])),
  from: () => from,
  demo: turn,
})
export const MIDDLE_SLICE = sliceTerm(
  'termMiddleSlice',
  { face: 'L', amount: 1, depth: 2 },
  FRONT_RIGHT_TOP,
)
export const WIDE_TOP = sliceTerm(
  'termWideTop',
  { face: 'U', amount: 1, depth: 2, wide: true },
  FRONT_RIGHT_TOP,
)
