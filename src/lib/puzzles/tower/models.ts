import type { CubeShape } from '../../core/types'
import { turnDims } from '../../core/cube'
import { FACE_SPEC, faceAxis } from '../../core/geometry'
import { moveSlab } from '../../core/turn'
import type { PuzzleModel } from '../model'
import { camoBoxed, camoTurns } from './camo'
import { TOWER234_MECHANISM, tower234Boxed, tower234Turns } from './tower234'
import { CAMO_FACE_ENTRY } from './camoViews'

export const TOWER_MODELS = {
  // The 2x3x4: its side columns lie down, cut either way (tower234.ts).
  // Its layers turn by halves, with their slice and their half; its side
  // columns by quarters; its front and back halves by halves.
  '234': {
    mechanism: TOWER234_MECHANISM,
    turnAllowed: tower234Turns,
    boxed: tower234Boxed,
    amounts: (face) => (faceAxis(face) === 'x' ? [1, 2, 3] : [2]),
    layers: (face) =>
      faceAxis(face) === 'x'
        ? [{}]
        : faceAxis(face) === 'y'
          ? [{}, { depth: 2 }, { depth: 2, wide: true }]
          : [{ depth: 2, wide: true }],
  },
  // A double Domino: no slice between its sides.
  '334': {
    layers: (face) =>
      faceAxis(face) === 'y' ? [{}, { depth: 2 }, { depth: 2, wide: true }] : [{}],
  },
  // The Camouflage: its pieces can stand in their cells, turned out of shape.
  camo: {
    turnAllowed: (cube, move) =>
      camoTurns(cube, FACE_SPEC[move.face].coordIndex, moveSlab(move, turnDims('camo'))),
    boxed: camoBoxed,
    entry: { faces: CAMO_FACE_ENTRY },
  },
} satisfies Partial<Record<CubeShape, PuzzleModel>>
