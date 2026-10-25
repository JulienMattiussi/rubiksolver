import { cubeOrientations, solvedCube } from '../../core/cube'
import type { Cube } from '../../core/types'
import type { CubeShape, PyraShape } from '../../core/shapes'
import type { PuzzleModel } from '../model'
import { pyraGuide } from '../guides'
import { BY_PIECES, PICK_FORM } from '../../editor/entry'
import { asSeenMorphinx, mmorphSolved, withCenterMarks, withRealCorners } from './mmorph'
import { solvedMorph } from './morph'
import { PYRA_SYMMETRIES, pyraTurnsOf, scramblePyraminx, solvedPyra } from './pyraminx'
import { PYRA_SCAN } from './pyraScan'

const pyra = (shape: PyraShape): PuzzleModel => ({
  solved: () => solvedPyra(shape),
  symmetries: PYRA_SYMMETRIES,
  turns: () => pyraTurnsOf(shape),
  scramble: (length, rng) => scramblePyraminx(shape, length, rng),
  guide: () => pyraGuide(shape),
  scan: PYRA_SCAN,
})

let MMORPH_HELD: Cube[] | undefined

export const PYRAMID_MODELS = {
  pyra: pyra('pyra'),
  tetra: pyra('tetra'),
  pyra4: pyra('pyra4'),
  pyra5: pyra('pyra5'),
  jing: pyra('jing'),
  // Entered in the form it stands in.
  morph: { solved: solvedMorph, entry: { steps: PICK_FORM } },
  // Its small corners' twist never shows; held any way.
  mmorph: {
    solved: () => withCenterMarks(solvedCube('3')),
    isSolved: (cube) =>
      mmorphSolved(cube, (MMORPH_HELD ??= cubeOrientations(solvedCube('mmorph')))),
    // Piece by piece, its small corners one way round, the one making it
    // reachable.
    entry: {
      paint: BY_PIECES,
      seen: (cube, held) => asSeenMorphinx(held(cube)),
      built: (cube) => withRealCorners(cube),
    },
  },
} satisfies Partial<Record<CubeShape, PuzzleModel>>
