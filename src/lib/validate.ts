import type { Color, Cube } from './types'
import { cubeSize } from './cube'
import { solve } from './solver'

export type ValidationError = 'counts' | 'impossible'
export type ValidationResult = { ok: true } | { ok: false; error: ValidationError }

/**
 * Check that a cube is a legal, solvable configuration.
 *
 * 1. `counts`: each of the six colors must appear exactly stickers/6 times
 *    (nine on a 3x3, four on a 2x2).
 * 2. `impossible`: the arrangement must be reachable by real turns. We test
 *    this by asking the solver for a solution; on an unsolvable cube (bad
 *    permutation or orientation parity, or a duplicated/missing piece) the
 *    solver exhausts its bounded search and throws, which we catch.
 */
export function validateCube(cube: Cube): ValidationResult {
  const perColor = cubeSize(cube) === 2 ? 4 : 9
  const counts: Record<Color, number> = { W: 0, Y: 0, G: 0, B: 0, O: 0, R: 0 }
  for (const cubie of cube) for (const s of cubie.stickers) counts[s.color]++
  if (Object.values(counts).some((n) => n !== perColor)) return { ok: false, error: 'counts' }

  try {
    solve(cube)
  } catch {
    return { ok: false, error: 'impossible' }
  }
  return { ok: true }
}
