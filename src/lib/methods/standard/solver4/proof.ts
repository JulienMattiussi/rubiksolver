import { mapVec } from '../../../core/geometry'
import type { Cube } from '../../../core/types'
import { usesRealPieces } from '../../../editor/modes/colors'
import { solveOptimal2 } from '../cube2'

/** The eight corners of a 4x4, renormalized to a 2x2 cube (coords +-3 -> +-1). */
function cornersAsTwoByTwo(cube: Cube): Cube {
  return cube
    .filter((c) => c.stickers.length === 3)
    .map((c) => ({
      position: mapVec(c.position, Math.sign),
      stickers: c.stickers,
    }))
}

/**
 * A 4x4's solvability, proved without solving it (throws when impossible).
 * It has an exact piece-level characterization: its indistinguishable
 * centers absorb every permutation-parity constraint (which is also why
 * the OLL/PLL parities are legal states), so every slot must carry a real
 * physical piece with exact multiplicities (`usesRealPieces`), and the
 * corner twist must be sound, which the bounded optimal 2x2 solver checks
 * on the renormalized corners. Both stay fast, unlike a full reduction
 * solve on a bad cube.
 */
export function proveFourByFour(cube: Cube): void {
  if (!usesRealPieces(cube)) throw new Error('4x4: not real pieces')
  solveOptimal2(cornersAsTwoByTwo(cube))
}
