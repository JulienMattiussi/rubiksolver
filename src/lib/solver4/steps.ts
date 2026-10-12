import { allTurnsOf } from '../moveSet'
import type { MethodPlan } from '../solverKit'
import type { Cube } from '../types'
import { centersDone, solveCenters } from './centers'
import { pairEdges } from './edges'
import { edgeFlipParity, fixParities, permSignsMatch } from './parity'
import { isReduced, to3x3, via3x3 } from './project'

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
 * A 4x4 plan: the reduction prefix, then the given 3x3 plan projected. Only
 * outer turns replay identically on the reduced 4x4 (a 3x3 slice M is two
 * slices there), so a 3x3 plan using anything else is refused.
 */
export function reductionPlan(plan3x3: MethodPlan): MethodPlan {
  for (const spec of plan3x3) {
    if (spec.moves.turns.some((t) => 'depth' in t && t.depth)) {
      throw new Error(`reductionPlan: ${spec.key} turns inner layers`)
    }
  }
  return [
    ...REDUCTION_PREFIX,
    ...plan3x3.map((spec) => ({
      ...spec,
      goal: (cube: Cube) => spec.goal(to3x3(cube)),
      phases: spec.phases.map(via3x3),
    })),
  ]
}
