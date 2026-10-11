import { atHome, FACE_COLOR, homesOf, isBoxed, isSolved } from '../cube'
import { normalIndex } from '../geometry'
import { invertMoves, parseMoves } from '../moves'
import { moveSet } from '../moveSet'
import { solvePieces } from '../pieceSearch'
import type { MethodPlan } from '../solverKit'
import type { Color, Cube, Cubie, Move } from '../types'
import { DESCEND_CORNER, SWAP_CORNERS } from './domino'

/**
 * 2x2x4 tower, "Two Pockets" method, as taught on fan2cube.fr (tower2242 +
 * domino pages):
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
 * Each formula's effect is asserted in tests/unit/tower.test.ts.
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
const DESCEND_INNER = toInner(DESCEND)
const SWAP_INNER = toInner(SWAP)

const isCorner = (c: Cubie): boolean => c.stickers.length === 3
const isMiddle = (c: Cubie): boolean => c.stickers.length === 2
const CORNERS = homesOf('224', isCorner)
const MIDDLES = homesOf('224', isMiddle)
const ALL = [...CORNERS, ...MIDDLES]

/** Home in the tower (twins either way round, see `atHome`). */
const isHome = (c: Cubie): boolean => atHome(c, '224')

const UP_DOWN: readonly Color[] = [FACE_COLOR.U, FACE_COLOR.D]

/** Which way a bar lies: the axis its corner's white or yellow sticker faces
 *  (y = standing). Bars are told apart by octant, a corner per octant. */
function barAxis(corner: Cubie): number {
  const end = corner.stickers.find((s) => UP_DOWN.includes(s.color))!
  return end.normal.findIndex((v) => v !== 0)
}

/** Under wide turns the bars move rigidly, so how they lie evolves from this
 *  pattern alone: 3^8 states at most. */
function barKey(pieces: readonly Cubie[]): string {
  return pieces
    .filter(isCorner)
    .map((c) => `${c.position.map(Math.sign).join('')}${barAxis(c)}`)
    .sort()
    .join(' ')
}

/** Where some pieces stand and how they are turned, twins merged. */
function layoutKey(pieces: readonly Cubie[]): string {
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

const isBottomCorner = (c: Cubie): boolean =>
  isCorner(c) && c.stickers.some((s) => s.color === FACE_COLOR.D)

// Step goals, on the whole tower.
const shapeDone = (c: Cube) =>
  isBoxed(c) && c.filter(isCorner).every((corner) => barAxis(corner) === 1)
const innerDone = (c: Cube) => shapeDone(c) && c.filter(isMiddle).every(isHome)

const SHAPE_TURNS = moveSet('Uw Dw Rw Fw')
const INNER_TURNS = moveSet('Uw Dw Rw2 Fw2')
const OUTER_POCKET_TURNS = moveSet('U D Rw2 Fw2')

/** I. Stand every bar up: pivots, brought to the bars by wide setup turns. */
function standBars(cube: Cube): Move[] {
  return solvePieces(cube, {
    track: CORNERS,
    moves: INNER_TURNS, // the same wide turns set the bars up under the pivot
    macros: [PIVOT, invertMoves(PIVOT)],
    goal: (p) => p.every((c) => barAxis(c) === 1),
    key: barKey,
    maxDepth: 16,
  })
}

/** II.A then II.B: the inner Pocket, bottom pieces first. */
function innerBottom(cube: Cube): Move[] {
  return solvePieces(cube, {
    track: MIDDLES,
    moves: moveSet('Uw Dw'),
    macros: [DESCEND_INNER],
    goal: (p) => p.filter((c) => c.position[1] < 0).every(isHome),
    key: layoutKey,
    maxDepth: 16,
  })
}

function innerTop(cube: Cube): Move[] {
  return solvePieces(cube, {
    track: MIDDLES,
    moves: moveSet('Uw'),
    macros: [SWAP_INNER],
    goal: (p) => p.every(isHome),
    key: layoutKey,
    maxDepth: 16,
  })
}

/** III.A: bottom corners, two by two (the middles must come back). Keyed on
 *  the bottom corners and the middles, all the goal reads. */
function outerBottom(cube: Cube): Move[] {
  return solvePieces(cube, {
    track: ALL,
    moves: moveSet('U D'),
    macros: [DESCEND],
    goal: (p) => p.filter((c) => isMiddle(c) || c.position[1] < 0).every(isHome),
    key: (p) => layoutKey(p.filter((c) => isMiddle(c) || isBottomCorner(c))),
    maxDepth: 20,
  })
}

/** III.B: top corners. The swap keeps everything else, so the corners decide. */
function outerTop(cube: Cube): Move[] {
  return solvePieces(cube, {
    track: CORNERS,
    moves: moveSet('U'),
    macros: [SWAP],
    goal: (p) => p.every(isHome),
    key: layoutKey,
    maxDepth: 16,
  })
}

export const TOWER_PLAN: MethodPlan = [
  { key: 'stepTowerShape', goal: shapeDone, moves: SHAPE_TURNS, phases: [standBars] },
  {
    key: 'stepInnerPocket',
    goal: innerDone,
    moves: INNER_TURNS,
    phases: [innerBottom, innerTop],
  },
  {
    key: 'stepOuterPocket',
    goal: isSolved,
    moves: OUTER_POCKET_TURNS,
    phases: [outerBottom, outerTop],
  },
]
