import { isBoxed, isSolved } from '../cube'
import { allTurnsOf } from '../moveSet'
import type { MethodPlan } from '../solverKit'
import { solveViolet, violetToCube } from '../violetStates'

/**
 * The Violet's methods, both from a search of its whole state space (41760
 * states, violetStates.ts): no human method is known for it yet.
 *
 *   Shape then colors   1. The cube again    the fewest turns back to a
 *                                            cube, A's colors aside
 *                       2. A's colors        the fewest turns from that
 *                                            cube (one of 35 cases) to
 *                                            solved: an algorithm per case
 *   Optimal             the shortest solution, at once
 */

const TURNS = allTurnsOf('violet')

export const VIOLET_SHAPE_FIRST_PLAN: MethodPlan = [
  { key: 'stepVioletCube', goal: isBoxed, moves: TURNS, phases: [violetToCube] },
  { key: 'stepVioletColors', goal: isSolved, moves: TURNS, phases: [solveViolet] },
]

export const VIOLET_OPTIMAL_PLAN: MethodPlan = [
  { key: 'stepOptimal', goal: isSolved, moves: TURNS, phases: [solveViolet] },
]
