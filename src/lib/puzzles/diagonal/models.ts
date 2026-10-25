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
  IVY_TURNS,
  scrambleIvy,
  SKEWB_SYMMETRIES,
  SKEWB_TURNS,
  solvedIvy,
  solvedMasterSkewb,
  solvedSkewb,
} from '../shared/skewbs'
import { asSeenThin, withRealThinEdges } from '../shared/thinEdges'
import { copterGuide, dinoGuide, ivyGuide, masterSkewbGuide } from '../guides'
import { fisherSolved, windmillSolved, withMarks } from './fisher'

// Cubes whose faces are no grid: scanned each sticker where its drawing
// shows it (`scan: 'square'`, lib/editor/scan/plan.ts).
export const DIAGONAL_MODELS = {
  dino: {
    solved: solvedDino,
    scan: 'square',
    turns: () => DINO_TURNS,
    scramble: (length, rng) => scrambleDino(length, rng),
    guide: () => dinoGuide(),
  },
  // A cube: its 24 holdings.
  skewb: {
    solved: solvedSkewb,
    scan: 'square',
    symmetries: SKEWB_CUBE_SYMMETRIES,
    turns: () => SKEWB_TURNS,
    scramble: (length, rng) => scrambleSkewbU(length, rng),
    guide: () => dinoGuide({ skewb: true }),
  },
  // A Skewb with one set of corners: held the 12 ways that keep them.
  ivy: {
    solved: solvedIvy,
    scan: 'square',
    symmetries: SKEWB_SYMMETRIES,
    turns: () => IVY_TURNS,
    scramble: (length, rng) => scrambleIvy(length, rng),
    guide: ivyGuide,
  },
  // The Curvy Copters: a cube, as the Skewb, held 24 ways.
  copter: {
    solved: solvedCurvyCopter,
    scan: 'square',
    symmetries: SKEWB_CUBE_SYMMETRIES,
    turns: () => COPTER_TURNS,
    scramble: (length, rng) => scrambleCopter(length, rng),
    guide: copterGuide,
  },
  // Its edges turn its centers and petals too: said so.
  copter3: {
    solved: solvedCurvyCopter3,
    scan: 'square',
    symmetries: SKEWB_CUBE_SYMMETRIES,
    turns: () => COPTER_TURNS,
    scramble: (length, rng) => scrambleCopter(length, rng),
    guide: copterGuide,
    describe: (turn) => ({ kind: 'copterEdge', edge: (turn as CopterMove).edge, iii: true }),
  },
  // A cube, as the Skewb: its 24 holdings.
  masterSkewb: {
    solved: solvedMasterSkewb,
    scan: 'square',
    symmetries: SKEWB_CUBE_SYMMETRIES,
    turns: () => MASTER_TURNS,
    scramble: (length, rng) => scrambleMasterSkewb(length, rng),
    guide: masterSkewbGuide,
  },
  rex: {
    solved: solvedRex,
    scan: 'square',
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
    // A 3x3's grid, framed round its center (which need not sit in the
    // middle of its solid); its side centers' way round, unseen, checked
    // after.
    scan: 'centered',
    isSolved: (cube) => windmillSolved(cube, isSolved),
    entry: { paint: BY_PIECES },
  },
} satisfies Partial<Record<CubeShape, PuzzleModel>>
