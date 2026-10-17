import { applyMoves } from '../core/turn'
import { CUBE_HOLDS, type Hold, type HoldFrame } from '../core/hold'
import type { Color, Cube, Face, Move, Vec3 } from '../core/types'
import { keepsPlaced } from './keep'
import type { Sequence, Tutorial, TutorialPick, TutorialStep } from './tutorial'

/**
 * Tutorials declared, not coded: a puzzle's tutorial is a list of stages
 * (`TutorialPlan`), and this kit turns it into the step a state stands at.
 * Most stages place pieces one at a time (`PieceStage`): what they place
 * (their targets), how to hold the puzzle, how to find a formula; the kit
 * does the rest (which are placed where the step began, which may be
 * picked and where to, the suggestion, how far along, the placed pieces
 * kept). A few play a formula of their own, no piece picked
 * (`FormulaStage`: the 3x3's centers put back).
 */

/** A piece a stage places: which it is on a state, where it goes, and
 *  whether it is placed there. */
export interface Target {
  readonly piece: (cube: Cube) => number
  readonly slot: Vec3
  readonly placed: (cube: Cube) => boolean
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
interface PieceStage {
  readonly kind: 'pieces'
  /** Its name (a key of the tutorial's texts and of the steps' names). */
  readonly key: string
  /** Its rank among the method's stages. */
  readonly stage: number
  readonly targets: readonly Target[]
  /** The sticker the arrow follows (the cross's yellow). */
  readonly marker?: Color
  /** Its moves one by one with their words beside them (see
   *  `TutorialStep.words`). */
  readonly words?: true
  /** The sequences its formulas end on, read in its hold. */
  readonly algorithms?: readonly Sequence[]
  /** The pieces one may pick, the placed ones given (by default, its
   *  targets not placed). */
  readonly pickable?: (cube: Cube, placed: readonly number[]) => number[]
  /** How to hold the puzzle for a pick (`next`: the target suggested). */
  readonly hold: (begun: Cube, pick: TutorialPick | null, next: Target) => Hold
  /** The formula taking a pick where it goes, keeping what it must. */
  readonly formula: (cube: Cube, pick: TutorialPick, kept: Kept) => Move[] | null
  /** Its formulas checked to keep the placed pieces as they were (those a
   *  recipe finds, unlike a search for that goal). */
  readonly checked?: true
}

/** A stage playing a formula of its own, no piece picked. */
interface FormulaStage {
  readonly kind: 'formula'
  readonly key: string
  readonly done: (cube: Cube) => boolean
  readonly hold: Hold
  readonly formula: (cube: Cube) => Move[]
}

/** A figure a stage recognizes, and what to do about it: held the way it
 *  asks (null: it is not there), the formula read in that hold. */
interface Figure {
  readonly key: string
  /** Where the figure shows: how to hold the puzzle and what to play, read
   *  in that hold (null: it is not there). */
  readonly match: (cube: Cube) => { hold: Hold; moves: readonly Move[] } | null
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
  /** The side it works on (see `TutorialStep.face`). */
  readonly face?: Face
  readonly progress: (cube: Cube) => { done: number; total: number }
  readonly algorithms?: readonly Sequence[]
}

/** A tutorial: its stages in order, and the one still to come after them
 *  (shown, not taught yet). */
export interface TutorialPlan {
  readonly stages: readonly Stage[]
  /** The ways to hold the puzzle (a cube's sides round its top, unless
   *  told). */
  readonly frame?: HoldFrame
  /** The stage still to come, shown not taught yet; none once the plan
   *  solves the puzzle (the tutorial then over). */
  readonly next?: { readonly key: string; readonly stage: number; readonly hold: Hold }
}

type Stage = PieceStage | FormulaStage | FigureStage

const isDone = (stage: Stage, cube: Cube) =>
  stage.kind === 'pieces' ? stage.targets.every((t) => t.placed(cube)) : stage.done(cube)

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
  const hold = found?.seen?.hold ?? 'F'
  // The formula of the figure the puzzle shows now, held as the step began
  // (turned by hand to another figure: none, the step taken back).
  const now = cube === begun ? found : figureOf(cube)
  const moves =
    now?.seen && now.seen.hold === hold ? now.seen.moves.map((m) => frame.played(hold, m)) : null
  const fromBegun = found?.seen?.moves.map((m) => frame.played(hold, m))
  return {
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
    ...(def.face && { face: def.face }),
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
  const done = def.targets.filter((t) => t.placed(begun))
  const free = def.targets.filter((t) => !done.includes(t))
  const next = free[0]!
  const placed = [...kept, ...done.map((t) => t.piece(cube))]
  const targetsKept = (c: Cube) => done.every((t) => t.placed(c))
  return {
    key: def.key,
    stage: def.stage,
    progress: { done: done.length, total: def.targets.length },
    hold: (pick) => def.hold(begun, pick, next),
    ...(def.marker && { marker: def.marker }),
    ...(def.words && { words: def.words }),
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

/** The tutorial a plan makes: the first stage not done where the step
 *  began is the step (the pieces of the stages before kept), and once they
 *  are all done, the stage still to come. */
export function tutorialOf(plan: TutorialPlan): Tutorial {
  const frame = plan.frame ?? CUBE_HOLDS
  return {
    frame,
    stepOf: (cube, begun = cube) => {
      let kept: number[] = []
      for (const stage of plan.stages) {
        if (!isDone(stage, begun)) {
          if (stage.kind === 'figures') return figureStep(stage, frame, cube, begun, kept)
          return stage.kind === 'formula'
            ? {
                key: stage.key,
                hold: () => stage.hold,
                placed: [],
                suggestion: null,
                pickable: [],
                slots: () => [],
                formula: () => stage.formula(cube),
              }
            : pieceStep(stage, cube, begun, kept)
        }
        if (stage.kind === 'pieces') kept = [...kept, ...stage.targets.map((t) => t.piece(cube))]
      }
      const { next } = plan
      if (!next) return null
      return {
        key: next.key,
        stage: next.stage,
        hold: () => next.hold,
        placed: kept,
        suggestion: null,
        pickable: [],
        slots: () => [],
        formula: () => null,
        comingSoon: true,
      }
    },
  }
}
