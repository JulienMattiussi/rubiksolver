import { isSolved, solvedCube } from '../../core/cube'
import { parseMoves } from '../../core/moves'
import { allTurnsOf, moveSet } from '../../core/moveSet'
import type { MethodPlan } from '../../solve/solverKit'
import type { Cube, Move } from '../../core/types'
import { asIn, blocksAt, bothWays, phaseAs, toStart } from './kit'

/**
 * Bandage Cube, as taught on fan2cube.fr (bandagecube2, "méthode 1"): seven
 * bars, a lone corner, four tabs and the double tab "∟". Its START is its
 * form when solved: the "∟" at BP, the lone corner at HDA, the other tabs
 * home, H, D and A turning. Then five "magic" formulas, which leave START
 * as it is, bring the bars home one by one, each by two of them: the first
 * moves a bar to (HAG), the second puts it home.
 *
 *   0. START   the tabs home, the lone corner at HDA (intuitive)
 *   1. Bars    (BPG) by X and Q, (BDP) by Q and S, (BGA) by S, (BAD) by Y
 *              and T, (HGP) by T; the last two are then home too
 *
 *   X = H²GH'A'.G'H'A           Q = ADHAD'.A²H'
 *   S = A'HGA².DH'D'HA'.G'H'    Y = DHADH'.D'HA'G'H.GH²D'
 *   T = A'HGA'G'.A²DH'D'
 *
 * Notation (page -> app): H B A P G D = U D F B L R. Each formula's effect
 * is asserted in tests/unit/puzzles/bandaged/bandage.test.ts.
 */

export const X = parseMoves("U2 L U' F' L' U' F")
export const Q = parseMoves("F R U F R' F2 U'")
export const S = parseMoves("F' U L F2 R U' R' U F' L' U'")
export const Y = parseMoves("R U F R U' R' U F' L' U L U2 R'")
export const T = parseMoves("F' U L F' L' F2 R U' R'")

const SOLVED = solvedCube('bandage')
const TURNS = allTurnsOf('bandage')
const NONE = moveSet('')

/** The bars in the page's order, each with the formulas that place it. */
const BARS: readonly [readonly string[], readonly Move[][]][] = [
  [
    ['DBL', 'BL'],
    [X, Q],
  ],
  [
    ['DRB', 'DR'],
    [Q, S],
  ],
  [['DFL', 'FL'], [S]],
  [
    ['DFR', 'FR'],
    [Y, T],
  ],
  [['UBL', 'UB'], [T]],
]

/** The first `n` bars home. */
const barsHome = (n: number) => (cube: Cube) =>
  asIn(
    SOLVED,
    BARS.slice(0, n).flatMap(([bar]) => bar),
  )(cube)

export const BANDAGE_PLAN: MethodPlan = [
  {
    key: 'stepBandagedStart',
    goal: blocksAt(SOLVED, false),
    moves: TURNS,
    phases: [toStart(SOLVED, false)],
  },
  {
    key: 'stepBandagedBars',
    goal: isSolved,
    moves: TURNS,
    phases: BARS.map(([, formulas], i) =>
      phaseAs(SOLVED, [], {
        free: NONE,
        formulas: bothWays(formulas),
        goal: barsHome(i + 1),
        maxDepth: 12,
      }),
    ),
  },
]
