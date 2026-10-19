import { isSolved, solvedCube } from '../../core/cube'
import { parseMoves } from '../../core/notation'
import { allTurnsOf, moveSet } from '../../core/moveSet'
import type { MethodPlan } from '../../solve/solverKit'
import type { Cubie } from '../../core/types'
import { amongPlaces, asIn, blocksAt, bothWays, inPlaces, phaseAs, toStart } from './kit'
import { CYCLE, FLIP, SWAP, TWIST } from './quadStripe'

/**
 * Quad, as taught on fan2cube.fr (quad2): the QuadStripe's three squares
 * without its bars. Its START is the QuadStripe's (solved: G, B and P
 * turning); then
 *
 *   0. START            the squares round the inner cube (intuitive)
 *   1. Inner cube       its pieces in it: by turns that go, as GP'H'PG'
 *   2. Inner cube done  turned and placed as on the QuadStripe, its
 *                       formulas (quadStripe.ts)
 *   3. Bars' edges      the cube turned over (t D² t H'), by [HA'] and
 *                       (HA').G[HG].(HG'H'G²HG²H'G').(AH')
 *   4. Bars' corners    by [DH']³, [D'A]³, [HA']³ and (DH').(DPD'PDP²D')P.
 *                       (DPD'PDP²D').[P'D][PH']P.(HD')
 *   5. Bars turned      K = [DH'][D'A][HA']³
 *
 * The formulas of 3 to 5 are the page's, the cube turned over: its H A D P
 * G B are then the app's D L B R F U. Notation (page -> app, held as solved):
 * H B A P G D = U D F B L R. Each formula's effect is asserted in
 * tests/unit/puzzles/bandaged/quad.test.ts.
 */

/** (HP) -> ..., turned over: [HA'] = [DL'] */
export const EDGE_SHORT = parseMoves("D L' D' L")
/** Turned over: (HA').G[HG].(HG'H'G²HG²H'G').(AH') */
export const EDGE_LONG = parseMoves("D L' F D F D' F' D F' D' F2 D F2 D' F' L D'")
/** Turned over: [DH']³, [D'A]³, [HA']³ */
export const CORNER_RIGHT = parseMoves("B D' B' D ".repeat(3))
export const CORNER_LEFT = parseMoves("B' L B L' ".repeat(3))
export const CORNER_DOWN = parseMoves("D L' D' L ".repeat(3))
/** Turned over: (DH').(DPD'PDP²D')P.(DPD'PDP²D').[P'D][PH']P.(HD') */
export const CORNER_LONG = parseMoves(
  "B D' B R B' R B R2 B' R B R B' R B R2 B' R' B R B' R D' R' D R D B'",
)
/** Bars turned: K = [DH'][D'A][HA']³ */
export const K = parseMoves("B D' B' D B' L B L' D L' D' L D L' D' L D L' D' L")

const SOLVED = solvedCube('quad')
const ALL = allTurnsOf('quad')
const NONE = moveSet('')

const INNER_EDGES = ['UF', 'UR', 'FR']
const CORNERS = ['UFR', 'DBL']
const INNER = [...INNER_EDGES, 'UFR']
const BAR_EDGES = ['DL', 'DB', 'BL']
const BAR_CORNERS = ['DFL', 'DRB', 'UBL', 'DBL']
const ALL_SINGLES = [...INNER, ...BAR_EDGES, ...BAR_CORNERS]

const formed = blocksAt(SOLVED, false)
const innerIn = (c: readonly Cubie[]) =>
  formed(c as Cubie[]) && amongPlaces(SOLVED, INNER_EDGES)(c) && amongPlaces(SOLVED, CORNERS)(c)
const innerDone = (c: readonly Cubie[]) => formed(c as Cubie[]) && asIn(SOLVED, INNER)(c)
const edgesIn = (c: readonly Cubie[]) => innerDone(c) && inPlaces(SOLVED, BAR_EDGES)(c)
const cornersIn = (c: readonly Cubie[]) => edgesIn(c) && inPlaces(SOLVED, BAR_CORNERS)(c)

const BAR_FORMULAS = bothWays([EDGE_SHORT, EDGE_LONG])
const CORNER_FORMULAS = bothWays([CORNER_RIGHT, CORNER_LEFT, CORNER_DOWN, CORNER_LONG])

export const QUAD_PLAN: MethodPlan = [
  {
    key: 'stepBandagedStart',
    goal: formed,
    moves: ALL,
    phases: [toStart(SOLVED, false)],
  },
  {
    key: 'stepQsInner',
    goal: innerIn,
    moves: ALL,
    phases: [
      phaseAs(SOLVED, [...INNER, 'DBL'], { free: ALL, goal: innerIn, key: 'places', maxDepth: 40 }),
    ],
  },
  {
    key: 'stepQuadInnerDone',
    goal: innerDone,
    moves: ALL,
    phases: [
      phaseAs(SOLVED, INNER, {
        free: ALL,
        formulas: bothWays([SWAP, CYCLE, FLIP, TWIST]),
        maxDepth: 20,
      }),
    ],
  },
  {
    key: 'stepQuadBarEdges',
    goal: edgesIn,
    moves: ALL,
    phases: [
      phaseAs(SOLVED, [...INNER, ...BAR_EDGES], {
        free: NONE,
        formulas: BAR_FORMULAS,
        goal: edgesIn,
      }),
    ],
  },
  {
    key: 'stepQuadBarCorners',
    goal: cornersIn,
    moves: ALL,
    phases: [
      phaseAs(SOLVED, ALL_SINGLES, {
        free: NONE,
        formulas: [...BAR_FORMULAS, ...CORNER_FORMULAS],
        goal: cornersIn,
      }),
    ],
  },
  {
    key: 'stepQuadBarsTurned',
    goal: isSolved,
    moves: ALL,
    phases: [
      phaseAs(SOLVED, ALL_SINGLES, {
        free: NONE,
        formulas: [...BAR_FORMULAS, ...CORNER_FORMULAS, ...bothWays([K])],
        maxDepth: 10,
      }),
    ],
  },
]
