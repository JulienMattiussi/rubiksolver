import { describeFashionMove, fashionTurns, formatFashionMove, scrambleFashion } from './fashion'
import { latchTurns, scrambleLatch, withLatchMark, withoutLatchMark } from './latch'
import type { CubeShape, Move } from '../../core/types'
import { colorsSolved, solvedCube } from '../../core/cube'
import type { PuzzleModel } from '../model'
import { quarterTurns, scrambleQuarter, withFaceMarks, withTurnedFaces } from './quarter'
import { asSeenThin, thinEdgesSolved } from '../shared/thinEdges'
import { centerToggles, withCenterSpins, withTurnedCenters } from './twist'
import { FASHION_CUTS } from './fashionEntry'
import { turnedKeys } from '../../editor/modes/toggles'
import { purpleBoxed, purpleSolved, purpleTurns, solvedPurple, turnAboutA } from './purple'
import { scramblePurple } from './purpleStates'
import { PURPLE_FACE_ENTRY } from './purpleViews'

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
    // Its shape told on canvases first, too many forms for thumbnails.
    entry: { steps: () => [{ kind: 'canvas', faces: PURPLE_FACE_ENTRY }] },
  },
  // Its thin edges show one color: their way round does not count.
  twist: {
    solved: () => withCenterSpins(solvedCube('3')),
    isSolved: thinEdgesSolved,
    // Piece by piece, its thin edges the way round the editor offers; its
    // side centers turned a quarter by a click.
    entry: {
      paint: { by: 'pieces', toggles: centerToggles((p) => p[1] === 0) },
      seen: (cube, held) => asSeenThin(held(cube)),
      built: (cube, { toggles }) => withTurnedCenters(cube, turnedKeys(toggles)),
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
    // Its faces stand where their marks say, a click turning a center.
    entry: {
      paint: { by: 'colors', toggles: centerToggles(() => true) },
      built: (cube, { toggles }) => withTurnedFaces(cube, turnedKeys(toggles)),
    },
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
  // A thin layer alone only when its half is laid (fashion.ts).
  fashion: {
    turnAllowed: fashionTurns,
    scramble: (length, rng, start) => scrambleFashion(length, rng, start),
    format: (move, labels) => formatFashionMove(move, labels),
    describe: (turn) => describeFashionMove(turn as Move),
    // Its top and bottom: the thin layer, the one under it, the half; its
    // sides: the block.
    layers: (face) =>
      face === 'U' || face === 'D'
        ? [{}, { depth: 2 }, { depth: 2, wide: true }]
        : [{ depth: 2, wide: true }],
    // Its halves laid first, cell by cell (fashionEntry.ts): too many forms
    // for thumbnails.
    entry: { steps: () => [{ kind: 'cuts', cuts: FASHION_CUTS }] },
  },
} satisfies Partial<Record<CubeShape, PuzzleModel>>
