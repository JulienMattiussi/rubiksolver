import { applyMoves } from '../core/turn'
import type { Color, Cube, CubeShape, Move, Vec3 } from '../core/types'
import { CUBE3_TUTORIAL } from './cube3'

/**
 * The tutorial: the puzzle solved a step at a time by the user, each step
 * a formula moving a few chosen pieces where they go. The tutorial says
 * which step comes, suggests a piece and where it goes, and works out the
 * formula for whichever piece and place the user picks instead; it shows
 * what the formula does to every piece: the ones aimed at, the ones
 * already placed (kept), the others it really moves (hatched: placed later)
 * and the ones it leaves be.
 */

/** A piece picked (its index in the cube, stable from move to move) and
 *  where it should go (a slot: the position it should stand at). */
export interface TutorialPick {
  readonly piece: number
  readonly slot: Vec3
}

/** Where the tutorial stands on a state: its step, what it suggests. */
export interface TutorialStep {
  /** The step's name (a key of the steps' names). */
  readonly key: string
  /** Its rank among the method's stages (none: a step before them, the
   *  centers put back). */
  readonly stage?: number
  /** How far the stage has come: its pieces placed, of how many. */
  readonly progress?: { readonly done: number; readonly total: number }
  /** The center to hold facing you while playing the formula (its color):
   *  the formula's letters read from there. */
  readonly front: Color
  /** The color of the sticker that tells where a piece goes (the cross's
   *  yellow, down): the arrow joins its face before and after. */
  readonly marker?: Color
  /** The pieces already placed, which the step's formulas keep. */
  readonly placed: readonly number[]
  /** The piece suggested and its place; null when the step takes none
   *  (its formula alone, `formula(null)`), or when it is still to come. */
  readonly suggestion: TutorialPick | null
  /** The pieces one may pick. */
  readonly pickable: readonly number[]
  /** Where a piece may go. */
  readonly slots: (piece: number) => readonly Vec3[]
  /** The formula moving the pick where it goes, keeping the placed pieces
   *  (null: none found, or the step is still to come). */
  readonly formula: (pick: TutorialPick | null) => Move[] | null
  /** Whether the step is not taught yet (the rest of the solve to come). */
  readonly comingSoon?: true
}

/** A tutorial: the step a state stands at, or null once it is done. */
export interface Tutorial {
  readonly stepOf: (cube: Cube) => TutorialStep | null
}

/** The puzzles that have a tutorial. */
const TUTORIALS: Partial<Record<CubeShape, Tutorial>> = { '3': CUBE3_TUTORIAL }

export const tutorialFor = (shape: CubeShape): Tutorial | undefined => TUTORIALS[shape]

/** What a formula does to a piece: aimed at (`target`), standing where
 *  that one goes (`slot`), kept in place (`placed`), moved though not
 *  placed yet (`moved`: hatched), left be. */
export type Tone = 'target' | 'slot' | 'placed' | 'moved' | 'still'

/** Each piece's tone (by index) under a formula. */
export function tonesOf(
  cube: Cube,
  moves: readonly Move[],
  pick: TutorialPick | null,
  placed: readonly number[],
): Tone[] {
  const after = applyMoves(cube, moves)
  return cube.map((c, i) => {
    if (pick && i === pick.piece) return 'target'
    if (pick && c.position.join() === pick.slot.join()) return 'slot'
    if (placed.includes(i)) return 'placed'
    const a = after[i]!
    const moved =
      a.position.join() !== c.position.join() ||
      a.stickers.some((s, k) => s.normal.join() !== c.stickers[k]!.normal.join())
    return moved ? 'moved' : 'still'
  })
}

/** Where a formula takes the pick's marker sticker (its color, `marker`;
 *  the piece's first sticker if it has none): the face it stands on
 *  before and the one after (positions and outward normals). */
export function markerPath(
  cube: Cube,
  moves: readonly Move[],
  pick: TutorialPick,
  marker?: Color,
): { from: Vec3; fromNormal: Vec3; to: Vec3; toNormal: Vec3 } {
  const before = cube[pick.piece]!
  const after = applyMoves(cube, moves)[pick.piece]!
  const k = Math.max(
    0,
    before.stickers.findIndex((s) => s.color === marker),
  )
  return {
    from: before.position,
    fromNormal: before.stickers[k]!.normal,
    to: after.position,
    toNormal: after.stickers.find((s) => s.color === before.stickers[k]!.color)!.normal,
  }
}
