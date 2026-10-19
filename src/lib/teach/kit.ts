import { CUBE_HOLDS, type Hold, type HoldFrame } from '../core/hold'
import type { Color, Cube, Cubie, Vec3 } from '../core/types'
import { liftStep, type Projection } from './project'
import {
  keptBy,
  stageStep,
  targetsOf,
  type FigureStage,
  type FormulaStage,
  type PieceStage,
} from './stages'
import type { Term, Tutorial } from './tutorial'

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
  /** See `Tutorial.pieceKind` (by default, a cube's) and `holding`. */
  readonly pieceKind?: (cubie: Cubie) => string
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

type Stage = PieceStage | FormulaStage | FigureStage | ProjectedStage

/** A stage as a plan lists it: its own, or a small puzzle's projected. */
export const projected = (
  inner: PieceStage | FigureStage,
  via: Projection,
  stage: number,
): ProjectedStage => ({ kind: 'projected', stage, inner, via })

const isDone = (stage: Stage, cube: Cube): boolean =>
  stage.kind === 'projected'
    ? isDone(stage.inner, stage.via.project(cube))
    : stage.kind === 'pieces'
      ? targetsOf(stage, cube).every((t) => t.placed(cube))
      : stage.done(cube)

/** A numbered stage's key (a projected one's, its inner's). */
const keyOf = (stage?: { key: string } | ProjectedStage) =>
  !stage ? '' : 'inner' in stage ? stage.inner.key : stage.key

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
  /** The center sticker facing that way, if the puzzle has one. */
  const centerColor = (cube: Cube, normal: Vec3) =>
    cube.find((c) => c.stickers.length === 1 && c.stickers[0]!.normal.join() === normal.join())
      ?.stickers[0]!.color ?? null
  return {
    frame,
    stages,
    stageKeys,
    glossary: plan.glossary ?? [],
    pieceKind: plan.pieceKind ?? cubeKind,
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
      // The pieces kept, the big puzzle's and its projection's.
      let kept: number[] = []
      let keptSmall: number[] = []
      for (const stage of plan.stages) {
        if (!isDone(stage, begun)) {
          if (stage.kind !== 'projected') return stageStep(stage, frame, cube, begun, kept)
          const { inner, via } = stage
          const step = stageStep(inner, frame, via.project(cube), via.project(begun), keptSmall)
          return liftStep(step, via, cube, stage.stage)
        }
        if (stage.kind === 'pieces') kept = [...kept, ...keptBy(stage, begun, cube)]
        if (stage.kind === 'projected' && stage.inner.kind === 'pieces') {
          const small = keptBy(stage.inner, stage.via.project(begun), stage.via.project(cube))
          keptSmall = [...keptSmall, ...small]
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
