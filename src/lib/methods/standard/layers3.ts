import { FACE_COLOR, isSolved } from '../../core/cube'
import { colorAt, hasColors } from '../../core/pieces'
import { applyMoves } from '../../core/turn'
import { OUTER_TURNS } from '../../core/moveSet'
import {
  atEverySide,
  OUTER_GENERATORS,
  relMoves,
  search,
  SIDES,
  solveWithAlgs,
  type MethodPlan,
} from '../../solve/solverKit'
import type { Color, Cube, Cubie, Face, Move } from '../../core/types'
import { INSERT_RIGHT, OLL_EDGE, PLL_AA, PLL_UA, SUNE } from './algs'

/**
 * Layer-by-layer methods of the 3x3: the beginner method and CFOP (Fridrich).
 *
 * Frame: yellow (D) is the first layer, white (U) is the last layer.
 * Beginner phases:
 *   1. Bottom (yellow) cross          - shortest-path search
 *   2. Bottom corners                 - one by one, searched over insertion triggers
 *   3. Middle-layer edges             - same, with the middle-layer triggers
 *   4. Top (white) cross              - orient last-layer edges  (alg + AUF search)
 *   5. Orient last-layer corners      - alg + AUF search
 *   6. Permute last-layer corners     - alg + AUF search
 *   7. Permute last-layer edges       - alg + AUF search
 * CFOP groups the same bricks as Cross, F2L (pair by pair), OLL and PLL.
 *
 * The moves for every phase are found by a small search rather than fixed
 * notation, so a returned sequence is guaranteed to satisfy the phase goal.
 * The last-layer phases search over "align U, then apply a known algorithm",
 * which keeps the branching tiny while the base algorithms (validated in
 * tests) generate every case. Solutions are long but always correct.
 */

// ---------------------------------------------------------------------------
// Piece queries
// ---------------------------------------------------------------------------

/** Find the edge cubie carrying exactly the two given colors. */
function findEdge(cube: Cube, a: Color, b: Color): Cubie {
  const piece = cube.find((c) => hasColors(c, [a, b]))
  if (!piece) throw new Error(`Edge ${a}${b} not found`)
  return piece
}

/** Find the corner cubie carrying exactly the three given colors. */
function findCorner(cube: Cube, a: Color, b: Color, c: Color): Cubie {
  const piece = cube.find((cc) => hasColors(cc, [a, b, c]))
  if (!piece) throw new Error(`Corner ${a}${b}${c} not found`)
  return piece
}

// ---------------------------------------------------------------------------
// Phase predicates (exported for tests and for the methods reusing them)
// ---------------------------------------------------------------------------

/** The cross edge of side `s` (yellow and that side's color) at its slot,
 *  yellow down. */
export function edgePlaced(cube: Cube, s: Face): boolean {
  const edge = findEdge(cube, FACE_COLOR.D, FACE_COLOR[s])
  return colorAt(edge, 'D') === FACE_COLOR.D && colorAt(edge, s) === FACE_COLOR[s]
}

export function crossDone(cube: Cube): boolean {
  return SIDES.every((s) => edgePlaced(cube, s))
}

/** The corner carrying `frame`'s (D, s1, s2) colors sits at its slot, correctly
 *  oriented. */
function cornerPlacedIn(cube: Cube, frame: Record<Face, Color>, s1: Face, s2: Face): boolean {
  const corner = findCorner(cube, frame.D, frame[s1], frame[s2])
  return (
    colorAt(corner, 'D') === frame.D &&
    colorAt(corner, s1) === frame[s1] &&
    colorAt(corner, s2) === frame[s2]
  )
}

/** The first-layer corner between sides `s1` and `s2` at its slot, yellow
 *  down. */
export function cornerPlaced(cube: Cube, s1: Face, s2: Face): boolean {
  return cornerPlacedIn(cube, FACE_COLOR, s1, s2)
}

/** The first layer's corner slots, by their two sides: the second the
 *  first's right (seen with the first in front). */
export const CORNER_PAIRS: ReadonlyArray<readonly [Face, Face]> = [
  ['F', 'R'],
  ['R', 'B'],
  ['B', 'L'],
  ['L', 'F'],
]

