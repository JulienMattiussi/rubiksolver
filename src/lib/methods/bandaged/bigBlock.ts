import { isSolved } from '../../core/cube'
import { parseMoves } from '../../core/notation'
import { moveSet } from '../../core/moveSet'
import type { MethodPlan } from '../../solve/solverKit'
import { pieces } from '../standard/pieces3'
import { bothWays, home, placing, TOP_CORNERS, TOP_EDGES } from './kit'
import { conjugated } from '../../solve/everyWay'
import { PLL_UB, SUNE_BACK } from '../standard/algs'

/**
 * BigBlock, as taught on fan2cube.fr (bigblock2, "solution par
 * morphocode"): two faces only turn (H and D), the 2x2x3 holding the
 * others. Its corners first, then its edges, which <H, D> never turns over.
 *
 *   1. Bottom corners   (BDP) down by [D'H'], (BAD) by [DH]: then the top
 *                       ones are in place too, up to H
 *   2. Top corners      turned three at a time: DHD'H.DH²D'H²
 *   3. Bottom edge      (BD), then
 *   4. Middle edges     (AD), (PD), then
 *   5. Top edges        each by a 3-cycle of the top's, (HP) -> (HA) -> (HD)
 *                       = D²H'D'H'D².(HD)².H²D or (HG) -> (HD) -> (HA) =
 *                       D.(DH)²(D'H')².D'HD', brought there by D first
 *
 * Notation (page -> app): H D = U R; [X Y] = X Y X' Y'. Each formula's
 * effect is asserted in tests/unit/puzzles/bandaged/bigBlock.test.ts.
 */

/** (HGP)+ (HPD)+ (HDA)+, and three top edges: DHD'H.DH²D'H² */
export const TWIST = parseMoves(SUNE_BACK)
/** (HP) -> (HA) -> (HD): D²H'D'H'D².(HD)².H²D */
export const CYCLE_BACK = parseMoves("R2 U' R' U' R2 U R U R U2 R")
/** (HG) -> (HD) -> (HA): D.(DH)²(D'H')².D'HD' */
export const CYCLE = parseMoves(PLL_UB)

const RU = moveSet('R U')
const U = moveSet('U')

const CORNERS = pieces('DRB DFR')
const ALL_CORNERS = [...CORNERS, ...TOP_CORNERS]
const EDGES = pieces('DR FR BR')

/** The top's 3-cycles, and those of the edges D brings up. */
const CYCLES = conjugated(bothWays([CYCLE_BACK, CYCLE]), [
  [],
  ...['R', "R'", 'R2'].map((s) => parseMoves(s)),
])

export const BIG_BLOCK_PLAN: MethodPlan = [
  {
    key: 'stepBottomCorners',
    goal: home(CORNERS),
    moves: RU,
    phases: [1, 2].map((n) => placing(CORNERS.slice(0, n), RU)),
  },
  {
    key: 'stepOrientCorners',
    goal: home(ALL_CORNERS),
    moves: RU,
    phases: [placing(TOP_CORNERS, U, bothWays([TWIST]))],
  },
  ...(['stepBigBlockBottomEdge', 'stepMiddle', 'stepPermuteEdges'] as const).map((key, i) => {
    const names = [
      ...ALL_CORNERS,
      ...EDGES.slice(0, i === 0 ? 1 : 3),
      ...(i === 2 ? TOP_EDGES : []),
    ]
    return {
      key,
      goal: i === 2 ? isSolved : home(names),
      moves: RU,
      phases: [placing(names, U, CYCLES)],
    }
  }),
]
