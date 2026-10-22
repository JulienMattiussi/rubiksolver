import type { CubeShape } from '../../core/shapes'
import { solvedCube } from '../../core/cube'
import type { PuzzleModel } from '../model'
import { solvedMegaminx } from '../polyhedron/megaminx'
import { MEGAMINX } from '../polyhedron/models'
import { holeyScan } from './holeyScan'

export const HOLEY_MODELS = {
  // The Megaminx, holes where its centers are.
  holey: {
    ...MEGAMINX,
    solved: () => solvedMegaminx().filter((c) => c.stickers.length > 1),
    // Shown by gestures alone, no center telling its faces (holeyScan.ts).
    scan: holeyScan,
  },
  // A 3x3 without its centers, about its hidden core (which tells it from
  // the Dino Cylinder, as many pieces and stickers without it).
  void: { solved: () => solvedCube('3').filter((c) => c.stickers.length !== 1), scan: 'grid' },
  // A 3x3 without its corners.
  tori: { solved: () => solvedCube('3').filter((c) => c.stickers.length !== 3) },
  // Its edges alone, about its hidden core (which tells it from the Dino
  // Cube, twelve such edges too).
  edge: {
    solved: () => solvedCube('3').filter((c) => c.stickers.length !== 1 && c.stickers.length !== 3),
    scan: 'grid',
  },
} satisfies Partial<Record<CubeShape, PuzzleModel>>
