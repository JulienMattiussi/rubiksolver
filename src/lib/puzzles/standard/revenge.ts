import { AMOUNT_SUFFIX, type FaceLabels } from '../../core/moves'
import type { Move } from '../../core/types'

/**
 * A 4x4's turns as Rubik's own guide writes them: the inner slice alone in
 * lowercase (`r`, FR `d`), the face and its slice together as both letters
 * (`Rr`, FR `Dd`). Read when called: moves.ts, which defines the suffixes,
 * loads after the models.
 */
export function formatRevengeMove(move: Move, labels: FaceLabels): string {
  const letter = labels[move.face]
  const name = move.wide
    ? letter + letter.toLowerCase()
    : move.depth
      ? letter.toLowerCase()
      : letter
  return name + AMOUNT_SUFFIX[move.amount]
}
