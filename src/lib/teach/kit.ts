import { CUBE_HOLDS, type Hold, type HoldFrame } from '../core/hold'
import type { Color, Cube, Cubie, Sticker, Vec3 } from '../core/types'
import { liftStep, thenProject, type Projection } from './project'
import {
  keptBy,
  stageStep,
  targetsOf,
  type FigureStage,
  type FormulaStage,
  type PieceStage,
} from './stages'
import type { RecapStage, Term, Tutorial } from './tutorial'

export type { FigureStage, Kept, Target } from './stages'

/**
 * Tutorials declared, not coded: a puzzle's tutorial is a list of stages
 * (`TutorialPlan`), and this kit turns it into the step a state stands at.
 * Most stages place pieces one at a time (`PieceStage`): what they place
 * (their targets), how to hold the puzzle, how to find a formula; the kit
 * does the rest (which are placed where the step began, which may be
 * picked and where to, the suggestion, how far along, the placed pieces
 * kept). Others are played by figures (`FigureStage`: the last layer's),
 * or play a formula of their own, no piece picked (`FormulaStage`: the
 * 3x3's centers put back). Nothing here knows a model: its turns, its
 * pieces' positions and its holds (`frame`) come from the plan.
 */

/** A tutorial: its stages in order, and the one still to come after them
 *  (shown, not taught yet). */
export interface TutorialPlan {
  readonly stages: readonly Stage[]
  /** The ways to hold the puzzle (a cube's sides round its top, unless
   *  told). */
  readonly frame?: HoldFrame
  /** The color of a side (its outward normal), for a puzzle with no
   *  center there (a 2x2: from its anchor corner); by default, the center's
   *  there. */
  readonly faceColor?: (cube: Cube, normal: Vec3) => Color | null
  /** The words its steps use, shown first (see `Tutorial.glossary`). */
  readonly glossary?: readonly Term[]
  /** See `Tutorial.pieceKind` (by default, a cube's), `outside` and
   *  `holding`. */
  readonly pieceKind?: (cubie: Cubie) => string
  readonly outside?: (cubie: Cubie) => readonly Sticker[]
  readonly holding?: string
  /** The stage still to come, shown not taught yet; none once the plan
   *  solves the puzzle (the tutorial then over). */
  readonly next?: { readonly key: string; readonly stage: number; readonly hold: Hold }
}

/** A small puzzle's stage played on a big one through a projection (a
 *  3x3's on a reduced 4x4), renumbered `stage`. */
interface ProjectedStage {
  readonly kind: 'projected'
  readonly stage: number
  readonly inner: PieceStage | FigureStage
  readonly via: Projection
}

export type Stage = PieceStage | FormulaStage | FigureStage | ProjectedStage

/** A stage as a plan lists it: its own, or a small puzzle's projected. */
export const projected = (
  inner: PieceStage | FigureStage,
  via: Projection,
  stage: number,
): ProjectedStage => ({ kind: 'projected', stage, inner, via })

/** A plan's stages played on a bigger puzzle through a projection (a
 *  4x4's on a Super Revenge): its own projected, its projected ones through
 *  both projections, its formula ones read on the projection (their turns
 *  the same on both). */
export const projectedStages = (stages: readonly Stage[], via: Projection): Stage[] =>
  stages.map((s): Stage =>
    s.kind === 'projected'
      ? projected(s.inner, thenProject(via, s.via), s.stage)
      : s.kind === 'formula'
        ? {
            ...s,
            done: (cube: Cube) => s.done(via.project(cube)),
            formula: (cube: Cube) => s.formula(via.project(cube)),
          }
        : projected(s, via, s.stage),
  )

const isDone = (stage: Stage, cube: Cube): boolean =>
  stage.kind === 'projected'
    ? isDone(stage.inner, stage.via.project(cube))
    : stage.kind === 'pieces'
      ? targetsOf(stage, cube).every((t) => t.placed(cube))
      : stage.done(cube)

/** A numbered stage's key (a projected one's, its inner's). */
const keyOf = (stage?: { key: string } | ProjectedStage) =>
  !stage ? '' : 'inner' in stage ? stage.inner.key : stage.key

