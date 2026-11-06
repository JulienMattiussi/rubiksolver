import type { CubeShape } from '../../core/shapes'
import type { PuzzleModel } from '../model'
import { BY_PIECES } from '../../editor/entry'
import { GHOST_TURNS, scrambleGhost, solvedGhost } from './ghost'
import { ghostGuide } from '../guides'
import { ghostScan } from './ghostScan'
import { floppyAmounts, lyingFlat, unlockedAmounts } from './floppy'

export const FLAT_MODELS = {
  // A 3x3x3's middle layer: its quarter turns, once unlocked, stand a row up.
  '331': {
    mechanism: [3, 3, 3],
    amounts: floppyAmounts,
    unlocked: { amounts: unlockedAmounts, inShape: lyingFlat },
  },
  // No grid; held one way only.
  ghost: {
    entry: { paint: BY_PIECES },
    solved: solvedGhost,
    symmetries: [],
    turns: () => GHOST_TURNS,
    scramble: (length, rng) => scrambleGhost(length, rng),
    guide: ghostGuide,
    scan: ghostScan,
  },
} satisfies Partial<Record<CubeShape, PuzzleModel>>