export function firstLayerDone(cube: Cube): boolean {
  return crossDone(cube) && CORNER_PAIRS.every(([a, b]) => cornerPlaced(cube, a, b))
}

/** The middle-layer edge between sides `s1` and `s2` at its slot, its
 *  colors on their sides. */
export function middleEdgePlaced(cube: Cube, s1: Face, s2: Face): boolean {
  const edge = findEdge(cube, FACE_COLOR[s1], FACE_COLOR[s2])
  return colorAt(edge, s1) === FACE_COLOR[s1] && colorAt(edge, s2) === FACE_COLOR[s2]
}

/** First two layers solved (the F2L of every method that ends on the U layer). */
export function secondLayerDone(cube: Cube): boolean {
  return firstLayerDone(cube) && CORNER_PAIRS.every(([a, b]) => middleEdgePlaced(cube, a, b))
}

/** White cross on U: all four U-edges show white on top. */
export function topCrossDone(cube: Cube): boolean {
  if (!secondLayerDone(cube)) return false
  return SIDES.every(
    (s) => colorAt(findEdge(cube, FACE_COLOR.U, FACE_COLOR[s]), 'U') === FACE_COLOR.U,
  )
}

/** Entire U face oriented white (last layer oriented). */
export function topFaceDone(cube: Cube): boolean {
  if (!topCrossDone(cube)) return false
  return cube
    .filter((c) => colorAt(c, 'U') !== undefined)
    .every((c) => colorAt(c, 'U') === FACE_COLOR.U)
}

/** Last-layer corners oriented and correctly placed. */
export function topCornersDone(cube: Cube): boolean {
  if (!topFaceDone(cube)) return false
  return CORNER_PAIRS.every(([a, b]) => {
    const corner = findCorner(cube, FACE_COLOR.U, FACE_COLOR[a], FACE_COLOR[b])
    return colorAt(corner, a) === FACE_COLOR[a] && colorAt(corner, b) === FACE_COLOR[b]
  })
}

// ---------------------------------------------------------------------------
// Phases
// ---------------------------------------------------------------------------

export function solveCross(cube: Cube): Move[] {
  let state = cube
  const all: Move[] = []
  for (const s of SIDES) {
    if (edgePlaced(state, s)) continue
    const placed = SIDES.filter((x) => edgePlaced(state, x))
    const goal = (c: Cube) => placed.every((x) => edgePlaced(c, x)) && edgePlaced(c, s)
    const moves = search(state, goal, OUTER_GENERATORS, 8)
    state = applyMoves(state, moves)
    all.push(...moves)
  }
  return all
}

// Insertion triggers, tried at every side so the search can extract a piece
// from a wrong slot and drop it into the right one.
const CORNER_TRIGGERS = [...atEverySide("R U R'"), ...atEverySide("R U' R'")]
const MIDDLE_TRIGGERS = [
  ...atEverySide(INSERT_RIGHT), // insert edge into the front-right slot
  ...atEverySide("U' L' U L U F U' F'"), // insert edge into the front-left slot
]

/**
 * Place pieces one at a time: for each side pair not yet `placed`, search for
 * trigger applications that place it while `baseGoal` and every previously
 * placed pair keep holding. Shared by the 3x3 corner and middle-edge phases
 * and the 2x2 bottom layer, which differ only in pairs, predicate and triggers.
 */
export function placePieces(
  cube: Cube,
  pairs: ReadonlyArray<readonly [Face, Face]>,
  placed: (c: Cube, s1: Face, s2: Face) => boolean,
  baseGoal: (c: Cube) => boolean,
  triggers: Move[][],
): Move[] {
  let state = cube
  const all: Move[] = []
  for (const [s1, s2] of pairs) {
    if (placed(state, s1, s2)) continue
    const prior = pairs.filter(([a, b]) => placed(state, a, b))
    const goal = (c: Cube) =>
      baseGoal(c) && prior.every(([a, b]) => placed(c, a, b)) && placed(c, s1, s2)
    const moves = solveWithAlgs(state, triggers, goal, 5)
    state = applyMoves(state, moves)
    all.push(...moves)
  }
  return all
}

