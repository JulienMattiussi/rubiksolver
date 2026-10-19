import { cubeShape, solvedCube } from '../core/cube'
import type { Cube } from '../core/types'
import type { CubeShape } from '../core/shapes'
import {
  entryOf,
  stepOf,
  togglesOf,
  type Cuts,
  type Parts,
  type StepKind,
  type Toggles,
} from './entry'
import { canvasesOf, type Canvases } from './modes/canvas'
import { fixedJoints, jointsOf, type Joint } from './modes/joints'

/**
 * The steps of an entry run in order, whatever they are: what each holds
 * (`Settings`), as a fresh entry starts it or as a state shows it, and the
 * step after each, the paint last.
 */

/** What the entry holds besides its colors, one field a mode. */
export interface Settings {
  /** Its pieces' joints (modes/joints.ts). */
  readonly joints: readonly Joint[]
  /** Its half-cubies, cell by cell (modes/cuts.ts). */
  readonly cuts: Cuts
  /** Its faces, as its canvases show them (modes/canvas.ts). */
  readonly faces: Canvases
  /** What clicks turned round (modes/toggles.ts). */
  readonly toggles: Toggles
  /** Its parts painted apart (a Gear Cube's gears). */
  readonly parts: Parts
}

/** A fresh entry's settings: as solved. */
export function startSettings(shape: CubeShape): Settings {
  const canvas = stepOf(shape, 'canvas')
  return {
    joints: stepOf(shape, 'joints') ? fixedJoints(shape) : [],
    cuts: stepOf(shape, 'cuts')?.cuts.start() ?? {},
    faces: canvas ? canvasesOf(solvedCube(shape), canvas.faces) : [],
    toggles: {},
    parts: {},
  }
}

/** A state's settings, to enter it as it stands. */
export function settingsOf(cube: Cube): Settings {
  const shape = cubeShape(cube)
  const canvas = stepOf(shape, 'canvas')
  return {
    joints: stepOf(shape, 'joints') ? jointsOf(cube) : [],
    cuts: stepOf(shape, 'cuts')?.cuts.of(cube) ?? {},
    faces: canvas ? canvasesOf(cube, canvas.faces) : [],
    toggles: togglesOf(shape)?.of(cube) ?? {},
    parts: entryOf(shape).paint.parts?.of(cube) ?? {},
  }
}

/** The step after one: the next listed, the paint after the last. */
export function nextStep(shape: CubeShape, step: StepKind): StepKind | 'paint' {
  const steps = entryOf(shape).steps
  return steps[steps.findIndex((s) => s.kind === step) + 1]?.kind ?? 'paint'
}

/** Every part painted apart is painted (none to paint: done). */
export function partsDone(shape: CubeShape, parts: Parts): boolean {
  const spec = entryOf(shape).paint.parts
  if (!spec) return true
  const { done, pieces } = spec.count(parts)
  return done === pieces
}
