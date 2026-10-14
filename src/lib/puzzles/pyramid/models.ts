import { cubeOrientations, solvedCube } from '../../core/cube'
import type { Cube, CubeShape } from '../../core/types'
import type { PuzzleModel } from '../model'
import { asSeenMorphinx, mmorphSolved, withCenterMarks, withRealCorners } from './mmorph'
import { solvedMorph } from './morph'
import { PYRA_SYMMETRIES, solvedPyra } from './pyraminx'

const pyra = (shape: 'pyra' | 'tetra' | 'pyra4' | 'pyra5' | 'jing'): PuzzleModel => ({
  solved: () => solvedPyra(shape),
  symmetries: PYRA_SYMMETRIES,
})

let MMORPH_HELD: Cube[] | undefined

export const PYRAMID_MODELS = {
  pyra: pyra('pyra'),
  tetra: pyra('tetra'),
  pyra4: pyra('pyra4'),
  pyra5: pyra('pyra5'),
  jing: pyra('jing'),
  morph: { solved: solvedMorph },
  // Its small corners' twist never shows; held any way.
  mmorph: {
    solved: () => withCenterMarks(solvedCube('3')),
    isSolved: (cube) =>
      mmorphSolved(cube, (MMORPH_HELD ??= cubeOrientations(solvedCube('mmorph')))),
    // Piece by piece, its small corners one way round, the one making it
    // reachable.
    entry: {
      byPieces: true,
      seen: (cube, held) => asSeenMorphinx(held(cube)),
      built: (cube) => withRealCorners(cube),
    },
  },
} satisfies Partial<Record<CubeShape, PuzzleModel>>
