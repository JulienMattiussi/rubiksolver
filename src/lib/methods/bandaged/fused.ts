import { isSolved } from '../../core/cube'
import { parseMoves } from '../../core/moves'
import { moveSet } from '../../core/moveSet'
import type { MethodPlan } from '../../solve/solverKit'
import type { Cube } from '../../core/types'
import { pieces } from '../standard/pieces3'
import { bothWays, home, placing, reaching, TOP, topCornersPlaced, topEdgesUp } from './kit'
import { PLL_UB, SUNE_BACK } from '../standard/algs'

/**
 * Fused, as taught on fan2cube.fr (fused2), "un mélange entre Pétrus
 * et Fridrich": three faces only turn (H, A, D), the 2x2x2 holding the
 * others. Its six centers never move: the colors' frame is the standard one.
 *
 *   1. The bottom       its two edges (A², D², turned over by A[HD]A'),
 *                       then its three corners down by [HA], [H'D'], [HD]
 *   2. The middle       its three edges, placed by H, A and D
 *   3. The top cross    edges turned up two at a time: A[HD]A'
 *   4. Corners placed   two swapped: V = HDH²A.H'D'HD.HA'HD'
 *   5. Corners turned   three turned: DHD'H.DH²D'H²
 *   6. Edges placed     three cycled: E = D.(DH)²(D'H')².D'HD'
 *
 * Notation (page -> app): H A D = U F R; [X Y] = X Y X' Y'. Each formula's
 * effect is asserted in tests/unit/puzzles/bandaged/fused.test.ts.
 */

/** (HA)°(HD)°, the top's corners moved too: A[HD]A' */
export const FLIP = parseMoves("F U R U' R' F'")
/** (HDA) (HPD), and two top edges: V = HDH²A.H'D'HD.HA'HD' */
export const SWAP = parseMoves("U R U2 F U' R' U R U F' U R'")
/** (HDA)+ (HPD)+ (HGP)+, and three top edges: DHD'H.DH²D'H² */
export const TWIST = parseMoves(SUNE_BACK)
/** (HG) -> (HD) -> (HA): E = D.(DH)²(D'H')².D'HD' */
export const CYCLE = parseMoves(PLL_UB)

const URF = moveSet('U R F')
const U = moveSet('U')

const BOTTOM = pieces('DF DR DFL DRB DFR')
const F2L = [...BOTTOM, ...pieces('FL FR BR')]

/** Everything below the top, and the top's own goal. */
const withF2L = (goal: (cube: Cube) => boolean) => (cube: Cube) => home(F2L)(cube) && goal(cube)

export const FUSED_PLAN: MethodPlan = [
  {
    key: 'stepFusedBottom',
    goal: home(BOTTOM),
    moves: URF,
    phases: [2, 3, 4, 5].map((n) => placing(BOTTOM.slice(0, n), URF)),
  },
  {
    key: 'stepMiddle',
    goal: home(F2L),
    moves: URF,
    phases: [6, 7, 8].map((n) => placing(F2L.slice(0, n), URF)),
  },
  {
    key: 'stepTopCross',
    goal: withF2L(topEdgesUp),
    moves: URF,
    phases: [reaching(TOP, topEdgesUp, U, bothWays([FLIP]))],
  },
  {
    key: 'stepPermuteCorners',
    goal: withF2L((c) => topEdgesUp(c) && topCornersPlaced(c)),
    moves: URF,
    phases: [reaching(TOP, (c) => topEdgesUp(c) && topCornersPlaced(c), U, bothWays([SWAP]))],
  },
  {
    key: 'stepOrientCorners',
    goal: withF2L((c) => topEdgesUp(c) && home(TOP.slice(4))(c)),
    moves: URF,
    phases: [reaching(TOP, (c) => topEdgesUp(c) && home(TOP.slice(4))(c), U, bothWays([TWIST]))],
  },
  {
    key: 'stepPermuteEdges',
    goal: isSolved,
    moves: URF,
    phases: [placing(TOP, U, bothWays([CYCLE]))],
  },
]
