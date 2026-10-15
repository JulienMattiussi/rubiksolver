import type { FaceLabels } from '../core/moves'
import type { Cube, Dims, Face, Move, Turn } from '../core/types'

/** What an entry says of a puzzle besides its colors: the slots `turned`
 *  (a gear over on its clips, a center a quarter off, a face's bars across)
 *  and the gears' pivots (`spins`, by slot, as they show: see gear.ts). */
export interface EntryMarks {
  readonly turned: readonly string[]
  readonly spins: Readonly<Record<string, number>>
}

/** No marks: a puzzle entered by its colors alone. */
export const NO_MARKS: EntryMarks = { turned: [], spins: {} }

/**
 * How a puzzle departs from a plain cuboid on its grid, each hook optional:
 * the core (cube.ts, turn.ts) asks its model first, and does the cuboid's
 * thing otherwise. Each category's models are in its folder's models.ts.
 * The core loads them first: a hook calls what the core defines (cube.ts)
 * when called, never as it loads.
 */
export interface PuzzleModel {
  /** Built solved otherwise than on its grid. */
  readonly solved?: () => Cube
  /** The mechanism its turns act on, when not its own layers (nor, for one
   *  that shifts, a cube of its longest side). */
  readonly mechanism?: Dims
  /** Whether a face turn can go now (blocked by a piece, a bar, a face's
   *  way round...). */
  readonly turnAllowed?: (cube: Cube, move: Move) => boolean
  /** Whether it stands in its box, when its pieces' cells do not say. */
  readonly boxed?: (cube: Cube) => boolean
  /** Whether it is solved, when one color per face does not say. */
  readonly isSolved?: (cube: Cube) => boolean
  /** Its whole-puzzle turns, when not a cuboid's quarter or half turns. */
  readonly symmetries?: readonly ((cube: Cube) => Cube)[]
  /** Every turn it has, when not its grid's face turns (one per layer and
   *  amount of a gridless puzzle). */
  readonly turns?: () => readonly Turn[]
  /** A scramble of it, when not face turns at random. */
  readonly scramble?: (length: number, rng: () => number, start: Cube) => Turn[]
  /** The amounts a face turns by, when its mechanism does not say. */
  readonly amounts?: (face: Face) => readonly (1 | 2 | 3)[]
  /** The layers a face turn can take, when its inner turns do not say. */
  readonly layers?: (face: Face) => readonly Pick<Move, 'depth' | 'wide'>[]
  /** How a turn is written, when not as a cube's (the Fashion-V's blocks). */
  readonly format?: (move: Move, labels: FaceLabels) => string
  /** How it is entered, when not by painting its stickers (editor.ts). */
  readonly entry?: {
    /** Piece by piece, a click on a slot putting the next piece that fits
     *  (pieceEditor.ts). */
    readonly byPieces?: true
    /** What the editor shows of a state, from the state `held` as the
     *  editor holds it (what entering cannot see set aside). */
    readonly seen?: (cube: Cube, held: (cube: Cube) => Cube) => Cube
    /** The state an entry builds, from what was entered and its marks. */
    readonly built?: (cube: Cube, marks: EntryMarks) => Cube
  }
}
