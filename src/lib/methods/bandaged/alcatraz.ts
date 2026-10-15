import { isSolved, solvedCube } from '../../core/cube'
import { parseMoves } from '../../core/moves'
import { allTurnsOf, moveSet } from '../../core/moveSet'
import type { MethodPlan } from '../../solve/solverKit'
import type { Cubie } from '../../core/types'
import { asIn, blocksAt, bothWays, inPlaces, phaseAs, toStart } from './kit'

/**
 * Alcatraz, as taught on fan2cube.fr (alcatraz2): the Fused's 2x2x2, three
 * bars, two tabs and a square on top. "On ne peut pas utiliser les
 * conjugaisons": each move has its own formula, and they are long. Its
 * START is its form when solved:
 *
 *   0. START           the bars and tabs down (intuitive)
 *   1. Bars            (BAD) (BDP) = [D'H']AD'[A'D'].A'H'DH.[A'H] and
 *                      (BGA) (BAD) = [D'H']AD'[A'D'].DHA'H'.[DH']; the top
 *                      edges then stand home too
 *   2. Top corners     (HPD) -> (HAG) -> (HDA) = [AH]D'[HA]H'DH
 *   3. Top edges       turned: (HA)°(HD)° = Q = [H'D][D'A][A'H]
 *   4. Top corners     turned: Q² (three), and two by
 *                      [HA'][H'D].(A²D²A²).(D'H'D²HA².DA'H'D'HA'D).(A[H'D][AD']A')
 *                      or AHA²H'A'D'A²D.[A'H][D'H'].AD'A'D'AD²HA'H'.[DH']
 *
 * Notation (page -> app): H A D = U F R; [X Y] = X Y X' Y'. Each formula's
 * effect is asserted in tests/unit/puzzles/bandaged/alcatraz.test.ts.
 */

export const BARS_RIGHT = parseMoves("R' U' R U F R' F' R' F R F' U' R U F' U F U'")
export const BARS_LEFT = parseMoves("R' U' R U F R' F' R' F R R U F' U' R U' R' U")
/** (HPD) -> (HAG) -> (HDA): [AH]D'[HA]H'DH */
export const CYCLE = parseMoves("F U F' U' R' U F U' F' U' R U")
/** (HA)°(HD)°, three corners turned: Q = [H'D][D'A][A'H] */
export const Q = parseMoves("U' R U R' R' F R F' F' U F U'")
/** (HAG)- (HDA)+ */
export const TWIST_FRONT = parseMoves(
  "U F' U' F U' R U R' F2 R2 F2 R' U' R2 U F2 R F' U' R' U F' R F U' R U R' F R' F' R F'",
)
/** (HAG)- (HPD)+ */
export const TWIST_BACK = parseMoves(
  "F U F2 U' F' R' F2 R F' U F U' R' U' R U F R' F' R' F R2 U F' U' R U' R' U",
)

const SOLVED = solvedCube('alcatraz')
const ALL = allTurnsOf('alcatraz')
const NONE = moveSet('')

const CORNERS = ['ULF', 'UFR', 'URB']
const EDGES = ['UF', 'UR']
const TOP = [...CORNERS, ...EDGES]

const barsHome = blocksAt(SOLVED, true)
const barsDone = (c: readonly Cubie[]) => barsHome(c as Cubie[])
const cornersIn = (c: readonly Cubie[]) => barsDone(c) && inPlaces(SOLVED, TOP)(c)
const edgesDone = (c: readonly Cubie[]) => cornersIn(c) && asIn(SOLVED, EDGES)(c)

export const ALCATRAZ_PLAN: MethodPlan = [
  {
    key: 'stepBandagedStart',
    goal: blocksAt(SOLVED, false),
    moves: ALL,
    phases: [toStart(SOLVED, false)],
  },
  {
    key: 'stepBandagedBars',
    goal: barsDone,
    moves: ALL,
    phases: [
      phaseAs(SOLVED, TOP, {
        free: NONE,
        formulas: bothWays([BARS_RIGHT, BARS_LEFT]),
        goal: barsDone,
        key: 'places',
      }),
    ],
  },
  {
    key: 'stepPermuteCorners',
    goal: cornersIn,
    moves: ALL,
    phases: [
      phaseAs(SOLVED, TOP, {
        free: NONE,
        formulas: bothWays([CYCLE]),
        goal: cornersIn,
        key: 'places',
      }),
    ],
  },
  {
    key: 'stepTopCross',
    goal: edgesDone,
    moves: ALL,
    phases: [phaseAs(SOLVED, TOP, { free: NONE, formulas: bothWays([Q]), goal: edgesDone })],
  },
  {
    key: 'stepOrientCorners',
    goal: isSolved,
    moves: ALL,
    phases: [
      phaseAs(SOLVED, TOP, {
        free: NONE,
        formulas: bothWays([[...Q, ...Q], TWIST_FRONT, TWIST_BACK]),
      }),
    ],
  },
]
