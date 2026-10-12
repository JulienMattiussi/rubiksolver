import { isSolved } from '../cube'
import { homeAt, homesOf } from '../pieces'
import { parseMoves } from '../moves'
import { moveSet } from '../moveSet'
import { solvePieces } from '../pieceSearch'
import type { MethodPlan } from '../solverKit'
import type { Cube, Cubie, Move, Vec3 } from '../types'

/**
 * Domino (3x3x2), "corners then edges", as taught on fan2cube.fr (domino
 * pages): a 3x3 without its middle layer, whose pieces have no orientation.
 * U and D turn freely, the sides only take half turns, and the two centers
 * never move, so the color frame is the standard one.
 *
 *   A. Bottom corners  brought down one by one (descend formula), placed
 *                      with U and D
 *   B. Top corners     swapped two at a time
 *   C. Bottom edges    brought down one by one
 *   D. Top edges       cycled three at a time, or swapped two at a time
 *
 * Notation (page -> app): H B A P G D = U D F B L R, every side turn being a
 * half turn. Each formula's effect is asserted in tests/unit/domino.test.ts.
 */

/** A: (HDA) -> (BAD), AH'AH.A */
export const DESCEND_CORNER = parseMoves("F2 U' F2 U F2")
/** B: (HDA) <-> (HPD), DH(DH')2.B.DH'DHD.B' */
export const SWAP_CORNERS = parseMoves("R2 U R2 U' R2 U' D R2 U' R2 U R2 D'")
/** C: (HD) -> (BD), B2D(B2A)3DB2 */
export const DESCEND_EDGE = parseMoves('D2 R2 D2 F2 D2 F2 D2 F2 R2 D2')
/** D: (HP) -> (HA) -> (HD), DHDH'.(DH2)2.DH'DH.(DH2)2 */
export const CYCLE_EDGES = parseMoves("R2 U R2 U' R2 U2 R2 U2 R2 U' R2 U R2 U2 R2 U2")
/** D: (HA) <-> (HD), DBP.(H2D)3.PB'D */
export const SWAP_EDGES_RIGHT = parseMoves("R2 D B2 U2 R2 U2 R2 U2 R2 B2 D' R2")
/** D: (HA) <-> (HP), (H2D)3 */
export const SWAP_EDGES_BACK = parseMoves('U2 R2 U2 R2 U2 R2')

const isCorner = (c: Cubie) => c.stickers.length === 3
const isEdge = (c: Cubie) => c.stickers.length === 2
const isBottom = (c: Cubie) => c.position[1] < 0

const BOTTOM_CORNERS = homesOf('332', (c) => isCorner(c) && isBottom(c))
const CORNERS = homesOf('332', isCorner)
const BOTTOM_EDGES = homesOf('332', (c) => isEdge(c) && isBottom(c))
const PIECES = homesOf('332', (c) => isCorner(c) || isEdge(c))

/** A phase applying the step's formulas, U and D placing the pieces under
 *  them. Every piece is unique, so the goal is "these pieces home", searched
 *  from both ends. */
function solveWithFormulas(track: readonly Vec3[], turns: string, formulas: readonly Move[][]) {
  return (cube: Cube) =>
    solvePieces(cube, { track, moves: moveSet(turns), macros: formulas, maxDepth: 20 })
}

const piecesHome = (positions: readonly Vec3[]) => (cube: Cube) => homeAt(cube, positions, '332')
const cornersDone = piecesHome(CORNERS)
const bottomEdgesDone = piecesHome([...CORNERS, ...BOTTOM_EDGES])

export const DOMINO_PLAN: MethodPlan = [
  {
    key: 'stepBottomCorners',
    goal: piecesHome(BOTTOM_CORNERS),
    moves: moveSet('U D F2'),
    phases: [solveWithFormulas(BOTTOM_CORNERS, 'U D', [DESCEND_CORNER])],
  },
  {
    key: 'stepTopCorners',
    goal: cornersDone,
    moves: moveSet('U D R2'),
    phases: [solveWithFormulas(CORNERS, 'U', [SWAP_CORNERS])],
  },
  {
    key: 'stepBottomEdges',
    goal: bottomEdgesDone,
    moves: moveSet('U D R2 F2'),
    phases: [solveWithFormulas([...CORNERS, ...BOTTOM_EDGES], 'U D', [DESCEND_EDGE])],
  },
  {
    key: 'stepTopEdges',
    goal: isSolved,
    moves: moveSet('U D R2 B2'),
    phases: [solveWithFormulas(PIECES, 'U', [CYCLE_EDGES, SWAP_EDGES_RIGHT, SWAP_EDGES_BACK])],
  },
]
