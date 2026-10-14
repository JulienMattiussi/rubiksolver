import type { CubeShape } from '../../core/types'
import { solvedCube } from '../../core/cube'
import type { PuzzleModel } from '../model'
import { withBorders } from './superCube'

export const STANDARD_MODELS = {
  super4: { solved: () => withBorders(solvedCube('4')) },
  super5: { solved: () => withBorders(solvedCube('5')) },
} satisfies Partial<Record<CubeShape, PuzzleModel>>
