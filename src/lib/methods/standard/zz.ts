import { isSolved } from '../../core/cube'
import { moveSet, OUTER_TURNS } from '../../core/moveSet'
import type { MethodPlan } from '../../solve/solverKit'
import type { Cube } from '../../core/types'
import { solvePermuteCorners, solvePermuteEdges, solveTopFace, topFaceDone } from './layers3'
import {
  buildBlock,
  edgesOriented,
  orientAllEdges,
  orientedF2LDone,
  pieces,
  piecesHome,
  RU,
  RU_F2L_PHASES,
} from './pieces3'

/**
 * ZZ (Zbigniew Zborowski): orient every edge first, so that the rest needs
 * no F nor B at all.
 *
 *   1. EOLine       orient the 12 edges, then place DF and DB (the "line")
 *                   with turns that keep them oriented (F2 and B2 only)
 *   2. Left block   1x2x3 on the left with <L, U, R>
 *   3. Right block  1x2x3 on the right with <R, U>
 *   4. OCLL         orient the last-layer corners (edges are already)
 *   5. PLL          permute the last layer
 */

const LINE = pieces('DF DB')
const LEFT_BLOCK = pieces('DL FL BL DFL DBL')

/** Turns that never flip an edge (no quarter turn of F or B). */
const ORIENTED_TURNS = moveSet('U D L R F2 B2')
const LUR = moveSet('L U R')

const eoLineDone = (c: Cube) => edgesOriented(c) && piecesHome(c, LINE)
const leftBlockDone = (c: Cube) => eoLineDone(c) && piecesHome(c, LEFT_BLOCK)

/** EO first: nothing is built yet, so any turn goes. */
const orientEdges = orientAllEdges(OUTER_TURNS)

export const ZZ_PLAN: MethodPlan = [
  {
    key: 'stepEOLine',
    goal: eoLineDone,
    moves: OUTER_TURNS,
    phases: [orientEdges, buildBlock(LINE, ORIENTED_TURNS)],
  },
  {
    key: 'stepLeftBlock',
    goal: leftBlockDone,
    moves: LUR,
    phases: [buildBlock(pieces('DL FL DFL'), LUR), buildBlock(LEFT_BLOCK, LUR)],
  },
  { key: 'stepRightBlock', goal: orientedF2LDone, moves: RU, phases: RU_F2L_PHASES },
  { key: 'stepOCLL', goal: topFaceDone, moves: OUTER_TURNS, phases: [solveTopFace] },
  {
    key: 'stepPLL',
    goal: isSolved,
    moves: OUTER_TURNS,
    phases: [solvePermuteCorners, solvePermuteEdges],
  },
]
