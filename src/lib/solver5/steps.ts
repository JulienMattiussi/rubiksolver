import { allTurnsOf, type MoveSet } from '../moveSet'
import { projectPlan } from '../solver4/steps'
import type { MethodPlan } from '../solverKit'
import { centersDone, solveCenters } from './centers'
import { MIDDLES } from '../cycleLibrary'
import { fixEdgeParity, pairEdges, pairedOrParity } from './edges'
import { isReduced, to3x3 } from './project'

/**
 * 5x5 reduction methods, like the 4x4's (solver4/steps.ts): the centers,
 * the edges paired, the edge parity when the last edge comes out crossed,
 * then the given 3x3 plan through the projection. Only the edge parity
 * exists here: a reduced 5x5's corners and middle pieces are those of a
 * real 3x3, so its projection is always a legal 3x3.
 */

const ALL_5 = allTurnsOf('5')

/** Every turn, the middle slices too (the cross centers' commutators). */
const WITH_MIDDLES: MoveSet = {
  generators: [...ALL_5.generators, ...MIDDLES],
  turns: [...ALL_5.turns, ...MIDDLES],
}

export function reduction5Plan(plan3x3: MethodPlan): MethodPlan {
  return [
    { key: 'stepCenters', goal: centersDone, moves: WITH_MIDDLES, phases: [solveCenters] },
    { key: 'stepPairEdges', goal: pairedOrParity, moves: ALL_5, phases: [pairEdges] },
    {
      key: 'stepParity',
      goal: isReduced,
      moves: ALL_5,
      phases: [fixEdgeParity],
      optional: true,
    },
    ...projectPlan(plan3x3, to3x3),
  ]
}
