import { cubeShape, isSolved } from '../core/cube'
import { homesOf } from '../core/pieces'
import { allTurnsOf } from '../core/moveSet'
import { solvePieces } from './pieceSearch'
import type { MethodPlan } from './solverKit'
import type { Cube, CubeShape, Turn } from '../core/types'

/**
 * Optimal solving of the puzzles small enough to search whole: the 1x2x3
 * (96 states), the Floppy (192) and the Floppy Ghost (30 720). A plain breadth-first search over every
 * turn returns a shortest solution, and any orientation of a solved puzzle
 * counts (a cuboid has no fixed center to anchor a frame).
 *
 * Each search depth is the puzzle's diameter plus one (both asserted in the
 * tests): a solvable state is always found before, so running out proves the
 * puzzle impossible, which validation relies on.
 */
const SEARCH_DEPTH: Partial<Record<CubeShape, number>> = { '123': 7, '331': 9, ghost: 16 }

/** Shortest solution of a small puzzle (throws on an impossible one). */
export function solveExhaustively(cube: Cube): Turn[] {
  const shape = cubeShape(cube)
  const maxDepth = SEARCH_DEPTH[shape]
  if (maxDepth === undefined) throw new Error(`solveExhaustively: ${shape} is not small`)
  return solvePieces<Turn>(cube, {
    track: homesOf(shape, () => true),
    moves: allTurnsOf(shape),
    goal: isSolved,
    maxDepth,
  })
}

/** A small puzzle's optimal solution, as a single step. Its turns are the
 *  whole puzzle's, not a restriction, so they are not shown as one. */
export function optimalPlan(shape: CubeShape): MethodPlan {
  return [
    { key: 'stepOptimal', goal: isSolved, moves: allTurnsOf(shape), phases: [solveExhaustively] },
  ]
}
