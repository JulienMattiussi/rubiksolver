import { homesOf, isSolved } from '../cube'
import { allTurnsOf } from '../moveSet'
import { solvePieces } from '../pieceSearch'
import type { MethodPlan } from '../solverKit'
import type { Cube, Move } from '../types'

/** The four half turns of a 1x2x3 (its thin axis has no move of its own):
 *  the whole puzzle, not a restriction, so not shown as one. */
const TURNS_123 = allTurnsOf('123')

/** Depth that exhausts the 1x2x3: its reachable states all sit within 6 half
 *  turns of solved (asserted in the tests), so 7 proves a cube impossible. */
const MAX_DEPTH_123 = 7

/**
 * Shortest solution of a 1x2x3, by plain breadth-first search over the whole
 * puzzle: the reachable space is tiny (96 states), so the first hit is
 * optimal. Any orientation of a solved puzzle counts (a cuboid has no fixed
 * center to anchor a frame). Throws once the depth is exhausted, which is
 * what validation needs to reject an impossible puzzle.
 */
export function solveFlat123(cube: Cube): Move[] {
  return solvePieces(cube, {
    track: homesOf('123', () => true),
    moves: TURNS_123,
    goal: isSolved,
    maxDepth: MAX_DEPTH_123,
  })
}

/** 1x2x3 optimal solution, as a single step. */
export const OPTIMAL_123_PLAN: MethodPlan = [
  {
    key: 'stepOptimal',
    goal: isSolved,
    moves: TURNS_123,
    phases: [solveFlat123],
  },
]
