import { FACE_COLOR, isSolved } from '../cube'
import { OUTER_TURNS } from '../moveSet'
import { atEverySide, relMoves, SIDES, solveWithAlgs, type MethodPlan } from '../solverKit'
import { applyMoves } from '../turn'
import type { Cube, Cubie, Face, Move } from '../types'
import { PLL_AA, SUNE } from './algs'
import {
  crossDone,
  firstLayerDone,
  placePieces,
  solveCross,
  solveFirstLayerCorners,
} from './layers3'
import { colorAt, hasColors } from '../pieces'

/**
 * Barrel, layer by layer, as taught on fan2cube.fr (barrel2): a Rubik's
 * Cube method, but its four middle edges show one color only, so their
 * way round never matters, and one top edge can be left to flip alone.
 *
 *   1. Bottom layer   cross then corners, as on a Rubik's Cube
 *   2. Equator        its edges in place, either way round: [HD].[H'A']
 *   3. Top corners    turned (Sune), then placed (Aa)
 *   4. Top edges      placed by the 3-cycle D².HAP'.D².PA'H.D²
 *   5. Top edges      turned two at a time by DPGAH.A'HG'P'D'.A'H'AH', or one
 *                     alone with a middle edge (unseen) by HGBDA.D'AB'G'H'.D'A'DA'
 *
 * Notation (page -> app): H B A P G D = U D F B L R. Each formula's effect
 * is asserted in tests/unit/barrel.test.ts.
 */

/** 2: [HD].[H'A'], inserting the top front edge at front right. */
export const EQUATOR_INSERT = "U R U' R' U' F' U F"
/** 4: (HP) -> (HD) -> (HA) */
export const EDGE_CYCLE = "R2 U F B' R2 B F' U R2"
/** 5: HA and HD turned over. */
export const EDGE_FLIP = "R B L F U F' U L' B' R' F' U' F U'"
/** 5: HA turned over, and the middle edge AD (which shows nothing of it). */
export const EDGE_FLIP_ALONE = "U L D R F R' F D' L' U' R' F' R F'"

const CORNER_PAIRS: ReadonlyArray<readonly [Face, Face]> = [
  ['F', 'R'],
  ['R', 'B'],
  ['B', 'L'],
  ['L', 'F'],
]

const find = (cube: Cube, faces: readonly Face[]): Cubie =>
  cube.find((c) =>
    hasColors(
      c,
      faces.map((f) => FACE_COLOR[f]),
    ),
  )!

/** A middle edge in its slot, either way round. */
const middleIn = (cube: Cube, a: Face, b: Face) => {
  const edge = find(cube, [a, b])
  return colorAt(edge, a) !== undefined && colorAt(edge, b) !== undefined
}

const equatorDone = (cube: Cube) =>
  firstLayerDone(cube) && CORNER_PAIRS.every(([a, b]) => middleIn(cube, a, b))

/** The top corners turned white up. */
const cornersTurned = (cube: Cube) =>
  equatorDone(cube) &&
  CORNER_PAIRS.every(([a, b]) => colorAt(find(cube, ['U', a, b]), 'U') === FACE_COLOR.U)

/** The top corners home, and turned. */
const cornersDone = (cube: Cube) =>
  cornersTurned(cube) &&
  CORNER_PAIRS.every(([a, b]) => {
    const corner = find(cube, ['U', a, b])
    return colorAt(corner, a) === FACE_COLOR[a] && colorAt(corner, b) === FACE_COLOR[b]
  })

/** The top edges in their slots, either way round. */
const edgesPlaced = (cube: Cube) =>
  cornersDone(cube) &&
  SIDES.every((s) => {
    const edge = find(cube, ['U', s])
    return colorAt(edge, 'U') !== undefined && colorAt(edge, s) !== undefined
  })

const INSERTS = [...atEverySide(EQUATOR_INSERT), ...atEverySide("U' L' U L U F U' F'")]

const solveEquator = (cube: Cube): Move[] =>
  placePieces(cube, CORNER_PAIRS, middleIn, firstLayerDone, INSERTS)

const solveCorners = (cube: Cube): Move[] => {
  const turned = solveWithAlgs(cube, [relMoves(SUNE, 'F')], cornersTurned, 8)
  const placed = solveWithAlgs(applyMoves(cube, turned), [relMoves(PLL_AA, 'F')], cornersDone, 6)
  return [...turned, ...placed]
}

const solveEdges = (cube: Cube): Move[] =>
  solveWithAlgs(cube, atEverySide(EDGE_CYCLE), edgesPlaced, 4)

const solveFlips = (cube: Cube): Move[] =>
  solveWithAlgs(cube, [...atEverySide(EDGE_FLIP), ...atEverySide(EDGE_FLIP_ALONE)], isSolved, 4)

export const BARREL_PLAN: MethodPlan = [
  { key: 'stepBottomCross', goal: crossDone, moves: OUTER_TURNS, phases: [solveCross] },
  {
    key: 'stepBottomCorners',
    goal: firstLayerDone,
    moves: OUTER_TURNS,
    phases: [solveFirstLayerCorners],
  },
  { key: 'stepBarrelEquator', goal: equatorDone, moves: OUTER_TURNS, phases: [solveEquator] },
  { key: 'stepBarrelCorners', goal: cornersDone, moves: OUTER_TURNS, phases: [solveCorners] },
  { key: 'stepBarrelEdges', goal: edgesPlaced, moves: OUTER_TURNS, phases: [solveEdges] },
  { key: 'stepBarrelFlip', goal: isSolved, moves: OUTER_TURNS, phases: [solveFlips] },
]
