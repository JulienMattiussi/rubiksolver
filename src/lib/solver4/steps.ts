import { buildSteps, type SolveStep, type StepSpec } from '../solverKit'
import { solveCenters } from './centers'
import { pairEdges } from './edges'
import { fixParities } from './parity'
import { via3x3 } from './project'
import type { Cube } from '../types'

/**
 * 4x4 reduction methods: solve the centers, pair the edges, fix the parities,
 * then finish exactly like a 3x3 through the virtual projection. The 3x3 part
 * is injected as step specs (beginner or CFOP), so both reduction variants
 * share this prefix and none of the 3x3 machinery is duplicated. The parity
 * step is emitted only when a parity was actually corrected (buildSteps drops
 * empty steps).
 */

const REDUCTION_PREFIX: readonly StepSpec[] = [
  { key: 'stepCenters', phases: [solveCenters] },
  { key: 'stepPairEdges', phases: [pairEdges] },
  { key: 'stepParity', phases: [fixParities] },
]

/** A 4x4 solver: the reduction prefix, then the given 3x3 stages projected. */
export function reductionSteps(specs3x3: readonly StepSpec[]): (cube: Cube) => SolveStep[] {
  const specs = [
    ...REDUCTION_PREFIX,
    ...specs3x3.map((spec) => ({ key: spec.key, phases: spec.phases.map(via3x3) })),
  ]
  return (cube) => buildSteps(cube, specs)
}
