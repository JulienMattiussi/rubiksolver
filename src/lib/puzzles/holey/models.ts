import type { CubeShape } from '../../core/types'
import { solvedCube } from '../../core/cube'
import type { PuzzleModel } from '../model'
import { solvedMegaminx } from '../polyhedron/megaminx'
import { MEGAMINX } from '../polyhedron/models'

export const HOLEY_MODELS = {
  // The Megaminx, holes where its centers are.
  holey: { ...MEGAMINX, solved: () => solvedMegaminx().filter((c) => c.stickers.length > 1) },
  // A 3x3 without its corners.
  tori: { solved: () => solvedCube('3').filter((c) => c.stickers.length !== 3) },
  // Its edges alone, about its hidden core (which tells it from the Dino
  // Cube, twelve such edges too).
  edge: {
    solved: () => solvedCube('3').filter((c) => c.stickers.length !== 1 && c.stickers.length !== 3),
  },
} satisfies Partial<Record<CubeShape, PuzzleModel>>
