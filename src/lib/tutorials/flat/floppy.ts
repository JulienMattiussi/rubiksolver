import { isSolved } from '../../core/cube'
import { CUBE_HOLDS, type Hold } from '../../core/hold'
import { sameAt } from '../../core/pieces'
import { applyMoves } from '../../core/turn'
import type { Cube, Vec3 } from '../../core/types'
import { FLIP_EDGES } from '../../methods/flat/floppy'
import { tutorialOf, type FigureStage } from '../../teach/kit'
import {
  cornerStage,
  FLAT_CORNER,
  FLAT_EDGE,
  flatOutside,
  flatPieceKind,
  frameColor,
  HALF_TURN,
} from './flatKit'
import { FLOPPY_EDGES, FLOPPY_FRAME, flippedEdges } from './floppyKit'

/**
 * The Floppy's tutorial, corners then edges (its method, methods/flat/
 * floppy.ts), held flat, white up:
 *   1. the corners, one at a time, the shortest way in half turns;
 *   2. the edges, which never leave their place (a half turn flips the one
 *      it carries), flipped two at a time by `(F2 R2)3`, which flips the
 *      front and right ones: held with a flipped pair there; two opposite
 *      ones, held with one in front (the formula leaves them side by
 *      side); all four, any way (it leaves two).
 * Its center and edges' sides say each side's color (floppyKit.ts).
 */

const CORNERS: readonly Vec3[] = [
  [-1, 0, 1],
  [1, 0, 1],
  [1, 0, -1],
  [-1, 0, -1],
]
const flippedCount = (cube: Cube) => flippedEdges(cube).length

/** Where the formula, held `hold`, leaves `left` edges upside down. */
const holdLeaving = (cube: Cube, left: number): Hold | null =>
  CUBE_HOLDS.holds.find(
    (hold) =>
      flippedCount(
        applyMoves(
          cube,
          FLIP_EDGES.map((m) => CUBE_HOLDS.played(hold, m)),
        ),
      ) === left,
  ) ?? null

/** A figure of the flipped edges: their count, and how many the formula
 *  leaves held its way. */
const figure = (key: string, count: number, left: number) => ({
  key,
  match: (cube: Cube) => {
    if (flippedCount(cube) !== count) return null
    const hold = holdLeaving(cube, left)
    return hold === null ? null : { hold, moves: FLIP_EDGES }
  },
})

const EDGE_STAGE: FigureStage = {
  kind: 'figures',
  key: 'stepTutorialFloppyEdges',
  stage: 2,
  done: isSolved,
  figures: [
    // Side by side: held with them in front and on the right, both flip.
    figure('figureFloppyPair', 2, 0),
    // Opposite: held with one in front, they end side by side.
    figure('figureFloppyOpposite', 2, 2),
    figure('figureFloppyFour', 4, 2),
  ],
  focus: (cube) =>
    flippedEdges(cube).map((slot) => cube.findIndex((c) => sameAt(c.position, slot))),
  progress: (cube) => ({
    done: FLOPPY_EDGES.length - flippedCount(cube),
    total: FLOPPY_EDGES.length,
  }),
  algorithms: [[FLIP_EDGES]],
}

export const FLOPPY_TUTORIAL = tutorialOf({
  glossary: [FLAT_CORNER, FLAT_EDGE, HALF_TURN],
  faceColor: frameColor(FLOPPY_FRAME),
  pieceKind: flatPieceKind,
  outside: flatOutside,
  stages: [cornerStage('stepTutorialFloppyCorners', '331', FLOPPY_FRAME, CORNERS), EDGE_STAGE],
})
