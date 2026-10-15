import { isSolved, solvedCube } from '../../core/cube'
import { invertMoves, parseMoves } from '../../core/moves'
import { allTurnsOf, moveSet } from '../../core/moveSet'
import { applyMoves } from '../../core/turn'
import type { MethodPlan } from '../../solve/solverKit'
import { asIn, blocksAt, bothWays, phaseAs, toStart } from './kit'

/**
 * Diamond, as taught on fan2cube.fr (diamond2, "morphocode"): two squares
 * and two tabs. From START (GD'A² from solved), H turns freely and most of
 * the Rubik's Cube's formulas go:
 *
 *   0. START           GD'A² (the squares and tabs where they go there)
 *   1. Bottom corners  (BAD) by [HD] (turned by [HD]²), (BGA) the same, the
 *                      cube held a quarter round (t H')
 *   2. Equator         (AD) by [HD][H'A'] or [H'A'][HD], (AG) the same
 *   3. Top edges       placed by J = A[DH]A'H, turned by J²
 *   4. Top corners     placed by [AD'].G[D'A]G', turned by [AD']².G[D'A]².G'
 *   5. Back            A²DG'
 *
 * Its places are named as they stand at START. Notation (page -> app): H B
 * A P G D = U D F B L R; [X Y] = X Y X' Y'; a formula held a quarter round
 * (t H') turns its D A G as the app's F L B. Each formula's effect is
 * asserted in tests/unit/puzzles/bandaged/diamond.test.ts.
 */

/** GD'A²: START from solved. */
export const START = parseMoves("L R' F2")
/** (HDA) -> (BAD): [HD]; held a quarter round, (HAG) -> (BGA): [HA]. */
export const DOWN = parseMoves("U R U' R'")
export const DOWN_LEFT = parseMoves("U F U' F'")
/** (HA) -> (AD): [HD][H'A']; (HD) -> (AD): [H'A'][HD]; and held a quarter
 *  round, to (AG). */
export const MIDDLE = [
  parseMoves("U R U' R' U' F' U F"),
  parseMoves("U' F' U F U R U' R'"),
  parseMoves("U F U' F' U' L' U L"),
  parseMoves("U' L' U L U F U' F'"),
]
/** J = A[DH]A'H: the top edges placed (and J² turns them). */
export const J = parseMoves("F R U R' U' F' U")
/** (HAG) -> (HGP) -> (HPD): [AD'].G[D'A]G' */
export const CORNERS = parseMoves("F R' F' R L R' F R F' L'")
/** (HAG)- (HGP)+: [AD']².G[D'A]².G' */
export const TWIST = parseMoves("F R' F' R F R' F' R L R' F R F' R' F R F' L'")

const AT_START = applyMoves(solvedCube('diamond'), START)
const ALL = allTurnsOf('diamond')
const U = moveSet('U')

const BOTTOM = ['DFR', 'DFL']
const EQUATOR = [...BOTTOM, 'FR', 'FL']
const EDGES = [...EQUATOR, 'UF', 'UR', 'UB', 'UL']
const TOP = [...EDGES, 'UFR', 'URB', 'UBL', 'ULF']

const done = (names: readonly string[]) => asIn(AT_START, names)

export const DIAMOND_PLAN: MethodPlan = [
  {
    key: 'stepBandagedStart',
    goal: blocksAt(AT_START, false),
    moves: ALL,
    phases: [toStart(AT_START, false)],
  },
  {
    key: 'stepBottomCorners',
    goal: done(BOTTOM),
    moves: ALL,
    phases: [1, 2].map((n) =>
      phaseAs(AT_START, BOTTOM.slice(0, n), {
        free: U,
        formulas: bothWays([DOWN, DOWN_LEFT]),
      }),
    ),
  },
  {
    key: 'stepMiddle',
    goal: done(EQUATOR),
    moves: ALL,
    phases: [3, 4].map((n) =>
      phaseAs(AT_START, EQUATOR.slice(0, n), { free: U, formulas: bothWays(MIDDLE) }),
    ),
  },
  {
    key: 'stepPermuteEdges',
    goal: done(EDGES),
    moves: ALL,
    phases: [phaseAs(AT_START, EDGES, { free: U, formulas: bothWays([J]) })],
  },
  {
    key: 'stepPermuteCorners',
    goal: done(TOP),
    moves: ALL,
    phases: [phaseAs(AT_START, TOP, { free: U, formulas: bothWays([CORNERS, TWIST]) })],
  },
  { key: 'stepBandagedBack', goal: isSolved, moves: ALL, phases: [() => invertMoves(START)] },
]
