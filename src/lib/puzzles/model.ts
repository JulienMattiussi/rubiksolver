import type { FaceLabels } from '../core/notation'
import type { Cube, Dims, Face, Move, Turn, Vec3 } from '../core/types'
import type { GuideGroup, MoveDescription } from '../core/guide'
import type { EntryMarks, EntryStep, PaintSpec } from '../editor/entry'
import type { OutlineScan } from '../editor/scan/outlines'
import type { FlatScan, RingFace } from '../editor/scan/plan'

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
  /** Its move guide, when not a cube's layers (core/guide.ts). */
  readonly guide?: () => readonly GuideGroup[]
  /** What a turn does, when not what its kind of moves says (the Fashion-V's
   *  layers, the Curvy Copter III's edges). */
  readonly describe?: (turn: Turn) => MoveDescription
  /** How a camera scans it (lib/editor/scan/plan.ts), though built
   *  otherwise: as a grid, its holes skipped (the Void Cube); as a cube
   *  whose faces are no grid, each sticker where its drawing shows it
   *  (`square`: the Skewb, the Rex Cube...); as the box it turns in, its
   *  form found from what its faces show (`forms`: the towers); or face
   *  by face, each a ring round its center (the Megaminx); or from one
   *  picture, by its pieces' outlines (the Floppy Ghost, all silver); or
   *  by its flat faces, each where its drawing shows its stickers (`flat`:
   *  the pyramids). */
  readonly scan?:
    | 'grid'
    | 'square'
    | 'forms'
    | ((behind: boolean) => readonly RingFace[])
    | OutlineScan
    | FlatScan
  /** How it is entered (lib/editor/entry.ts), when not by painting its
   *  stickers alone. */
  readonly entry?: {
    /** Its steps before its colors, each a mode of entry (its form, its
     *  faces on canvases, its half-cubies, its joints, toggles), worked out
     *  when first needed. */
    readonly steps?: () => readonly EntryStep[]
    /** How its colors are entered, when not painted sticker by sticker. */
    readonly paint?: PaintSpec
    /** What the editor shows of a state, from the state `held` as the
     *  editor holds it (what entering cannot see set aside). */
    readonly seen?: (cube: Cube, held: (cube: Cube) => Cube) => Cube
    /** The state an entry builds, from what was entered and its marks;
     *  null when they cannot go together (a gear not its clips' colors). */
    readonly built?: (cube: Cube, marks: EntryMarks) => Cube | null
    /** Its stickers entering fills in rather than paints (a 4-star's inner
     *  points' faces up or down, under the outer layer). */
    readonly hidden?: (position: Vec3, normal: Vec3) => boolean
    /** Its slices turn whole: its centers move only together, so they stay
     *  home as the editor holds it, and a slice's gears share their pivot
     *  (a Gear Cube's, an Ultimate's; not the Extreme's). */
    readonly wholeSlices?: true
  }
}
