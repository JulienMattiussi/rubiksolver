import { faceColorsOf, isBoxed } from '../../core/cube'
import { atHome } from '../../core/pieces'
import { normalIndex } from '../../core/geometry'
import { invertMoves } from '../../core/moves'
import { parseMoves } from '../../core/notation'
import type { Color, Cube, Cubie, Move } from '../../core/types'
import { DESCEND_CORNER, SWAP_CORNERS } from './domino'

/**
 * 2x2x4 tower, "Two Pockets" method, as taught on fan2cube.fr (tower2242 +
 * domino pages): its formulas and what they read, declared once; the
 * method is its tutorial (lib/tutorials/tower/tower224.ts), which plays
 * them:
 * a tower is two Pockets stacked, an inner one (the eight middle pieces) and
 * an outer one (the eight corners).
 *
 *   I.   Shape         seen as a long Pocket whose corners are bars (a corner
 *                      and the middle piece next to it), every bar is stood
 *                      up again: the tower is back in its box. Wide turns,
 *                      and the page's pivot formula.
 *   II.  Inner Pocket  solved like a Domino: the bottom pieces first (descend
 *                      formula), then the top ones (swap formula). Since the
 *                      outer layers do not matter yet, h and b are turned as
 *                      Uw and Dw, as the page suggests.
 *   III. Outer Pocket  the same two formulas on the outer layers. Descending
 *                      a corner flips the front half of the inner Pocket, so
 *                      corners always come down two by two.
 *
 * Notation (fan2cube -> app): H B A P G D = U D F B L R; H* B* = Uw Dw; a side
 * face of the tower is half of it, so A D = Fw Rw; "D = D2" in parts II and
 * III. The descend and swap formulas are the Domino's (domino.ts), widened.
 * Each formula's effect is asserted in tests/unit/puzzles/tower/tower.test.ts.
 */

/** Pivot two top bars, (HDA) and (HAG): T . H*' . T' . H* with T = D'B*DAB*A'. */
const PIVOT_T = parseMoves("Rw' Dw Rw Fw Dw Fw'")
export const PIVOT = [
  ...PIVOT_T,
  ...parseMoves("Uw'"),
  ...invertMoves(PIVOT_T),
  ...parseMoves('Uw'),
]
/** A side of the tower is half of it: the Domino's side turns become wide. */
const toTower = (moves: readonly Move[]): Move[] =>
  moves.map((m) => (m.face === 'U' || m.face === 'D' ? m : { ...m, depth: 2, wide: true }))
/** Descend one top corner (Domino A, AH'AH.A). */
export const DESCEND = toTower(DESCEND_CORNER)
/** Swap two top-right corners (Domino B). */
export const SWAP = toTower(SWAP_CORNERS)

/** The same formulas on the inner Pocket: h and b turned as Uw and Dw. */
const toInner = (moves: readonly Move[]): Move[] =>
  moves.map((m) =>
    !m.depth && (m.face === 'U' || m.face === 'D') ? { ...m, depth: 2, wide: true } : m,
  )
export const DESCEND_INNER = toInner(DESCEND)
export const SWAP_INNER = toInner(SWAP)

export const isCorner = (c: Cubie): boolean => c.stickers.length === 3
export const isMiddle = (c: Cubie): boolean => c.stickers.length === 2

/** Home in the tower (twins either way round, see `atHome`). */
export const isHome = (c: Cubie): boolean => atHome(c, '224')

const COLORS = faceColorsOf('224')
const UP_DOWN: readonly Color[] = [COLORS.U, COLORS.D]

/** Which way a bar lies: the axis its corner's top or bottom sticker faces
 *  (y = standing). Bars are told apart by octant, a corner per octant. */
export function barAxis(corner: Cubie): number {
  const end = corner.stickers.find((s) => UP_DOWN.includes(s.color))!
  return end.normal.findIndex((v) => v !== 0)
}

/** A bar's pieces, by index: its corner (`corner`, an index) and the
 *  middle beside it, along the way it lies. */
export function barOf(cube: Cube, corner: number): number[] {
  const at = cube[corner]!.position
  const axis = barAxis(cube[corner]!)
  const next = at.map((v, a) => (a === axis ? v - 2 * Math.sign(v) : v))
  const middle = cube.findIndex((c) => isMiddle(c) && c.position.join() === next.join())
  return middle < 0 ? [corner] : [corner, middle]
}

/** Under wide turns the bars move rigidly, so how they lie evolves from this
 *  pattern alone: 3^8 states at most. */
export function barKey(pieces: readonly Cubie[]): string {
  return pieces
    .filter(isCorner)
    .map((c) => `${c.position.map(Math.sign).join('')}${barAxis(c)}`)
    .sort()
    .join(' ')
}

/** Where some pieces stand and how they are turned, twins merged. */
export function layoutKey(pieces: readonly Cubie[]): string {
  return pieces
    .map(
      (c) =>
        `${c.position.join(',')}:${c.stickers
          .map((s) => `${normalIndex(s.normal)}${s.color}`)
          .sort()
          .join('')}`,
    )
    .sort()
    .join(' ')
}

export const isBottomCorner = (c: Cubie): boolean =>
  isCorner(c) && c.stickers.some((s) => s.color === COLORS.D)

/** Back in shape: in its box, every bar standing. */
export const shapeDone = (c: Cube) =>
  isBoxed(c) && c.filter(isCorner).every((corner) => barAxis(corner) === 1)
