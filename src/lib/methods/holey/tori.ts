import { isSolved } from '../../core/cube'
import { homeAt, homesOf, withStickers } from '../../core/pieces'
import { formatMoves, parseMoves } from '../../core/notation'
import { moveSet } from '../../core/moveSet'
import { solvePieces } from '../../solve/pieceSearch'
import { atEverySide, type MethodPlan } from '../../solve/solverKit'
import type { Cube, Cubie, Move, Vec3 } from '../../core/types'
import { COMM_UF_BACK, COMM_UR, PLL_UB, SUNE } from '../standard/algs'

/**
 * Tori, "extended cross", as taught on fan2cube.fr (tori2): a Rubik's Cube
 * without corners, solved as one, the corners ignored. Its six centers
 * never move, so the color frame is the standard one.
 *
 *   1. The bottom cross   its edges brought down by A², turned over by
 *                         BDB'A, raised from the equator by DHD'
 *   2. The middle edges   placed from the top by [H'A'] (left) or [HD]
 *                         (right), no corner to keep
 *   3. The top cross      the white edges turned up two at a time by
 *                         A[HD]A'H'
 *   4. The top edges      placed by 3-cycles: DDHDH.D'H'D'H'.D'HD' and
 *                         DHD'.H.DH²D'
 *
 * Each formula from every side, H placing the pieces under it.
 * Notation (page -> app): H B A P G D = U D F B L R; [X Y] = X Y X' Y'.
 * Each formula's effect is asserted in tests/unit/puzzles/holey/tori.test.ts.
 */

/** (HA) -> (BA): A² */
export const DOWN = parseMoves('F2')
/** (BA)°: BDB'A */
export const TURN_OVER = parseMoves("D R D' F")
/** (AD) -> (HA): DHD' */
export const RAISE = parseMoves("R U R'")
/** (HA) -> (AD): [H'A'] */
export const PLACE_LEFT = parseMoves(COMM_UF_BACK)
/** (HD) -> (AD): [HD] */
export const PLACE_RIGHT = parseMoves(COMM_UR)
/** Two adjacent top edges turned over (and swapped, set right by H):
 *  A[HD]A'H' */
export const TURN_TWO = parseMoves("F U R U' R' F' U'")
/** (HG) -> (HD) -> (HA): D.DHDH.D'H'D'H'.D'HD' */
export const CYCLE = parseMoves(PLL_UB)
/** (HG) -> (HD) -> (HP): DHD'.H.DH²D' */
export const CYCLE_BACK = parseMoves(SUNE)

const isEdge = withStickers(2)
const BOTTOM = homesOf('tori', (c) => isEdge(c) && c.position[1] < 0)
const MIDDLE = homesOf('tori', (c) => isEdge(c) && c.position[1] === 0)
const TOP = homesOf('tori', (c) => isEdge(c) && c.position[1] > 0)

const piecesHome = (positions: readonly Vec3[]) => (cube: readonly Cubie[]) =>
  homeAt(cube, positions, 'tori')

/** The top edges turned white up, wherever they are. */
const topCross = (cube: readonly Cubie[]) =>
  piecesHome([...BOTTOM, ...MIDDLE])(cube) &&
  cube
    .filter((c) => isEdge(c) && c.position[1] > 0)
    .every((c) => c.stickers.find((s) => s.color === 'W')?.normal[1] === 1)

/** A phase searching among the step's formulas from every side, H placing
 *  the pieces under them. */
function withFormulas(
  track: readonly Vec3[],
  formulas: readonly (readonly Move[])[],
  goal?: (pieces: readonly Cubie[]) => boolean,
) {
  const macros = formulas.flatMap((f) => atEverySide(formatMoves(f)))
  return (cube: Cube) =>
    solvePieces(cube, { track, moves: moveSet('U'), macros, maxDepth: 14, ...(goal && { goal }) })
}

const ALL = moveSet('U D L R F B')

export const TORI_PLAN: MethodPlan = [
  {
    key: 'stepBottomCross',
    goal: piecesHome(BOTTOM),
    moves: ALL,
    phases: [withFormulas(BOTTOM, [DOWN, TURN_OVER, RAISE])],
  },
  {
    key: 'stepMiddle',
    goal: piecesHome([...BOTTOM, ...MIDDLE]),
    moves: ALL,
    phases: [withFormulas([...BOTTOM, ...MIDDLE], [PLACE_LEFT, PLACE_RIGHT])],
  },
  {
    key: 'stepTopCross',
    goal: topCross,
    moves: ALL,
    phases: [withFormulas([...BOTTOM, ...MIDDLE, ...TOP], [TURN_TWO], topCross)],
  },
  {
    key: 'stepPermuteEdges',
    goal: isSolved,
    moves: ALL,
    phases: [withFormulas([...BOTTOM, ...MIDDLE, ...TOP], [CYCLE, CYCLE_BACK])],
  },
]
