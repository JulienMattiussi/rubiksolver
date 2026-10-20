import { isSolved } from '../../core/cube'
import { normalIndex } from '../../core/geometry'
import { parseMoves } from '../../core/notation'
import { cubieAt, sameAt } from '../../core/pieces'
import type { Cube, Vec3 } from '../../core/types'
import { tutorialOf, type FigureStage } from '../../teach/kit'
import {
  cornerStage,
  FLAT_CORNER,
  FLAT_EDGE,
  flatOutside,
  flatPieceKind,
  frameColor,
  frameOf,
  HALF_TURN,
  showsFrame,
} from './flatKit'

/**
 * The 1x2x3's tutorial, corners then edges, seen from its big face: its
 * two middle pieces (its edges, on the top and bottom borders) never leave
 * their row, a half turn of the top or bottom only flipping one round, so
 * the top one says how the puzzle stands (white up, its front color in
 * front):
 *   1. the corners, one at a time, the shortest way in half turns keeping
 *      the top edge as it is and the corners placed (five moves at most,
 *      the last corner then in place by itself);
 *   2. the bottom edge flipped if it shows the back's color in front:
 *      `U2 L2 U2 R2 D2 R2`, which flips it alone (half the time).
 */

/** Flips the bottom edge, nothing else (asserted in tests). */
export const FLIP_MIDDLE = parseMoves('U2 L2 U2 R2 D2 R2')

const TOP: Vec3 = [0, 1, 0]
const BOTTOM: Vec3 = [0, -1, 0]

/** The top edge, as it shows: what tells how the puzzle stands. */
const fixed = (cube: Cube) =>
  cubieAt(cube, TOP)!
    .stickers.map((s) => `${normalIndex(s.normal)}${s.color}`)
    .sort()
    .join()
const frame = frameOf('123', fixed)

const CORNERS: readonly Vec3[] = [
  [-1, 1, 0],
  [1, 1, 0],
  [-1, -1, 0],
  [1, -1, 0],
]

const bottomRight = (cube: Cube) => showsFrame(cube, frame(cube), BOTTOM)

const EDGE_STAGE: FigureStage = {
  kind: 'figures',
  key: 'stepTutorialFlatEdge',
  stage: 2,
  done: isSolved,
  figures: [
    {
      key: 'figureFlatEdge',
      match: (cube) => (bottomRight(cube) ? null : { hold: 'F', moves: FLIP_MIDDLE }),
    },
  ],
  focus: (cube) => [cube.findIndex((c) => sameAt(c.position, BOTTOM))],
  progress: (cube) => ({ done: bottomRight(cube) ? 1 : 0, total: 1 }),
  algorithms: [[FLIP_MIDDLE]],
}

export const CUBE123_TUTORIAL = tutorialOf({
  glossary: [FLAT_CORNER, FLAT_EDGE, HALF_TURN],
  faceColor: frameColor(frame),
  pieceKind: flatPieceKind,
  outside: flatOutside,
  stages: [cornerStage('stepTutorialFlatCorners', '123', frame, CORNERS), EDGE_STAGE],
})
