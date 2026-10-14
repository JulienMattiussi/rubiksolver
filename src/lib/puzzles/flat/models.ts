import type { CubeShape } from '../../core/types'
import type { PuzzleModel } from '../model'
import { GHOST_TURNS, scrambleGhost, solvedGhost } from './ghost'

export const FLAT_MODELS = {
  // No grid; held one way only.
  ghost: {
    entry: { byPieces: true },
    solved: solvedGhost,
    symmetries: [],
    turns: () => GHOST_TURNS,
    scramble: (length, rng) => scrambleGhost(length, rng),
  },
} satisfies Partial<Record<CubeShape, PuzzleModel>>
