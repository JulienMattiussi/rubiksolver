import { applyMoves } from '../core/turn'
import { CUBE_HOLDS, type Hold, type HoldFrame } from '../core/hold'
import { FACE_NORMAL } from '../core/geometry'
import type { Color, Cube, CubeShape, Face, Move, Vec3 } from '../core/types'
import { CUBE3_TUTORIAL } from '../tutorials/standard/cube3'

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
  /** The way to hold the puzzle for a pick (the side facing you, the top
   *  up): its formula's letters read from there, the same formula for
   *  every slot (the corners' `R U R' U'`, their slot front right). */
  readonly hold: (pick: TutorialPick | null) => Hold
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
  /** The sequences its formulas use, as read in its hold, each cut in the
   *  gestures it is learnt as (shown so). */
  readonly algorithms?: readonly Sequence[]
  /** A step recognized by a figure rather than a piece picked (the last
   *  layer's: the white cross's dot, L or line): the figure's name (a key
   *  of the tutorial's texts), and the pieces that draw it, highlighted. */
  readonly figure?: string
  readonly focus?: readonly number[]
  /** How far the step will have come once its formula played (from where
   *  it began): what to check then. */
  readonly outcome?: { readonly done: number; readonly total: number }
  /** The pieces such a step works on (the top corners it cycles): those
   *  its formula moves keep their colors, an arrow each to where it goes. */
  readonly subjects?: readonly number[]
  /** The side the step works on (the last layer's: the top): its
   *  subjects' arrows go from face to face there, those following the
   *  marker only when it comes there, and the view looks at it. */
  readonly face?: Face
  /** Whether its moves one by one keep their words beside them (the first
   *  steps, the letters being learnt); else they show in a row, their
   *  words in tooltips, but for those not shown yet. */
  readonly words?: true
  /** Whether the step is not taught yet (the rest of the solve to come). */
  readonly comingSoon?: true
}

/** A tutorial: the step a state stands at, or null once it is done. While
 *  a step is under way (turns by hand since it began, at `begun`), the step
 *  and the pieces it keeps are read where it began, and its formula works
 *  from `cube`, bringing them all back: a turn by hand that moves a placed
 *  piece does not take it off the list. */
export interface Tutorial {
  readonly stepOf: (cube: Cube, begun?: Cube) => TutorialStep | null
  /** The ways to hold the puzzle its steps use (its formulas read so). */
  readonly frame: HoldFrame
}

/** The puzzles that have a tutorial. */
const TUTORIALS: Partial<Record<CubeShape, Tutorial>> = { '3': CUBE3_TUTORIAL }

export const tutorialFor = (shape: CubeShape): Tutorial | undefined => TUTORIALS[shape]

/** What a formula does to a piece: aimed at (`target`), standing where
 *  that one goes (`slot`), kept in place (`placed`), moved though not
 *  placed yet (`moved`: hatched), left be. */
export type Tone = 'target' | 'slot' | 'placed' | 'subject' | 'moved' | 'still'

