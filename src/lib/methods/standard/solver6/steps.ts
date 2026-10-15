import { allTurnsOf } from '../../../core/moveSet'
import { projectOuterPlan } from '../solver4/steps'
import type { MethodPlan } from '../../../solve/solverKit'
import { centersDone, solveCenters } from './centers'
import { fixEdgeParity, pairEdges, pairedOrParity } from './edges'
import { isReduced, to3x3 } from './project'

/**
 * 6x6 reduction methods, like the 5x5's (solver5/steps.ts): the centers,
 * the edges paired (the pairing chooses where each edge goes so the 3x3
 * step meets a real 3x3), the edge parity of either orbit of wings when a
 * pair comes out crossed, then the given 3x3 plan through the projection.
 */

const ALL_6 = allTurnsOf('6')

export function reduction6Plan(plan3x3: MethodPlan): MethodPlan {
  return [
    { key: 'stepCenters', goal: centersDone, moves: ALL_6, phases: [solveCenters] },
    { key: 'stepPairEdges', goal: pairedOrParity, moves: ALL_6, phases: [pairEdges] },
    {
      key: 'stepParity',
      goal: isReduced,
      moves: ALL_6,
      phases: [fixEdgeParity],
      optional: true,
    },
    ...projectOuterPlan(plan3x3, to3x3),
  ]
}
