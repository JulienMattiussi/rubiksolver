import { isSolved, solvedCube } from '../../core/cube'
import { parseMoves } from '../../core/notation'
import { allTurnsOf, moveSet } from '../../core/moveSet'
import type { MethodPlan } from '../../solve/solverKit'
import type { Cubie } from '../../core/types'
import { amongPlaces, asIn, blocksAt, bothWays, inPlaces, phaseAs, toStart } from './kit'

/**
 * QuadStripe, as taught on fan2cube.fr (quadstripe2, "style Bandage Cube"):
 * three squares and three bars round a small inner cube (HDA). Its START is
 * its form when solved: the squares round the inner cube, G, B and P
 * turning; then four "magic" formulas, which leave START as it is.
 *
 *   0. START          the squares round the inner cube (intuitive)
 *   1. Inner cube     its pieces in it, and (BPG): by turns that go, as the
 *                     page's GP'H'PG' (the bar HDA-HA out of the way)
 *   2. Bars           (HGP) (BGA) = GP'H'PG².BA²B'.G²P'HPG' and
 *                     (BGA) (BDP) = BG'A'GB².PD²P'.B²G'AGB'
 *   3. Edges placed   (HA) (HD) = G'BAB'G.BG'A'G'A.G²B'P'GH.PG'PB'D.BP', and
 *                     (HA) -> (HD) -> (AD) = B'PDP'B.G'BA²G.B'GP'HPG'
 *   4. Edges turned   (HA)°(HD)° = (G'BAGB'.P'GHPG'.B'PDBP')²
 *   5. Corners turned (HDA)+ (BPG)- = PB'D²PD.P'B'DB²P'.G'BAGB'.P'GHG'P.
 *                     GP'H'G'P.BG'A'B'G
 *
 * Notation (page -> app): H B A P G D = U D F B L R. Each formula's effect
 * is asserted in tests/unit/puzzles/bandaged/quadStripe.test.ts.
 */

/** (HGP) (BGA): GP'H'PG².BA²B'.G²P'HPG' */
export const BARS_TOP = parseMoves("L B' U' B L2 D F2 D' L2 B' U B L'")
/** (BGA) (BDP): BG'A'GB².PD²P'.B²G'AGB' */
export const BARS_BOTTOM = parseMoves("D L' F' L D2 B R2 B' D2 L' F L D'")
/** (HA) (HD): G'BAB'G.BG'A'G'A.G²B'P'GH.PG'PB'D.BP' */
export const SWAP = parseMoves("L' D F D' L D L' F' L' F L2 D' B' L U B L' B D' R D B'")
/** (HA) -> (HD) -> (AD): B'PDP'B.G'BA²G.B'GP'HPG' (a formula beside the
 *  page's four) */
export const CYCLE = parseMoves("D' B R B' D L' D F2 L D' L B' U B L'")
/** (HA)°(HD)°: (G'BAGB'.P'GHPG'.B'PDBP')² */
export const FLIP = parseMoves("L' D F L D' B' L U B L' D' B R D B' ".repeat(2))
/** (HDA)+ (BPG)-: PB'D²PD.P'B'DB²P'.G'BAGB'.P'GHG'P.GP'H'G'P.BG'A'B'G */
export const TWIST = parseMoves(
  "B D' R2 B R B' D' R D2 B' L' D F L D' B' L U L' B L B' U' L' B D L' F' D' L",
)

const SOLVED = solvedCube('quadStripe')
const ALL = allTurnsOf('quadStripe')
const NONE = moveSet('')

const INNER_EDGES = ['UF', 'UR', 'FR']
const CORNERS = ['UFR', 'DBL']
const INNER = [...INNER_EDGES, ...CORNERS]

const formed = blocksAt(SOLVED, false)
const barsHome = blocksAt(SOLVED, true)
/** The inner cube's edges in it, its corner there or at BPG. */
const innerIn = (c: readonly Cubie[]) =>
  amongPlaces(SOLVED, INNER_EDGES)(c) && amongPlaces(SOLVED, CORNERS)(c)
const innerFormed = (c: readonly Cubie[]) => formed(c as Cubie[]) && innerIn(c)
const barsPlaced = (c: readonly Cubie[]) => barsHome(c as Cubie[]) && innerIn(c)
const placed = (c: readonly Cubie[]) => barsHome(c as Cubie[]) && inPlaces(SOLVED, INNER)(c)
const edgesDone = (c: readonly Cubie[]) => placed(c) && asIn(SOLVED, INNER_EDGES)(c)

export const QUAD_STRIPE_PLAN: MethodPlan = [
  { key: 'stepBandagedStart', goal: formed, moves: ALL, phases: [toStart(SOLVED, false)] },
  {
    key: 'stepQsInner',
    goal: innerFormed,
    moves: ALL,
    phases: [phaseAs(SOLVED, INNER, { free: ALL, goal: innerFormed, key: 'places', maxDepth: 40 })],
  },
  {
    key: 'stepBandagedBars',
    goal: barsPlaced,
    moves: ALL,
    phases: [
      phaseAs(SOLVED, INNER, {
        free: NONE,
        formulas: bothWays([BARS_TOP, BARS_BOTTOM]),
        goal: barsPlaced,
      }),
    ],
  },
  {
    key: 'stepPermuteEdges',
    goal: placed,
    moves: ALL,
    phases: [
      phaseAs(SOLVED, INNER, { free: NONE, formulas: bothWays([SWAP, CYCLE]), goal: placed }),
    ],
  },
  {
    key: 'stepTurnEdges',
    goal: edgesDone,
    moves: ALL,
    phases: [
      phaseAs(SOLVED, INNER, {
        free: NONE,
        formulas: bothWays([FLIP, SWAP, CYCLE]),
        goal: edgesDone,
      }),
    ],
  },
  {
    key: 'stepOrientCorners',
    goal: isSolved,
    moves: ALL,
    phases: [phaseAs(SOLVED, INNER, { free: NONE, formulas: bothWays([TWIST]) })],
  },
]
