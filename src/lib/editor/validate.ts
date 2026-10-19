import type { Color, Cube } from '../core/types'
import { countColors, cubeShape, stickersOfColor } from '../core/cube'
import { proveSolvable } from '../solve/solver'
import { StepFailure } from '../solve/solverKit'

export type ValidationError = 'counts' | 'impossible'
export type ValidationResult =
  | { ok: true }
  /** `step`: the solving step that found it impossible, when one did. */
  | { ok: false; error: ValidationError; step?: string }

/**
 * Check that a cube is a legal, solvable configuration.
 *
 * 1. `counts`: each color must appear exactly once per facelet of its own face
 *    (nine on a 3x3, four on a 2x2, sixteen on a 4x4; a cuboid's faces differ,
 *    so its six counts do too).
 * 2. `impossible`: the arrangement must be reachable by real turns. We
 *    ask for a proof (`proveSolvable`): the solver's solution, which on
 *    an unsolvable cube (bad permutation or orientation parity,
 *    duplicated/missing piece) exhausts its bounded search and throws,
 *    which we catch; or a shape's own quicker proof (the 4x4's).
 */
export function validateCube(cube: Cube): ValidationResult {
  const shape = cubeShape(cube)
  const counts = countColors(cube.flatMap((c) => c.stickers.map((s) => s.color)))
  const wrongCount = (Object.keys(counts) as Color[]).some(
    (color) => counts[color] !== stickersOfColor(shape, color),
  )
  if (wrongCount) return { ok: false, error: 'counts' }

  try {
    proveSolvable(cube)
  } catch (error) {
    return error instanceof StepFailure
      ? { ok: false, error: 'impossible', step: error.step }
      : { ok: false, error: 'impossible' }
  }
  return { ok: true }
}
