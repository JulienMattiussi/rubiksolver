import { applyMoves } from '../core/turn'
import type { Hold, HoldFrame } from '../core/hold'
import type { Color, Cube, Turn, Vec3 } from '../core/types'
import { keepsPlaced } from './keep'
import type { Sequence, TutorialPick, TutorialStep } from './tutorial'

/**
 * The kinds of stages a tutorial plan lists (see kit.ts), and the step each
 * makes on a state: a piece stage's (pieces placed one at a time), a figure
 * stage's (a figure recognized), a formula stage's (a formula of its own).
 */

/** A piece a stage places: which it is on a state, where it goes, and
 *  whether it is placed there. */
export interface Target {
  readonly piece: (cube: Cube) => number
  readonly slot: Vec3
  readonly placed: (cube: Cube) => boolean
  /** One of identical pieces (a 4x4's centers of a color): kept by what
   *  its place shows, not by which piece it is (a formula may swap two). */
  readonly interchangeable?: true
}

/** What a stage's formula works with: where the step began, the pieces it
 *  keeps (by index), and whether a state keeps the targets placed there. */
export interface Kept {
  readonly begun: Cube
  readonly placed: readonly number[]
  readonly targetsKept: (cube: Cube) => boolean
}

/** A stage placing pieces one at a time, in its targets' order (the first
 *  not placed is suggested). */
export interface PieceStage {
  readonly kind: 'pieces'
  /** Its name (a key of the tutorial's texts and of the steps' names). */
  readonly key: string
  /** Its rank among the method's stages. */
  readonly stage: number
  /** Its targets, or how to read them where the step began (a 2x2's: round
   *  its landmark corner, wherever it stands). */
  readonly targets: readonly Target[] | ((begun: Cube) => readonly Target[])
  /** The sticker the arrow follows (the cross's yellow). */
  readonly marker?: Color
  /** Its moves one by one with their words beside them (see
   *  `TutorialStep.words`). */
  readonly words?: true
  /** The side it finishes (see `TutorialStep.shows`). */
  readonly shows?: Vec3
  /** The sequences its formulas end on, read in its hold. */
  readonly algorithms?: readonly Sequence[]
  /** The pieces one may pick, the placed ones given (by default, its
   *  targets not placed). */
  readonly pickable?: (cube: Cube, placed: readonly number[]) => number[]
  /** How to hold the puzzle for a pick (`next`: the target suggested). */
  readonly hold: (begun: Cube, pick: TutorialPick | null, next: Target) => Hold
  /** The formula taking a pick where it goes, keeping what it must. */
  readonly formula: (cube: Cube, pick: TutorialPick, kept: Kept) => Turn[] | null
  /** Its formulas checked to keep the placed pieces as they were (those a
   *  recipe finds, unlike a search for that goal). */
  readonly checked?: true
}

/** A stage playing a formula of its own, no piece picked. */
export interface FormulaStage {
  readonly kind: 'formula'
  readonly key: string
  readonly done: (cube: Cube) => boolean
  readonly hold: Hold
  readonly formula: (cube: Cube) => Turn[]
}

/** A figure a stage recognizes, and what to do about it: held the way it
 *  asks (null: it is not there), the formula read in that hold. */
interface Figure {
  readonly key: string
  /** Where the figure shows: how to hold the puzzle and what to play, read
   *  in that hold (null: it is not there). */
  readonly match: (cube: Cube) => { hold: Hold; moves: readonly Turn[] } | null
}

/** A stage played by figures, no piece picked (the last layer's): the
 *  first figure found says how to hold the puzzle and what to play, until
 *  it is done; the pieces drawing it (`focus`) highlighted. */
export interface FigureStage {
  readonly kind: 'figures'
  readonly key: string
  readonly stage: number
  readonly done: (cube: Cube) => boolean
  readonly figures: readonly Figure[]
  /** The pieces to work on when no arrow says so (the corners to turn in
   *  place), highlighted. */
  readonly focus?: (cube: Cube) => number[]
  /** The pieces it works on, moved with an arrow each (the top layer's,
   *  their arrows from top face to top face, or following `marker`). */
  readonly subjects?: (cube: Cube) => number[]
  readonly marker?: Color
  /** The side it works on, its outward normal (see `TutorialStep.side`). */
  readonly side?: Vec3
  /** The side it finishes (see `TutorialStep.shows`). */
  readonly shows?: Vec3
  readonly progress: (cube: Cube) => { done: number; total: number }
  readonly algorithms?: readonly Sequence[]
}

