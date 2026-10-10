import { applyMove, isSolved, stateKey } from '../cube'
import { movesFor } from '../moves'
import { moveSet } from '../moveSet'
import type { MethodPlan } from '../solverKit'
import type { Cube, Move } from '../types'

/** The four half turns of a 1x2x3 (its thin axis has no move of its own). */
const MOVES_123 = movesFor('123')

/** Depth that exhausts the 1x2x3: its reachable states all sit within 6 half
 *  turns of solved (asserted in the tests), so 7 proves a cube impossible. */
const MAX_DEPTH_123 = 7

/**
 * Shortest solution of a 1x2x3, by plain breadth-first search: every move is
 * a half turn and the reachable space is tiny, so the whole thing is explored
 * in a blink and the first hit is optimal. Any orientation of a solved puzzle
 * counts (a cuboid has no fixed center to anchor a frame). Throws once the
 * depth is exhausted, which is what validation needs to reject an impossible
 * puzzle.
 */
export function solveFlat123(cube: Cube): Move[] {
  if (isSolved(cube)) return []
  let frontier: Array<{ cube: Cube; moves: Move[] }> = [{ cube, moves: [] }]
  const seen = new Set<string>([stateKey(cube)])
  for (let depth = 0; depth < MAX_DEPTH_123; depth++) {
    const next: typeof frontier = []
    for (const node of frontier) {
      for (const move of MOVES_123) {
        const turned = applyMove(node.cube, move)
        const key = stateKey(turned)
        if (seen.has(key)) continue
        const moves = [...node.moves, move]
        if (isSolved(turned)) return moves
        seen.add(key)
        next.push({ cube: turned, moves })
      }
    }
    frontier = next
  }
  throw new Error('solveFlat123: no solution within the search depth')
}

/** 1x2x3 optimal solution, as a single step (half turns only: that is the
 *  whole puzzle, not a restriction, so it is not shown as one). */
export const OPTIMAL_123_PLAN: MethodPlan = [
  {
    key: 'stepOptimal',
    goal: isSolved,
    moves: moveSet('U2 D2 L2 R2', false),
    phases: [solveFlat123],
  },
]
