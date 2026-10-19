import { isSolved, solvedCube } from '../../core/cube'
import { parseMoves } from '../../core/moves'
import { allTurnsOf, moveSet } from '../../core/moveSet'
import type { MethodPlan } from '../../solve/solverKit'
import type { Cubie, Move } from '../../core/types'
import { blocksAt, bothWays, EVERY_PLACE, inPlaces, phaseAs, toStart } from './kit'
import { conjugated } from '../../solve/everyWay'
import { OLL_EDGE_TURN } from '../standard/algs'

/**
 * FusedStripe, as taught on fan2cube.fr (fusedstripe2, "morphocode"): the
 * Fused's 2x2x2 and three bars in a Y. Its START is its form when solved,
 * each bar home; then, "comme l'algorithme minimal":
 *
 *   0. The bars        home, by turns that go ([DH]D', D[HD])
 *   1. Corners placed  (BGA) (HDA) = AD[A'H']DHD²A', and turns that go (the
 *                      formulas below move the bars, not these corners)
 *   2. Edges placed    (HP) -> (BA) -> (PD) = D'A'[HD]²AD and
 *                      (HG) -> (HP) -> (BD) = DH²(A'H')³(AH)²A²H²D'
 *   3. Turned          the pieces brought up by M = DHA'.DH²D' (state m,
 *                      where H turns), edges turned over by J² (J =
 *                      A[DH]A'H), corners by J⁴, placed there by J and
 *                      A[DH]²A'; then down again by M'
 *
 * Steps 1 and 2 also bring pieces round the top through state m: M, H, M'.
 * Notation (page -> app): H B A P G D = U D F B L R; [X Y] = X Y X' Y'.
 * Each formula's effect is asserted in
 * tests/unit/puzzles/bandaged/fusedStripe.test.ts.
 */

/** (BGA) (HDA), and three edges: AD[A'H']DHD²A' */
export const CORNERS = parseMoves("F R F' U' F U R U R2 F'")
/** (HP) -> (BA) -> (PD), corners turned: D'A'[HD]²AD */
export const EDGES = parseMoves("R' F' U R U' R' U R U' R' F R")
/** (HG) -> (HP) -> (BD): DH²(A'H')³(AH)²A²H²D' */
export const EDGES_BACK = parseMoves("R U2 F' U' F' U' F' U' F U F U F2 U2 R'")
/** Up to state m: M = DHA'.DH²D' */
export const M = parseMoves("R U F' R U2 R'")
/** In state m: J = A[DH]A'H, J², J⁴; (HA) -> (HP) -> (HD) = A[DH]²A' */
export const J = parseMoves(OLL_EDGE_TURN)
export const J2 = [...J, ...J]
export const J4 = [...J2, ...J2]
export const CYCLE_TOP = parseMoves("F R U R' U' R U R' U' F'")

const SOLVED = solvedCube('fusedStripe')
const ALL = allTurnsOf('fusedStripe')
const NONE = moveSet('')

const SINGLE_CORNERS = ['DFL', 'DRB', 'UBL', 'UFR']
const SINGLE_EDGES = ['UL', 'UB', 'DF', 'DR', 'BR', 'FL']

/** Through state m: M, then the top turned or `formulas` there (each also
 *  from the other sides of the top: H set up first), then M'. */
const throughM = (formulas: readonly (readonly Move[])[]) =>
  conjugated(
    [
      ...['U', 'U2', "U'"].map((s) => parseMoves(s)),
      ...conjugated(
        formulas,
        ['', 'U', 'U2', "U'"].map((s) => parseMoves(s)),
      ),
    ],
    [M],
  )
const AT_START = bothWays([CORNERS, EDGES, EDGES_BACK])
/** Placing: the page's formulas, and J and A[DH]²A' in state m. */
const PLACING = [...AT_START, ...throughM(bothWays([J, CYCLE_TOP]))]
/** Turning: J² and J⁴ in state m, set up by the page's formulas. */
const TURNING = [...AT_START, ...throughM(bothWays([J2, J4]))]

const barsHome = blocksAt(SOLVED, true)
const cornersIn = (c: readonly Cubie[]) =>
  barsHome(c as Cubie[]) && inPlaces(SOLVED, SINGLE_CORNERS)(c)
const allIn = (c: readonly Cubie[]) => cornersIn(c) && inPlaces(SOLVED, SINGLE_EDGES)(c)

/** Every place of the puzzle, by name: what state m's search tracks. */
const EVERYWHERE = [...SINGLE_CORNERS, ...SINGLE_EDGES]

export const FUSED_STRIPE_PLAN: MethodPlan = [
  { key: 'stepBandagedBars', goal: barsHome, moves: ALL, phases: [toStart(SOLVED, true)] },
  {
    key: 'stepPermuteCorners',
    goal: cornersIn,
    moves: ALL,
    phases: [
      phaseAs(SOLVED, SINGLE_CORNERS, {
        free: ALL,
        formulas: bothWays([CORNERS]),
        goal: cornersIn,
        key: 'places',
        maxDepth: 20,
      }),
    ],
  },
  {
    key: 'stepPermuteEdges',
    goal: allIn,
    moves: ALL,
    phases: [
      phaseAs(SOLVED, EVERYWHERE, { free: NONE, formulas: PLACING, goal: allIn, key: 'places' }),
    ],
  },
  {
    key: 'stepFsTurned',
    goal: isSolved,
    moves: ALL,
    phases: [phaseAs(SOLVED, EVERY_PLACE, { free: NONE, formulas: TURNING, maxDepth: 8 })],
  },
]
