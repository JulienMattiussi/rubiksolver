import type { CubeShape } from '../../core/shapes'
import type { PuzzleModel } from '../model'
import { BY_PIECES } from '../../editor/entry'
import { GHOST_TURNS, scrambleGhost, solvedGhost } from './ghost'
import { ghostGuide } from '../guides'

export const FLAT_MODELS = {
  // No grid; held one way only.
  ghost: {
    entry: { paint: BY_PIECES },
    solved: solvedGhost,
    symmetries: [],
    turns: () => GHOST_TURNS,
    scramble: (length, rng) => scrambleGhost(length, rng),
    guide: ghostGuide,
  },
} satisfies Partial<Record<CubeShape, PuzzleModel>>
