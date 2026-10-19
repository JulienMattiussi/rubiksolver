import { cubeShape, isSolved } from '../core/cube'
import { homesOf } from '../core/pieces'
import { allTurnsOf } from '../core/moveSet'
import { solvePieces } from './pieceSearch'
import type { MethodPlan } from './solverKit'
import type { Cube, Turn } from '../core/types'
import type { CubeShape } from '../core/shapes'

/**
 * Optimal solving of the puzzles small enough to search whole: the 1x2x3
 * (96 states), the Floppy (192) and the Floppy Ghost (30 720). A plain breadth-first search over every
 * turn returns a shortest solution, and any orientation of a solved puzzle
 * counts (a cuboid has no fixed center to anchor a frame).
 *
 * Each search depth, given by the registry (solver.ts), is the puzzle's
 * diameter plus one (both asserted in the tests): a solvable state is always
 * found before, so running out proves the puzzle impossible, which
 * validation relies on.
 */

/** Shortest solution of a small puzzle, searched `maxDepth` turns deep
 *  (throws on an impossible one). */
export function solveExhaustively(cube: Cube, maxDepth: number): Turn[] {
  const shape = cubeShape(cube)
  return solvePieces<Turn>(cube, {
    track: homesOf(shape, () => true),
    moves: allTurnsOf(shape),
    goal: isSolved,
    maxDepth,
  })
}

/** A small puzzle's optimal solution, as a single step. Its turns are the
 *  whole puzzle's, not a restriction, so they are not shown as one. */
export function optimalPlan(shape: CubeShape, maxDepth: number): MethodPlan {
  return [
    {
      key: 'stepOptimal',
      goal: isSolved,
      moves: allTurnsOf(shape),
      phases: [(cube) => solveExhaustively(cube, maxDepth)],
    },
  ]
}
