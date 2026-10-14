import { allTurnsOf } from '../../../core/moveSet'
import type { MethodPlan } from '../../../solve/solverKit'
import type { Cube } from '../../../core/types'
import { centersDone, solveCenters } from './centers'
import { pairEdges } from './edges'
import { edgeFlipParity, fixParities, permSignsMatch } from './parity'
import { isReduced, to3x3 } from './project'

/**
 * 4x4 reduction methods: solve the centers, pair the edges, fix the parities,
 * then finish exactly like a 3x3 through the virtual projection. The 3x3 part
 * is injected as a 3x3 plan (beginner or CFOP), so both reduction variants
 * share this prefix and none of the 3x3 machinery is duplicated. The parity
 * step is emitted only when a parity was actually corrected (buildSteps drops
 * empty steps).
 */

const ALL_4 = allTurnsOf('4')

/** Reduced, and its projection is a legal 3x3 (no OLL nor PLL parity left). */
function parityFree(cube: Cube): boolean {
  if (!isReduced(cube)) return false
  const cube3 = to3x3(cube)
  return edgeFlipParity(cube3) === 0 && permSignsMatch(cube3)
}

const REDUCTION_PREFIX: MethodPlan = [
  { key: 'stepCenters', goal: centersDone, moves: ALL_4, phases: [solveCenters] },
  { key: 'stepPairEdges', goal: isReduced, moves: ALL_4, phases: [pairEdges] },
  {
    key: 'stepParity',
    goal: parityFree,
    moves: ALL_4,
    phases: [fixParities],
    optional: true,
  },
]

/**
 * A 3x3 plan played on a reduced big cube through its projection onto a
 * virtual 3x3 (`project`): each goal read on the projection, each phase run
 * on it, its moves replayed as they are. Only outer turns replay
 * identically on a reduced cube (a 3x3 slice M is two slices on a 4x4), so
 * a 3x3 plan using anything else is refused. Shared by the 4x4 and the 5x5.
 */
export function projectPlan(plan3x3: MethodPlan, project: (cube: Cube) => Cube): MethodPlan {
  for (const spec of plan3x3) {
    if (spec.moves.turns.some((t) => 'depth' in t && t.depth)) {
      throw new Error(`reductionPlan: ${spec.key} turns inner layers`)
    }
  }
  return plan3x3.map((spec) => ({
    ...spec,
    goal: (cube: Cube) => spec.goal(project(cube)),
    phases: spec.phases.map((phase) => (cube: Cube) => phase(project(cube))),
  }))
}

/** A 4x4 plan: the reduction prefix, then the given 3x3 plan projected. */
export function reductionPlan(plan3x3: MethodPlan): MethodPlan {
  return [...REDUCTION_PREFIX, ...projectPlan(plan3x3, to3x3)]
}
