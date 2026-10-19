import type { CubeShape } from '../../core/shapes'
import { solvedCube } from '../../core/cube'
import type { PuzzleModel } from '../model'
import { withBorders } from './superCube'
import { formatRevengeMove } from './revenge'

export const STANDARD_MODELS = {
  // Written as Rubik's guide writes it: r for the inner slice, Rr for both.
  '4': { format: (move, labels) => formatRevengeMove(move, labels) },
  super4: {
    solved: () => withBorders(solvedCube('4')),
    format: (move, labels) => formatRevengeMove(move, labels),
  },
  super5: { solved: () => withBorders(solvedCube('5')) },
} satisfies Partial<Record<CubeShape, PuzzleModel>>
