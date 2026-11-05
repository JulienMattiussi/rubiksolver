import { describeFashionMove, fashionTurns, formatFashionMove, scrambleFashion } from './fashion'
import { latchTurns, scrambleLatch, withLatchMark, withoutLatchMark } from './latch'
import type { Move } from '../../core/types'
import type { CubeShape } from '../../core/shapes'
import { colorsSolved, solvedCube } from '../../core/cube'
import type { PuzzleModel } from '../model'
import { quarterTurns, scrambleQuarter, withFaceMarks, withTurnedFaces } from './quarter'
import { asSeenThin, thinEdgesSolved } from '../shared/thinEdges'
import { centerToggles, withCenterSpins, withTurnedCenters } from './twist'
import { FASHION_CUTS } from './fashionEntry'
import { turnedKeys } from '../../editor/modes/toggles'
import {
  describeMeffertsPocketMove,
  formatMeffertsPocketMove,
  meffertsPocketBoxed,
  meffertsPocketLayers,
  meffertsPocketSolved,
  meffertsPocketTurns,
  solvedMeffertsPocket,
  turnAboutA,
} from './meffertsPocket'
import { scrambleMeffertsPocket } from './meffertsPocketStates'
import { MEFFERTS_POCKET_FACE_ENTRY } from './meffertsPocketViews'
import { SECTOR_TURNS } from '../shared/sectors'
import { sectorGuide } from '../guides'
import { SQUARE1_FORM_STAGES } from './square1Entry'
import { BY_PIECES } from '../../editor/entry'
import {
  scrambleSquare1,
  solvedSquare1,
  square1Solved,
  square1Turns,
  SQUARE1_SYMMETRIES,
} from './square1'

export const TWISTED_MODELS = {
  // Its box is off its core, which its coordinates are about; held only
  // about its diagonal through A. Each axis its two halves and its thin
  // layer by A (meffertsPocket.ts).
  meffertsPocket: {
    solved: solvedMeffertsPocket,
    turnAllowed: meffertsPocketTurns,
    // Its faces read as its canvases, as a grid (canvasRead.ts).
    scan: 'canvas',
    layers: meffertsPocketLayers,
    format: (move, labels) => formatMeffertsPocketMove(move, labels),
    describe: (turn) => describeMeffertsPocketMove(turn as Move),
    boxed: meffertsPocketBoxed,
    isSolved: meffertsPocketSolved,
    symmetries: [turnAboutA],
    scramble: scrambleMeffertsPocket,
    // Its shape told on canvases first, too many forms for thumbnails.
    entry: { steps: () => [{ kind: 'canvas', faces: MEFFERTS_POCKET_FACE_ENTRY }] },
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
    // Scanned as a 3x3, its centers' marks set by hand after (its card's
    // `scanUnseen`).
    scan: 'grid',
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
    // Scanned as a 3x3: its arrows go with its colors.
    scan: 'grid',
    entry: {
      seen: (cube, held) => withoutLatchMark(held(cube)),
      built: (cube) => withLatchMark(cube),
    },
  },
  // A thin layer alone only when its half is laid (fashion.ts).
  fashion: {
    turnAllowed: fashionTurns,
    // Its faces in 6 x 6, its halves found from their colors (halves.ts).
    scan: 'halves',
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
  // Turns as the Hockey Puck, its slash blocked while a corner lies across
  // its cut; held with its cut where the slash turns.
  square1: {
    solved: solvedSquare1,
    isSolved: square1Solved,
    symmetries: SQUARE1_SYMMETRIES,
    turns: () => SECTOR_TURNS,
    ownTurnAllowed: square1Turns,
    scramble: scrambleSquare1,
    guide: sectorGuide,
    // Its shape in three stages (its top, its bottom, its middle), then its
    // pieces one by one.
    entry: { steps: () => [{ kind: 'form', stages: SQUARE1_FORM_STAGES }], paint: BY_PIECES },
  },
} satisfies Partial<Record<CubeShape, PuzzleModel>>