/** A stage's formulas, each sequence whole. */
function recapOf(stage: PieceStage | FigureStage | ProjectedStage): RecapStage {
  const own = 'inner' in stage ? stage.inner : stage
  return { key: own.key, formulas: (own.algorithms ?? []).map((sequence) => sequence.flat()) }
}

/** A cube's piece by its stickers: one a center, two an edge, three a corner. */
const cubeKind = (cubie: Cubie) =>
  cubie.stickers.length === 1 ? 'center' : cubie.stickers.length === 2 ? 'edge' : 'corner'

/** The tutorial a plan makes: the first stage not done where the step
 *  began is the step (the pieces of the stages before kept), and once they
 *  are all done, the stage still to come. */
export function tutorialOf(plan: TutorialPlan): Tutorial {
  const frame = plan.frame ?? CUBE_HOLDS
  const stages = Math.max(
    0,
    ...plan.stages.map((s) => (s.kind === 'formula' ? 0 : s.stage)),
    plan.next?.stage ?? 0,
  )
  const numbered = [
    ...plan.stages.flatMap((s) => (s.kind === 'formula' ? [] : [s])),
    ...(plan.next ? [plan.next] : []),
  ]
  const stageKeys = Array.from({ length: stages }, (_, i) =>
    keyOf(numbered.find((s) => s.stage === i + 1)),
  )
  /** The sticker facing that way of the middle center there (a 5x5's
   *  fixed one, a super cube's with its borders), if the puzzle has one (a
   *  cube's face, along an axis). */
  const centerColor = (cube: Cube, normal: Vec3) =>
    cube
      .filter(
        (c) =>
          normal.filter((n) => n !== 0).length === 1 &&
          c.position.every((v, a) => normal[a] !== 0 || v === 0),
      )
      .flatMap((c) => c.stickers)
      .find((s) => s.normal.join() === normal.join())?.color ?? null
  return {
    frame,
    stages,
    stageKeys,
    recap: plan.stages.flatMap((s) => (s.kind === 'formula' ? [] : [recapOf(s)])),
    openings: plan.stages.flatMap((s) => (s.kind === 'formula' ? [s.key] : [])),
    glossary: plan.glossary ?? [],
    pieceKind: plan.pieceKind ?? cubeKind,
    ...(plan.outside && { outside: plan.outside }),
    ...(plan.holding && { holding: plan.holding }),
    // The plan's own colors first (a 4x4's, its centers not yet one face
    // each), else the center there.
    faceColor: (cube, normal) => {
      const color = plan.faceColor?.(cube, normal) ?? null
      if (color) return { color, center: false }
      const center = centerColor(cube, normal)
      return center ? { color: center, center: true } : null
    },
    stepOf: (cube, begun = cube) => {
      // The pieces kept, on the big puzzle (a projected stage reads them
      // through its own projection: stages may each have theirs).
      let kept: number[] = []
      for (const stage of plan.stages) {
        if (!isDone(stage, begun)) {
          if (stage.kind !== 'projected') return stageStep(stage, frame, cube, begun, kept)
          const { inner, via } = stage
          const small = [...new Set(kept.map((p) => via.down(cube, p)))]
          const step = stageStep(inner, frame, via.project(cube), via.project(begun), small)
          return liftStep(step, via, cube, stage.stage)
        }
        if (stage.kind === 'pieces') kept = [...kept, ...keptBy(stage, begun, cube)]
        if (stage.kind === 'projected' && stage.inner.kind === 'pieces') {
          const small = keptBy(stage.inner, stage.via.project(begun), stage.via.project(cube))
          kept = [...kept, ...small.flatMap((p) => stage.via.up(cube, p))]
        }
      }
      const { next } = plan
      if (!next) return null
      return {
        kind: 'toCome',
        key: next.key,
        stage: next.stage,
        hold: () => next.hold,
        placed: kept,
        suggestion: null,
        pickable: [],
        slots: () => [],
        formula: () => null,
      }
    },
  }
}
