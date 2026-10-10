import { isSolved } from '../cube'
import { moveSet, OUTER_TURNS } from '../moveSet'
import { parseMoves } from '../moves'
import { solvePieces } from '../pieceSearch'
import { relMoves, solveWithAlgs, type MethodPlan } from '../solverKit'
import type { Cube, Move } from '../types'
import { ANTISUNE, NIKLAS, SUNE } from './algs'
import { secondLayerDone, solvePermuteEdges } from './layers3'
import {
  buildBlock,
  edgesOriented,
  home,
  joined,
  orientationKey,
  pieceInSlot,
  pieces,
  piecesHome,
} from './pieces3'

/**
 * Petrus (Lars Petrus), in its seven original steps:
 *
 *   1. 2x2x2 block      down-back-left, any turn
 *   2. 2x2x3 block      extended to the front with <U, R, F> only: these
 *                       never touch the 2x2x2, so it stays built
 *   3. Fix bad edges    orient every edge; F and B only appear as F' U F and
 *                       B U B' conjugates, which put the block back
 *   4. Finish the F2L   with <R, U> only, possible precisely because every
 *                       edge is now oriented
 *   5. Place corners    last-layer corners to their spots (Niklas)
 *   6. Twist corners    (Sune, Antisune)
 *   7. Place edges      (Ua-perm), already oriented since step 3
 */

const BLOCK_222 = pieces('DL DB BL DBL')
const BLOCK_223 = joined(BLOCK_222, pieces('DF FL DFL'))
const U_CORNERS = pieces('UFL UFR UBL UBR')
const ALL_EDGES = pieces('UF UB UL UR DF DB DL DR FL FR BL BR')

const EXTEND_TURNS = moveSet('U R F')
const EO_TURNS = moveSet('U R F B')
const RU = moveSet('R U')

/**
 * Edge-flipping sequences that keep the 2x2x3: F' (or B) parks the block's
 * front (or back) column on the D and R sides, out of U's way, so turning U
 * and undoing the parking move flips edges without breaking anything built.
 */
const EO_FLIPS: readonly Move[][] = ['U', 'U2', "U'"].flatMap((u) => [
  parseMoves(`F' ${u} F`),
  parseMoves(`B ${u} B'`),
])

/** Step 4, shared with ZZ (its right block): <R, U> only, pair by pair. */
export const RU_F2L_PHASES = [
  buildBlock(pieces('DR FR DFR'), RU),
  buildBlock(pieces('DR FR DFR BR DBR'), RU),
]

const block222Done = (c: Cube) => piecesHome(c, BLOCK_222)
const block223Done = (c: Cube) => piecesHome(c, BLOCK_223)
const edgesFixed = (c: Cube) => block223Done(c) && edgesOriented(c)
const f2lDone = (c: Cube) => secondLayerDone(c) && edgesOriented(c)
const cornersPlaced = (c: Cube) => f2lDone(c) && U_CORNERS.every((n) => pieceInSlot(c, n))
const cornersDone = (c: Cube) => f2lDone(c) && piecesHome(c, U_CORNERS)

/** Step 3: the orientation pattern is all that matters (the flips and R/U
 *  keep the block), so the search is keyed on it alone. */
function fixBadEdges(cube: Cube): Move[] {
  return solvePieces(cube, {
    track: ALL_EDGES.map(home),
    moves: RU,
    macros: EO_FLIPS,
    goal: edgesOriented,
    key: orientationKey,
    maxDepth: 10,
  })
}

function placeCorners(cube: Cube): Move[] {
  return solveWithAlgs(cube, [relMoves(NIKLAS, 'F')], cornersPlaced, 4)
}

function twistCorners(cube: Cube): Move[] {
  return solveWithAlgs(cube, [relMoves(SUNE, 'F'), relMoves(ANTISUNE, 'F')], cornersDone, 5)
}

export const PETRUS_PLAN: MethodPlan = [
  {
    key: 'stepBlock222',
    goal: block222Done,
    moves: OUTER_TURNS,
    phases: [buildBlock(pieces('DL DBL'), OUTER_TURNS), buildBlock(BLOCK_222, OUTER_TURNS)],
  },
  {
    key: 'stepBlock223',
    goal: block223Done,
    moves: EXTEND_TURNS,
    phases: [buildBlock(pieces('DF FL DFL'), EXTEND_TURNS)],
  },
  { key: 'stepFixEdges', goal: edgesFixed, moves: EO_TURNS, phases: [fixBadEdges] },
  { key: 'stepF2LRU', goal: f2lDone, moves: RU, phases: RU_F2L_PHASES },
  { key: 'stepPermuteCorners', goal: cornersPlaced, moves: OUTER_TURNS, phases: [placeCorners] },
  { key: 'stepOrientCorners', goal: cornersDone, moves: OUTER_TURNS, phases: [twistCorners] },
  { key: 'stepPermuteEdges', goal: isSolved, moves: OUTER_TURNS, phases: [solvePermuteEdges] },
]
