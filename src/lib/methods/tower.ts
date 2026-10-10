import { FACE_COLOR, FACE_NORMAL, isBoxed, isSolved, normalIndex, solvedCube } from '../cube'
import { invertMoves, parseMoves } from '../moves'
import { moveSet } from '../moveSet'
import { solvePieces } from '../pieceSearch'
import type { MethodPlan } from '../solverKit'
import type { Color, Cube, Cubie, Face, Move } from '../types'

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
 * III. Each formula's effect is asserted in tests/unit/tower.test.ts.
 */

/** Pivot two top bars, (HDA) and (HAG): T . H*' . T' . H* with T = D'B*DAB*A'. */
const PIVOT_T = parseMoves("Rw' Dw Rw Fw Dw Fw'")
export const PIVOT = [
  ...PIVOT_T,
  ...parseMoves("Uw'"),
  ...invertMoves(PIVOT_T),
  ...parseMoves('Uw'),
]
/** Descend one top corner: AH'AH.A, with A = A2. */
export const DESCEND = parseMoves("Fw2 U' Fw2 U Fw2")
/** Swap two top-right corners: DH(DH')2.B.DH'DH.DB', with D = D2. */
export const SWAP = parseMoves("Rw2 U Rw2 U' Rw2 U' D Rw2 U' Rw2 U Rw2 D'")

/** The same formulas on the inner Pocket: h and b turned as Uw and Dw. */
const toInner = (moves: readonly Move[]): Move[] =>
  moves.map((m) =>
    !m.depth && (m.face === 'U' || m.face === 'D') ? { ...m, depth: 2, wide: true } : m,
  )
const DESCEND_INNER = toInner(DESCEND)
const SWAP_INNER = toInner(SWAP)

const SOLVED = solvedCube('224')
const isCorner = (c: Cubie): boolean => c.stickers.length === 3
const isMiddle = (c: Cubie): boolean => c.stickers.length === 2
const CORNERS = SOLVED.filter(isCorner).map((c) => c.position)
const MIDDLES = SOLVED.filter(isMiddle).map((c) => c.position)
const ALL = [...CORNERS, ...MIDDLES]

const FACE_OF_NORMAL = Object.fromEntries(
  (Object.keys(FACE_NORMAL) as Face[]).map((f) => [normalIndex(FACE_NORMAL[f]), f]),
) as Record<number, Face>

/** Home slots, by position: which faces a piece there shows when solved. */
const HOME = new Map(SOLVED.map((c) => [c.position.join(','), c.stickers.length]))

/**
 * A piece is home when it sits in a slot of the boxed tower with every
 * sticker showing its own face's color. Colors, not identities: either of
 * two twin middles (same colors) is right in either spot.
 */
function atHome(c: Cubie): boolean {
  return (
    HOME.get(c.position.join(',')) === c.stickers.length &&
    c.stickers.every((s) => FACE_COLOR[FACE_OF_NORMAL[normalIndex(s.normal)]!] === s.color)
  )
}

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

/** Positions and colors of some pieces, twins merged. */
function colorKey(pieces: readonly Cubie[]): string {
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
const innerDone = (c: Cube) => shapeDone(c) && c.filter(isMiddle).every(atHome)

const SHAPE_TURNS = moveSet('Uw Dw Rw Fw')
const INNER_TURNS = moveSet('Uw Dw Rw2 Fw2')
const OUTER_TURNS = moveSet('U D Rw2 Fw2')

/** I. Stand every bar up: pivots, brought to the bars by wide setup turns. */
function standBars(cube: Cube): Move[] {
  return solvePieces(cube, {
    track: CORNERS,
    moves: moveSet('Uw Dw Rw2 Fw2'),
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
    goal: (p) => p.filter((c) => c.position[1] < 0).every(atHome),
    key: colorKey,
    maxDepth: 16,
  })
}

function innerTop(cube: Cube): Move[] {
  return solvePieces(cube, {
    track: MIDDLES,
    moves: moveSet('Uw'),
    macros: [SWAP_INNER],
    goal: (p) => p.every(atHome),
    key: colorKey,
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
    goal: (p) => p.filter((c) => isMiddle(c) || c.position[1] < 0).every(atHome),
    key: (p) => colorKey(p.filter((c) => isMiddle(c) || isBottomCorner(c))),
    maxDepth: 20,
  })
}

/** III.B: top corners. The swap keeps everything else, so the corners decide. */
function outerTop(cube: Cube): Move[] {
  return solvePieces(cube, {
    track: CORNERS,
    moves: moveSet('U'),
    macros: [SWAP],
    goal: (p) => p.every(atHome),
    key: colorKey,
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
  { key: 'stepOuterPocket', goal: isSolved, moves: OUTER_TURNS, phases: [outerBottom, outerTop] },
]
