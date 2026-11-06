import { isSolved } from '../../core/cube'
import { allTurnsOf } from '../../core/moveSet'
import { movesFor } from '../../core/moves'
import { sameAt } from '../../core/pieces'
import type { Cube, Cubie, Move } from '../../core/types'
import { lyingFlat } from '../../puzzles/flat/floppy'
import { found, searchFormulas } from '../../solve/formulaSearch'
import { atEverySide, type MethodPlan } from '../../solve/solverKit'

/**
 * The Floppy unlocked (its sides' quarter turns, PuzzleModel.unlocked), flat
 * first:
 *   1. Flat again     the fewest turns laying every piece back in the
 *                     plate, searched on the shape alone (which piece is
 *                     where set aside);
 *   2. Corners        each between the sides of its colors, by half turns
 *                     (they keep it flat; unlocked, the corners may stand
 *                     an odd permutation away, which half turns undo);
 *   3. Edges          each upside down one flipped alone by `FLIP_ONE`:
 *                     the rows beside it stood up, its side holds it alone.
 */

/** Flips the front edge alone: the rows on its left and right stood up, the
 *  front side turns it by itself (asserted in tests). */
export const FLIP_ONE = "R L F2 L' R'"

const TURNS = movesFor('331', true).map((m) => [m])
const HALF_TURNS = movesFor('331').map((m) => [m])
const FLIPS = atEverySide(FLIP_ONE)

/** Whether a piece is home: each sticker the color of the piece in the
 *  middle of its side (the center's for the big faces, an edge's for the
 *  rim), whichever way the puzzle is held. */
function home(cube: Cube, piece: Cubie): boolean {
  return piece.stickers.every((s) => {
    const middle = piece.position.map((v, a) => (s.normal[a] === 0 ? 0 : v))
    const there = cube.find((c) => sameAt(c.position, middle))
    return there?.stickers.find((t) => sameAt(t.normal, s.normal))?.color === s.color
  })
}

const isCorner = (piece: Cubie) => piece.position.filter((v) => v !== 0).length === 2
const cornersHome = (cube: Cube) =>
  lyingFlat(cube) && cube.filter(isCorner).every((c) => home(cube, c))

/** Its shape alone: where pieces stand and which way they lie, whichever
 *  piece it is. */
const shapeKey = (cube: Cube) =>
  cube
    .map(
      (c) =>
        `${c.position.join()}:${c.stickers
          .map((s) => s.normal.findIndex((v) => v !== 0))
          .sort()
          .join('')}`,
    )
    .sort()
    .join('|')

const by =
  (formulas: readonly (readonly Move[])[], goal: (c: Cube) => boolean, key?: (c: Cube) => string) =>
  (cube: Cube): Move[] =>
    found(searchFormulas(cube, formulas, goal, key && { key }), 'Floppy: unsolvable state')

const UNLOCKED = { generators: TURNS.flat(), turns: TURNS.flat() }

export const FLOPPY_UNLOCKED_PLAN: MethodPlan = [
  {
    key: 'stepFloppyFlat',
    goal: lyingFlat,
    moves: UNLOCKED,
    phases: [by(TURNS, lyingFlat, shapeKey)],
  },
  {
    key: 'stepFloppyFlatCorners',
    goal: cornersHome,
    moves: allTurnsOf('331'),
    phases: [by(HALF_TURNS, cornersHome)],
  },
  { key: 'stepFloppyFlipEdges', goal: isSolved, moves: UNLOCKED, phases: [by(FLIPS, isSolved)] },
]
