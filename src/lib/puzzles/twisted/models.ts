import type { CubeShape } from '../../core/types'
import { colorsSolved, isSolved, solvedCube } from '../../core/cube'
import type { PuzzleModel } from '../model'
import { aiTurns, scrambleAi, solvedAi } from './ai'
import { quarterTurns, scrambleQuarter, withFaceMarks, withTurnedFaces } from './quarter'
import { roadblockTurns, scrambleRoadblock, withBars, withoutBars } from './roadblock'
import { asSeenThin, thinEdgesSolved } from '../shared/thinEdges'
import { withCenterSpins, withTurnedCenters } from './twist'
import { solvedViolet, turnAboutA, violetBoxed, violetSolved, violetTurns } from './violet'
import { scrambleViolet } from './violetStates'

export const TWISTED_MODELS = {
  // Its box is off its core, which its coordinates are about; held only
  // about its diagonal through A.
  violet: {
    solved: solvedViolet,
    turnAllowed: (cube, move) => violetTurns(cube, move.face),
    boxed: violetBoxed,
    isSolved: violetSolved,
    symmetries: [turnAboutA],
    scramble: scrambleViolet,
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
  // Its big blocks jam what would cut them.
  ai: { solved: () => solvedAi(solvedCube('4')), turnAllowed: aiTurns, scramble: scrambleAi },
  // Its bars jam a slice along them; its colors only count, its bars may
  // lie either way.
  roadblock: {
    solved: () => withBars(solvedCube('5')),
    turnAllowed: roadblockTurns,
    scramble: scrambleRoadblock,
    isSolved: (cube) => isSolved(withoutBars(cube)),
    // Its bars' marks are not entered (it is, at START), and no center of
    // it is fixed: it is not held otherwise. Its bars lie as solved but on
    // the faces turned.
    entry: {
      seen: (cube) => withoutBars(cube),
      built: (cube, turned) => withBars(cube, turned),
    },
  },
} satisfies Partial<Record<CubeShape, PuzzleModel>>
