import type { Color, Cube } from './types'
import { solve } from './solver'

export type ValidationError = 'counts' | 'impossible'
export type ValidationResult = { ok: true } | { ok: false; error: ValidationError }

/**
 * Check that a cube is a legal, solvable configuration.
 *
 * 1. `counts`: each of the six colors must appear exactly nine times.
 * 2. `impossible`: the arrangement must be reachable by real turns. We test
 *    this by asking the solver for a solution; on an unsolvable cube (bad
 *    permutation or orientation parity, or a duplicated/missing piece) the
 *    layer-by-layer phases run out of options and throw, which we catch.
 */
export function validateCube(cube: Cube): ValidationResult {
  const counts: Record<Color, number> = { W: 0, Y: 0, G: 0, B: 0, O: 0, R: 0 }
  for (const cubie of cube) for (const s of cubie.stickers) counts[s.color]++
  if (Object.values(counts).some((n) => n !== 9)) return { ok: false, error: 'counts' }

  try {
    solve(cube)
  } catch {
    return { ok: false, error: 'impossible' }
  }
  return { ok: true }
}
