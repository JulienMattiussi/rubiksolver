import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { TOWER443_PLAN, TOWER445_PLAN } from '@/lib/methods/tower/tower44'
import { TOWER554_PLAN } from '@/lib/methods/tower/tower554'
import { parseMoves } from '@/lib/core/moves'
import { buildSteps, type MethodPlan } from '@/lib/solve/solverKit'
import { applyMoves } from '@/lib/core/turn'
import type { CubeShape } from '@/lib/core/types'

/** The big towers' parities: an inner layer's half turn, alone or after a
 *  face's, leaves them where reducing cannot reach without one. */
describe.each([
  ['443', TOWER443_PLAN],
  ['445', TOWER445_PLAN],
  ['554', TOWER554_PLAN],
] as [CubeShape, MethodPlan][])('%s', (shape, plan) => {
  it.each(['2R2', 'U 2R2', '2F2 R2'])('solves %s, its parity first', (moves) => {
    const cube = applyMoves(solvedCube(shape), parseMoves(moves))
    const steps = buildSteps(cube, plan)
    expect(steps[0]!.key).toBe('stepParity')
    expect(
      isSolved(
        applyMoves(
          cube,
          steps.flatMap((s) => s.moves),
        ),
      ),
    ).toBe(true)
  })
})
