import { isSolved } from '../../core/cube'
import { parseMoves } from '../../core/notation'
import { moveSet } from '../../core/moveSet'
import type { MethodPlan } from '../../solve/solverKit'
import type { Cube } from '../../core/types'
import { pieces } from '../standard/pieces3'
import {
  bothWays,
  cornerPlaces,
  home,
  placing,
  reaching,
  TOP,
  TOP_CORNERS,
  topCornersPlaced,
} from './kit'
import { PLL_UB, SUNE_BACK } from '../standard/algs'
import { conjugated } from '../../solve/everyWay'

/**
 * Squarebik, as taught on fan2cube.fr (squarebik2): its equator jammed, as
 * a Square-1's, three faces turn (H, B, D); solved as a Rubik's Cube with
 * those only. Its centers never move: the colors' frame is the standard one.
 *
 *   1. Bottom cross     its four edges, by B and D² (intuitive)
 *   2. Bottom corners   down by [DH], turned by [DH]²
 *   3. Middle edges     (AD) and (PD): the top's 3-cycle E = D².HDHD'.(H'D')².HD'
 *                       set up by D (DED', D'ED)
 *   4. Corners placed   two swapped: H²DHD²B.D'HDB'.(D'H')².D'H
 *   5. Corners turned   three turned: DHD'H.DH²D'H²
 *   6. Edges placed     three cycled: E
 *
 * Notation (page -> app): H B D = U D R; [X Y] = X Y X' Y'. Each formula's
 * effect is asserted in tests/unit/puzzles/bandaged/squarebik.test.ts.
 */

/** (HDA) -> (BAD): [DH] */
export const DOWN = parseMoves("R U R' U'")
/** (HG) -> (HD) -> (HA): E = D².HDHD'.(H'D')².HD' */
export const CYCLE = parseMoves(PLL_UB)
/** (HAG) (HDA), and three top edges: H²DHD²B.D'HDB'.(D'H')².D'H */
export const SWAP = parseMoves("U2 R U R2 D R' U R D' R' U' R' U' R' U")
/** (HDA)+ (HPD)+ (HGP)+, and three top edges: DHD'H.DH²D'H² */
export const TWIST = parseMoves(SUNE_BACK)

const UDR = moveSet('U D R')
const U = moveSet('U')
const UD = moveSet('U D')

const CROSS = pieces('DF DR DB DL')
const CORNERS = pieces('DFR DRB DBL DLF')
const MIDDLE = pieces('FR BR')
const F2L = [...CROSS, ...CORNERS, ...MIDDLE]

const placed = (cube: Cube) => home(F2L)(cube) && topCornersPlaced(cube)

export const SQUAREBIK_PLAN: MethodPlan = [
  {
    key: 'stepBottomCross',
    goal: home(CROSS),
    moves: UDR,
    phases: [2, 3, 4].map((n) => placing(CROSS.slice(0, n), UDR)),
  },
  {
    key: 'stepBottomCorners',
    goal: home([...CROSS, ...CORNERS]),
    moves: UDR,
    phases: [1, 2, 3, 4].map((n) =>
      placing([...CROSS, ...CORNERS.slice(0, n)], UD, bothWays([DOWN])),
    ),
  },
  {
    key: 'stepMiddle',
    goal: home(F2L),
    moves: UDR,
    phases: [1, 2].map((n) =>
      placing(
        [...CROSS, ...CORNERS, ...MIDDLE.slice(0, n)],
        U,
        conjugated(
          bothWays([CYCLE]),
          ['R', "R'"].map((s) => parseMoves(s)),
        ),
      ),
    ),
  },
  {
    key: 'stepPermuteCorners',
    goal: placed,
    moves: UDR,
    phases: [reaching(TOP_CORNERS, topCornersPlaced, U, bothWays([SWAP]), cornerPlaces)],
  },
  {
    key: 'stepOrientCorners',
    goal: (cube) => placed(cube) && home(TOP.slice(4))(cube),
    moves: UDR,
    phases: [placing(TOP.slice(4), U, bothWays([TWIST]))],
  },
  {
    key: 'stepPermuteEdges',
    goal: isSolved,
    moves: UDR,
    phases: [placing(TOP, U, bothWays([CYCLE]))],
  },
]
