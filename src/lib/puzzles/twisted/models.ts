import { latchTurns, scrambleLatch, withLatchMark, withoutLatchMark } from './latch'
import type { CubeShape } from '../../core/types'
import { colorsSolved, solvedCube } from '../../core/cube'
import type { PuzzleModel } from '../model'
import { quarterTurns, scrambleQuarter, withFaceMarks, withTurnedFaces } from './quarter'
import { asSeenThin, thinEdgesSolved } from '../shared/thinEdges'
import { withCenterSpins, withTurnedCenters } from './twist'
import { purpleBoxed, purpleSolved, purpleTurns, solvedPurple, turnAboutA } from './purple'
import { scramblePurple } from './purpleStates'

export const TWISTED_MODELS = {
  // Its box is off its core, which its coordinates are about; held only
  // about its diagonal through A.
  purple: {
    solved: solvedPurple,
    turnAllowed: (cube, move) => purpleTurns(cube, move.face),
    boxed: purpleBoxed,
    isSolved: purpleSolved,
    symmetries: [turnAboutA],
    scramble: scramblePurple,
  },
  // Its thin edges show one color: their way round does not count.
  twist: {
    solved: () => withCenterSpins(solvedCube('3')),
    isSolved: thinEdgesSolved,
    // Piece by piece, its thin edges the way round the editor offers.
    entry: {
      byPieces: true,
      seen: (cube, held) => asSeenThin(held(cube)),
      built: (cube, turned) => withTurnedCenters(cube, turned),
    },
  },
  // Its faces turn by turns; they may stand either way: its colors are
  // all.
  quarter: {
    solved: () => withFaceMarks(solvedCube('3')),
    turnAllowed: quarterTurns,
    scramble: scrambleQuarter,
    // Read when called: cube.ts, which defines it, loads after this file.
    isSolved: (cube) => colorsSolved(cube),
    // Its faces stand where their marks say.
    entry: { built: (cube, turned) => withTurnedFaces(cube, turned) },
  },
  // A 3x3, its faces turning the way their arrows say; its hidden core
  // marked (which tells it from the 3x3), never drawn nor entered.
  latch: {
    solved: () => withLatchMark(solvedCube('3')),
    turnAllowed: latchTurns,
    scramble: (length, rng, start) => scrambleLatch(length, rng, start),
    entry: {
      seen: (cube, held) => withoutLatchMark(held(cube)),
      built: (cube) => withLatchMark(cube),
    },
  },
} satisfies Partial<Record<CubeShape, PuzzleModel>>
