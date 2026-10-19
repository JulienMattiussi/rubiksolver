import { COPTER_TURNS, scrambleCopter, solvedCurvyCopter, solvedCurvyCopter3 } from './copter'
import type { CopterMove } from '../../core/types'
import type { CubeShape } from '../../core/shapes'
import { isSolved, solvedCube } from '../../core/cube'
import type { PuzzleModel } from '../model'
import { BY_PIECES } from '../../editor/entry'
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
import { copterGuide, dinoGuide, masterSkewbGuide } from '../guides'
import { fisherSolved, windmillSolved, withMarks } from './fisher'

export const DIAGONAL_MODELS = {
  dino: {
    solved: solvedDino,
    turns: () => DINO_TURNS,
    scramble: (length, rng) => scrambleDino(length, rng),
    guide: () => dinoGuide(),
  },
  // A cube: its 24 holdings.
  skewb: {
    solved: solvedSkewb,
    symmetries: SKEWB_CUBE_SYMMETRIES,
    turns: () => SKEWB_TURNS,
    scramble: (length, rng) => scrambleSkewbU(length, rng),
    guide: () => dinoGuide({ skewb: true }),
  },
  // The Curvy Copters: a cube, as the Skewb, held 24 ways.
  copter: {
    solved: solvedCurvyCopter,
    symmetries: SKEWB_CUBE_SYMMETRIES,
    turns: () => COPTER_TURNS,
    scramble: (length, rng) => scrambleCopter(length, rng),
    guide: copterGuide,
  },
  // Its edges turn its centers and petals too: said so.
  copter3: {
    solved: solvedCurvyCopter3,
    symmetries: SKEWB_CUBE_SYMMETRIES,
    turns: () => COPTER_TURNS,
    scramble: (length, rng) => scrambleCopter(length, rng),
    guide: copterGuide,
    describe: (turn) => ({ kind: 'copterEdge', edge: (turn as CopterMove).edge, iii: true }),
  },
  // A cube, as the Skewb: its 24 holdings.
  masterSkewb: {
    solved: solvedMasterSkewb,
    symmetries: SKEWB_CUBE_SYMMETRIES,
    turns: () => MASTER_TURNS,
    scramble: (length, rng) => scrambleMasterSkewb(length, rng),
    guide: masterSkewbGuide,
  },
  rex: {
    solved: solvedRex,
    turns: () => REX_TURNS,
    scramble: (length, rng) => scrambleRex(length, rng),
    guide: () => dinoGuide({ rex: true }),
  },
  fisher: {
    solved: () => withMarks(solvedCube('3')),
    isSolved: fisherSolved,
    // Piece by piece, its middle edges the way round the editor offers.
    entry: {
      paint: BY_PIECES,
      seen: (cube, held) => asSeenThin(held(cube)),
      built: (cube) => withRealThinEdges(cube),
    },
  },
  windmill: {
    solved: () => withMarks(solvedCube('3'), true),
    isSolved: (cube) => windmillSolved(cube, isSolved),
    entry: { paint: BY_PIECES },
  },
} satisfies Partial<Record<CubeShape, PuzzleModel>>
