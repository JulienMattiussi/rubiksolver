import { isBoxed, isSolved } from '../../core/cube'
import { allTurnsOf } from '../../core/moveSet'
import type { MethodPlan } from '../../solve/solverKit'
import { solvePurple, purpleToCube } from '../../puzzles/twisted/purpleStates'

/**
 * The Purple's methods, both from a search of its whole state space (41760
 * states, purpleStates.ts): no human method is known for it yet.
 *
 *   Shape then colors   1. The cube again    the fewest turns back to a
 *                                            cube, A's colors aside
 *                       2. A's colors        the fewest turns from that
 *                                            cube (one of 35 cases) to
 *                                            solved: an algorithm per case
 *   Optimal             the shortest solution, at once
 */

const TURNS = allTurnsOf('purple')

export const PURPLE_SHAPE_FIRST_PLAN: MethodPlan = [
  { key: 'stepPurpleCube', goal: isBoxed, moves: TURNS, phases: [purpleToCube] },
  { key: 'stepPurpleColors', goal: isSolved, moves: TURNS, phases: [solvePurple] },
]

export const PURPLE_OPTIMAL_PLAN: MethodPlan = [
  { key: 'stepOptimal', goal: isSolved, moves: TURNS, phases: [solvePurple] },
]
