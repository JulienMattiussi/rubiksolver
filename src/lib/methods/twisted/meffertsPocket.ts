import { isBoxed, isSolved } from '../../core/cube'
import { allTurnsOf } from '../../core/moveSet'
import type { MethodPlan } from '../../solve/solverKit'
import {
  solveMeffertsPocket,
  meffertsPocketToCube,
} from '../../puzzles/twisted/meffertsPocketStates'

/**
 * Meffert's Pocket Cube's methods, both from a search of its whole state space (41760
 * states, meffertsPocketStates.ts): no human method is known for it yet.
 *
 *   Shape then colors   1. The cube again    the fewest turns back to a
 *                                            cube, A's colors aside
 *                       2. A's colors        the fewest turns from that
 *                                            cube (one of 35 cases) to
 *                                            solved: an algorithm per case
 *   Optimal             the shortest solution, at once
 */

const TURNS = allTurnsOf('meffertsPocket')

export const MEFFERTS_POCKET_SHAPE_FIRST_PLAN: MethodPlan = [
  { key: 'stepMeffertsPocketCube', goal: isBoxed, moves: TURNS, phases: [meffertsPocketToCube] },
  { key: 'stepMeffertsPocketColors', goal: isSolved, moves: TURNS, phases: [solveMeffertsPocket] },
]

export const MEFFERTS_POCKET_OPTIMAL_PLAN: MethodPlan = [
  { key: 'stepOptimal', goal: isSolved, moves: TURNS, phases: [solveMeffertsPocket] },
]
