import { COPTER_TURNS, scrambleCopter, solvedCurvyCopter, solvedCurvyCopter3 } from './copter'
import type { CubeShape } from '../../core/types'
import { isSolved, solvedCube } from '../../core/cube'
import type { PuzzleModel } from '../model'
import {
  DINO_TURNS,
  REX_TURNS,
  scrambleDino,
  scrambleRex,
  solvedDino,
  solvedRex,
} from '../shared/dinoRex'
import {
  MASTER_TURNS,
  scrambleMasterSkewb,
  scrambleSkewbU,
  SKEWB_CUBE_SYMMETRIES,
  SKEWB_TURNS,
  solvedMasterSkewb,
  solvedSkewb,
} from '../shared/skewbs'
import { asSeenThin, withRealThinEdges } from '../shared/thinEdges'
import { fisherSolved, windmillSolved, withMarks } from './fisher'

export const DIAGONAL_MODELS = {
  dino: {
    solved: solvedDino,
    turns: () => DINO_TURNS,
    scramble: (length, rng) => scrambleDino(length, rng),
  },
  // A cube: its 24 holdings.
  skewb: {
    solved: solvedSkewb,
    symmetries: SKEWB_CUBE_SYMMETRIES,
    turns: () => SKEWB_TURNS,
    scramble: (length, rng) => scrambleSkewbU(length, rng),
  },
  // The Curvy Copters: a cube, as the Skewb, held 24 ways.
  copter: {
    solved: solvedCurvyCopter,
    symmetries: SKEWB_CUBE_SYMMETRIES,
    turns: () => COPTER_TURNS,
    scramble: (length, rng) => scrambleCopter(length, rng),
  },
  copter3: {
    solved: solvedCurvyCopter3,
    symmetries: SKEWB_CUBE_SYMMETRIES,
    turns: () => COPTER_TURNS,
    scramble: (length, rng) => scrambleCopter(length, rng),
  },
  // A cube, as the Skewb: its 24 holdings.
  masterSkewb: {
    solved: solvedMasterSkewb,
    symmetries: SKEWB_CUBE_SYMMETRIES,
    turns: () => MASTER_TURNS,
    scramble: (length, rng) => scrambleMasterSkewb(length, rng),
  },
  rex: {
    solved: solvedRex,
    turns: () => REX_TURNS,
    scramble: (length, rng) => scrambleRex(length, rng),
  },
  fisher: {
    solved: () => withMarks(solvedCube('3')),
    isSolved: fisherSolved,
    // Piece by piece, its middle edges the way round the editor offers.
    entry: {
      byPieces: true,
      seen: (cube, held) => asSeenThin(held(cube)),
      built: (cube) => withRealThinEdges(cube),
    },
  },
  windmill: {
    solved: () => withMarks(solvedCube('3'), true),
    isSolved: (cube) => windmillSolved(cube, isSolved),
    entry: { byPieces: true },
  },
} satisfies Partial<Record<CubeShape, PuzzleModel>>
