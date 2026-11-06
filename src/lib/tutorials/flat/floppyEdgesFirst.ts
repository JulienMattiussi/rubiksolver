import { FACE_COLOR } from '../../core/cube'
import { CUBE_HOLDS, holdFrontRight, type Hold } from '../../core/hold'
import { allTurnsOf } from '../../core/moveSet'
import { applyMoves } from '../../core/turn'
import type { Cube, Move, Vec3 } from '../../core/types'
import { CORNER_FORMULAS } from '../../methods/flat/floppy'
import { searchFormulas } from '../../solve/formulaSearch'
import { tutorialOf, type Target } from '../../teach/kit'
import type { PieceStage } from '../../teach/stages'
import {
  FLAT_CORNER,
  FLAT_EDGE,
  flatOutside,
  flatPieceKind,
  frameColor,
  frameTarget,
  HALF_TURN,
} from './flatKit'
import { FLOPPY_EDGES, FLOPPY_FRAME } from './floppyKit'

/**
 * The Floppy's tutorial, edges then corners, as its manual (QiYi) teaches
 * it (its method, methods/flat/floppy.ts), held flat, white up:
 *   1. the cross: each edge upside down flipped by a half turn of its own
 *      side (they never leave their place);
 *   2. the corners, by a four half turn formula that cycles three of them
 *      and leaves the edges: held with the corner's place on the front
 *      right, the first one comes from wherever it is (three formulas);
 *      the puzzle turned to the next side round, the second one too, the
 *      first kept on the front left (two more). Then the last two are
 *      home: the edges right, the corners only stand an even permutation
 *      away from solved.
 */

const TURNS = (allTurnsOf('331').turns as Move[]).map((t) => [t])

const CROSS_STAGE: PieceStage = {
  kind: 'pieces',
  key: 'stepTutorialFloppyCross',
  stage: 1,
  targets: FLOPPY_EDGES.map((slot) => frameTarget(FLOPPY_FRAME, slot)),
  // Its edges flipped where they stand, the arrow on their bottom color.
  inPlace: true,
  marker: FACE_COLOR.D,
  words: true,
  hold: () => 'F',
  formula: (cube, pick, kept) =>
    searchFormulas(
      cube,
      TURNS,
      (c) => kept.targetsKept(c) && frameTarget(FLOPPY_FRAME, pick.slot).placed(c),
      { depth: 1 },
    ),
}

/** The corners in the order the manual places them: each on the front
 *  right of the hold after the one before (the puzzle turned a side round). */
const CORNERS: readonly Vec3[] = [
  [1, 0, 1],
  [1, 0, -1],
  [-1, 0, -1],
  [-1, 0, 1],
]
const CORNER_TARGETS = CORNERS.map((slot) => frameTarget(FLOPPY_FRAME, slot))

/** The corners from the one placed (by chance) if any: the next one then
 *  goes on the front right with it on the front left, as the manual's
 *  second corner, which two formulas both ways round always place. */
const cornersFrom = (begun: Cube): readonly Target[] => {
  const at = Math.max(
    0,
    CORNER_TARGETS.findIndex((t) => t.placed(begun)),
  )
  return [...CORNER_TARGETS.slice(at), ...CORNER_TARGETS.slice(0, at)]
}

/** How a formula brings `piece` to `slot` keeping what `keeps` says: held
 *  with that place on the front right if one does there (the manual's
 *  way), else from another side; its turns as the puzzle makes them. */
function cornerWay(
  cube: Cube,
  piece: number,
  slot: Vec3,
  keeps: (cube: Cube) => boolean,
): { hold: Hold; moves: Move[] } | null {
  const first = holdFrontRight(CUBE_HOLDS, slot)
  const holds = [first, ...CUBE_HOLDS.holds.filter((h) => h !== first)]
  for (const hold of holds) {
    for (const formula of CORNER_FORMULAS) {
      const moves = formula.map((m) => CUBE_HOLDS.played(hold, m) as Move)
      const after = applyMoves(cube, moves)
      if (keeps(after) && after[piece]!.position.join() === slot.join()) return { hold, moves }
    }
  }
  return null
}

/** Whether a state keeps the corners placed in `begun`. */
const keepsCornersOf = (begun: Cube) => {
  const placed = CORNER_TARGETS.filter((t) => t.placed(begun))
  return (cube: Cube) => placed.every((t) => t.placed(cube))
}

const CORNER_STAGE: PieceStage = {
  kind: 'pieces',
  key: 'stepTutorialFloppyCycle',
  stage: 2,
  targets: cornersFrom,
  algorithms: CORNER_FORMULAS.map((formula) => [formula]),
  hold: (begun, pick, next: Target) => {
    const piece = pick?.piece ?? next.piece(begun)
    const slot = pick?.slot ?? next.slot
    return cornerWay(begun, piece, slot, keepsCornersOf(begun))?.hold ?? 'F'
  },
  formula: (cube, pick, kept) =>
    cornerWay(cube, pick.piece, pick.slot, kept.targetsKept)?.moves ?? null,
  // A recipe: the edges it keeps checked as well.
  checked: true,
}

export const FLOPPY_EDGES_FIRST_TUTORIAL = tutorialOf({
  glossary: [FLAT_CORNER, FLAT_EDGE, HALF_TURN],
  faceColor: frameColor(FLOPPY_FRAME),
  pieceKind: flatPieceKind,
  outside: flatOutside,
  stages: [CROSS_STAGE, CORNER_STAGE],
})