/** Each piece's tone (by index) under a formula. */
export function tonesOf(
  cube: Cube,
  moves: readonly Move[],
  pick: TutorialPick | null,
  placed: readonly number[],
  focus: readonly number[] = [],
  subjects: readonly number[] = [],
): Tone[] {
  const after = applyMoves(cube, moves)
  return cube.map((c, i) => {
    if ((pick && i === pick.piece) || focus.includes(i)) return 'target'
    if (pick && c.position.join() === pick.slot.join()) return 'slot'
    if (placed.includes(i)) return 'placed'
    const a = after[i]!
    const moved =
      a.position.join() !== c.position.join() ||
      a.stickers.some((s, k) => s.normal.join() !== c.stickers[k]!.normal.join())
    return moved ? (subjects.includes(i) ? 'subject' : 'moved') : 'still'
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

/** A formula's arrows: the pick's (its marker sticker's way), or, with no
 *  pick, one for each subject it moves, on the step's side (`face`): its
 *  marker sticker's way if the step has one, when it comes to that side
 *  (the white brought up), else from that side's face to the same where
 *  it lands. */
export function arrowsOf(
  cube: Cube,
  moves: readonly Move[],
  step: TutorialStep,
  pick: TutorialPick | null,
): ({ piece: number } & ReturnType<typeof markerPath>)[] {
  if (moves.length === 0) return []
  if (pick) return [{ piece: pick.piece, ...markerPath(cube, moves, pick, step.marker) }]
  if (!step.face) return []
  const after = applyMoves(cube, moves)
  const up = FACE_NORMAL[step.face]
  return (step.subjects ?? []).flatMap((i) => {
    if (cube[i]!.position.join() === after[i]!.position.join()) return []
    if (step.marker) {
      // Only the marker stickers brought to that side: the figure next.
      const path = markerPath(cube, moves, { piece: i, slot: [0, 0, 0] }, step.marker)
      return path.toNormal.join() === up.join() ? [{ piece: i, ...path }] : []
    }
    return [
      { piece: i, from: cube[i]!.position, fromNormal: up, to: after[i]!.position, toNormal: up },
    ]
  })
}

/** A piece's colors, the marker's first (the yellow edge's: yellow-green). */
export function pieceColors(cube: Cube, index: number, marker?: Color): Color[] {
  return [...cube[index]!.stickers]
    .sort((a, b) => Number(b.color === marker) - Number(a.color === marker))
    .map((s) => s.color)
}

/** The piece standing where a pick goes (null: none, or the pick's own). */
export function occupantOf(cube: Cube, pick: TutorialPick): number | null {
  const at = cube.findIndex((c, i) => i !== pick.piece && c.position.join() === pick.slot.join())
  return at < 0 ? null : at
}

/** A sequence learnt, as its gestures: pieces each doing one thing (the
 *  middle edges' insertion: out of the way, then back), shown apart. */
export type Sequence = readonly (readonly Move[])[]

/** A piece of a formula as it is taught: moves to play one by one, or a
 *  sequence learnt played `times` times in a row. */
export interface FormulaSegment {
  readonly kind: 'moves' | 'sequence'
  readonly moves: Move[]
  readonly times: number
}

/**
 * A formula (read in its hold) cut as it is taught: the sequences learnt
 * (`known`: the corners' trigger, the middle edges' insertions) wherever
 * they come and from whichever side they are played (another slot's
 * insertion lifting an edge out), gesture by gesture, a sequence repeated
 * told once with its count, and the moves between them one by one.
 */
export function formulaSegments(
  moves: readonly Move[],
  known: readonly Sequence[] = [],
  frame: HoldFrame = CUBE_HOLDS,
): FormulaSegment[] {
  const same = (a: Move, b: Move) => a.face === b.face && a.amount === b.amount
  const segments: { kind: 'moves' | 'sequence'; moves: Move[]; times: number }[] = []
  for (let i = 0; i < moves.length;) {
    const learnt = known.find((sequence) => {
      const k = sequence.flat()
      return (
        i + k.length <= moves.length &&
        frame.holds.some((hold) => k.every((m, j) => same(frame.inHold(hold, moves[i + j]!), m)))
      )
    })
    const last = segments[segments.length - 1]
    if (learnt) {
      // A sequence of one gesture repeated is told once with its count;
      // one of several, gesture by gesture.
      const played = moves.slice(i, i + learnt.flat().length)
      if (
        learnt.length === 1 &&
        last?.kind === 'sequence' &&
        last.moves.length === played.length &&
        last.moves.every((m, j) => same(m, played[j]!))
      ) {
        last.times++
      } else {
        let at = 0
        for (const gesture of learnt) {
          segments.push({
            kind: 'sequence',
            moves: played.slice(at, at + gesture.length),
            times: 1,
          })
          at += gesture.length
        }
      }
      i += played.length
    } else {
      if (last?.kind === 'moves') last.moves.push(moves[i]!)
      else segments.push({ kind: 'moves', moves: [moves[i]!], times: 1 })
      i++
    }
  }
  return segments
}