export function solveFirstLayerCorners(cube: Cube): Move[] {
  return placePieces(cube, CORNER_PAIRS, cornerPlaced, crossDone, CORNER_TRIGGERS)
}

export function solveMiddleLayer(cube: Cube): Move[] {
  return placePieces(cube, CORNER_PAIRS, middleEdgePlaced, firstLayerDone, MIDDLE_TRIGGERS)
}

export function solveTopCross(cube: Cube): Move[] {
  return solveWithAlgs(cube, [relMoves(OLL_EDGE, 'F')], topCrossDone, 4)
}

export function solveTopFace(cube: Cube): Move[] {
  return solveWithAlgs(cube, [relMoves(SUNE, 'F')], topFaceDone, 8)
}

export function solvePermuteCorners(cube: Cube): Move[] {
  return solveWithAlgs(cube, [relMoves(PLL_AA, 'F')], topCornersDone, 6)
}

export function solvePermuteEdges(cube: Cube): Move[] {
  return solveWithAlgs(cube, [relMoves(PLL_UA, 'F')], isSolved, 6)
}

// F2L solved slot by slot (CFOP structure): for each column the corner then its
// middle edge is placed, keeping every finished slot intact.
function pairPlaced(cube: Cube, s1: Face, s2: Face): boolean {
  return cornerPlaced(cube, s1, s2) && middleEdgePlaced(cube, s1, s2)
}

function solveF2L(cube: Cube): Move[] {
  let state = cube
  const all: Move[] = []
  const push = (moves: Move[]) => {
    state = applyMoves(state, moves)
    all.push(...moves)
  }
  for (const [s1, s2] of CORNER_PAIRS) {
    if (pairPlaced(state, s1, s2)) continue
    const prior = CORNER_PAIRS.filter(([a, b]) => pairPlaced(state, a, b))
    const priorOk = (c: Cube) => crossDone(c) && prior.every(([a, b]) => pairPlaced(c, a, b))
    push(solveWithAlgs(state, CORNER_TRIGGERS, (c) => priorOk(c) && cornerPlaced(c, s1, s2), 6))
    push(
      solveWithAlgs(
        state,
        MIDDLE_TRIGGERS,
        (c) => priorOk(c) && cornerPlaced(c, s1, s2) && middleEdgePlaced(c, s1, s2),
        6,
      ),
    )
  }
  return all
}

/** The seven classic stages of the beginner "layer by layer" 3x3 method. */
export const BEGINNER_PLAN: MethodPlan = [
  { key: 'stepBottomCross', goal: crossDone, moves: OUTER_TURNS, phases: [solveCross] },
  {
    key: 'stepBottomCorners',
    goal: firstLayerDone,
    moves: OUTER_TURNS,
    phases: [solveFirstLayerCorners],
  },
  { key: 'stepMiddle', goal: secondLayerDone, moves: OUTER_TURNS, phases: [solveMiddleLayer] },
  { key: 'stepTopCross', goal: topCrossDone, moves: OUTER_TURNS, phases: [solveTopCross] },
  { key: 'stepOrientCorners', goal: topFaceDone, moves: OUTER_TURNS, phases: [solveTopFace] },
  {
    key: 'stepPermuteCorners',
    goal: topCornersDone,
    moves: OUTER_TURNS,
    phases: [solvePermuteCorners],
  },
  { key: 'stepPermuteEdges', goal: isSolved, moves: OUTER_TURNS, phases: [solvePermuteEdges] },
]

/** The four CFOP (Fridrich) stages: Cross, F2L, OLL, PLL. */
export const CFOP_PLAN: MethodPlan = [
  { key: 'stepCross', goal: crossDone, moves: OUTER_TURNS, phases: [solveCross] },
  { key: 'stepF2L', goal: secondLayerDone, moves: OUTER_TURNS, phases: [solveF2L] },
  {
    key: 'stepOLL',
    goal: topFaceDone,
    moves: OUTER_TURNS,
    phases: [solveTopCross, solveTopFace],
  },
  {
    key: 'stepPLL',
    goal: isSolved,
    moves: OUTER_TURNS,
    phases: [solvePermuteCorners, solvePermuteEdges],
  },
]