/** A piece stage's targets, read on a state. */
export const targetsOf = (stage: PieceStage, cube: Cube) =>
  typeof stage.targets === 'function' ? stage.targets(cube) : stage.targets

/** The pieces a done piece stage keeps, by which they are (interchangeable
 *  ones apart: their places keep them). */
export const keptBy = (stage: PieceStage, begun: Cube, cube: Cube) =>
  targetsOf(stage, begun).flatMap((t) => (t.interchangeable ? [] : [t.piece(cube)]))

/** A figure stage's step: the figure found where the step began, held its
 *  way, its formula played from the puzzle's own frame and checked to keep
 *  the pieces placed. */
function figureStep(
  def: FigureStage,
  frame: HoldFrame,
  cube: Cube,
  begun: Cube,
  kept: number[],
): TutorialStep {
  const figureOf = (state: Cube) =>
    def.figures
      .map((figure) => ({ figure, seen: figure.match(state) }))
      .find((f) => f.seen !== null)
  const found = figureOf(begun)
  const hold = found?.seen?.hold ?? frame.holds[0]!
  // The formula of the figure the puzzle shows now, held as the step began
  // (turned by hand to another figure: none, the step taken back).
  const now = cube === begun ? found : figureOf(cube)
  const moves =
    now?.seen && now.seen.hold === hold ? now.seen.moves.map((m) => frame.played(hold, m)) : null
  const fromBegun = found?.seen?.moves.map((m) => frame.played(hold, m))
  return {
    kind: 'figure',
    ...(fromBegun && { outcome: def.progress(applyMoves(begun, fromBegun)) }),
    key: def.key,
    stage: def.stage,
    progress: def.progress(begun),
    hold: () => hold,
    ...(def.algorithms && { algorithms: def.algorithms }),
    ...(found && { figure: found.figure.key }),
    ...(def.focus && { focus: def.focus(cube) }),
    ...(def.subjects && { subjects: def.subjects(cube) }),
    ...(def.marker && { marker: def.marker }),
    ...(def.side && { side: def.side }),
    ...(def.shows && { shows: def.shows }),
    placed: kept,
    suggestion: null,
    pickable: [],
    slots: () => [],
    formula: () => (moves && keepsPlaced(cube, moves, kept, begun) ? moves : null),
  }
}

/** A piece stage's step on a state (`cube`), the step having begun at
 *  `begun`, the pieces earlier stages placed kept (`kept`). */
function pieceStep(def: PieceStage, cube: Cube, begun: Cube, kept: number[]): TutorialStep {
  const targets = targetsOf(def, begun)
  const done = targets.filter((t) => t.placed(begun))
  const free = targets.filter((t) => !done.includes(t))
  const next = free[0]!
  const placed = [...kept, ...done.flatMap((t) => (t.interchangeable ? [] : [t.piece(cube)]))]
  const targetsKept = (c: Cube) => done.every((t) => t.placed(c))
  return {
    kind: 'pieces',
    key: def.key,
    stage: def.stage,
    progress: { done: done.length, total: targets.length },
    hold: (pick) => def.hold(begun, pick, next),
    ...(def.marker && { marker: def.marker }),
    ...(def.words && { words: def.words }),
    ...(def.shows && { shows: def.shows }),
    ...(def.algorithms && { algorithms: def.algorithms }),
    placed,
    suggestion: { piece: next.piece(cube), slot: next.slot },
    pickable: def.pickable ? def.pickable(cube, placed) : free.map((t) => t.piece(cube)),
    slots: () => free.map((t) => t.slot),
    formula: (pick) => {
      if (!pick) return null
      const moves = def.formula(cube, pick, { begun, placed, targetsKept })
      return moves && def.checked && !keepsPlaced(cube, moves, placed, begun) ? null : moves
    },
  }
}

/** The step a stage not done makes (a projected one's inner, see stepOf). */
export function stageStep(
  stage: PieceStage | FormulaStage | FigureStage,
  frame: HoldFrame,
  cube: Cube,
  begun: Cube,
  kept: number[],
): TutorialStep {
  if (stage.kind === 'figures') return figureStep(stage, frame, cube, begun, kept)
  if (stage.kind === 'pieces') return pieceStep(stage, cube, begun, kept)
  return {
    kind: 'formula',
    key: stage.key,
    hold: () => stage.hold,
    placed: [],
    suggestion: null,
    pickable: [],
    slots: () => [],
    formula: () => stage.formula(cube),
  }
}
