import type { Color, Cube, Vec3 } from './types'
import { cubeSize, stickersPerColor } from './cube'
import { usesRealPieces } from './editor'
import { solve, solveOptimal2 } from './solver'

export type ValidationError = 'counts' | 'impossible'
export type ValidationResult = { ok: true } | { ok: false; error: ValidationError }

/** The eight corners of a 4x4, renormalized to a 2x2 cube (coords +-3 -> +-1). */
function cornersAsTwoByTwo(cube: Cube): Cube {
  return cube
    .filter((c) => c.stickers.length === 3)
    .map((c) => ({
      position: c.position.map(Math.sign) as unknown as Vec3,
      stickers: c.stickers,
    }))
}

/**
 * Check that a cube is a legal, solvable configuration.
 *
 * 1. `counts`: each of the six colors must appear exactly stickers/6 times
 *    (nine on a 3x3, four on a 2x2, sixteen on a 4x4).
 * 2. `impossible`: the arrangement must be reachable by real turns.
 *    - 2x2/3x3: we ask the solver for a solution; on an unsolvable cube (bad
 *      permutation or orientation parity, duplicated/missing piece) it
 *      exhausts its bounded search and throws, which we catch.
 *    - 4x4: solvability has an exact piece-level characterization (its
 *      indistinguishable centers absorb every permutation-parity constraint,
 *      which is also why the OLL/PLL parities are legal states): every slot
 *      must carry a real physical piece with exact multiplicities
 *      (`usesRealPieces`), and the corner twist must be sound, which the
 *      bounded optimal 2x2 solver checks on the renormalized corners. Both
 *      checks stay fast, unlike a full reduction solve on a bad cube.
 */
export function validateCube(cube: Cube): ValidationResult {
  const size = cubeSize(cube)
  const perColor = stickersPerColor(size)
  const counts: Record<Color, number> = { W: 0, Y: 0, G: 0, B: 0, O: 0, R: 0 }
  for (const cubie of cube) for (const s of cubie.stickers) counts[s.color]++
  if (Object.values(counts).some((n) => n !== perColor)) return { ok: false, error: 'counts' }

  try {
    if (size === 4) {
      if (!usesRealPieces(cube)) return { ok: false, error: 'impossible' }
      solveOptimal2(cornersAsTwoByTwo(cube))
    } else {
      solve(cube)
    }
  } catch {
    return { ok: false, error: 'impossible' }
  }
  return { ok: true }
}
