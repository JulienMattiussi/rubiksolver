import type { Cube, Vec3 } from '../core/types'
import type { TutorialPick, TutorialStep } from './tutorial'

/**
 * A big puzzle read as a small one (a reduced 4x4 as a 3x3): the small
 * tutorial's stages play on the projection, and their steps are lifted back
 * onto the big puzzle, a small piece standing for the big ones it is made of
 * (an edge for its two wings, a center for its four), a small place for the
 * big places that make it. Its turns are the same on both.
 */
export interface Projection {
  /** The state as the small puzzle, its pieces always in the same order. */
  readonly project: (cube: Cube) => Cube
  /** The big pieces a small one is made of, and the small one a big piece
   *  belongs to (both read on the big state). */
  readonly up: (cube: Cube, piece: number) => number[]
  readonly down: (cube: Cube, piece: number) => number
  /** The big places a small place is made of, and the small place a big one
   *  belongs to. */
  readonly upSlots: (slot: Vec3) => Vec3[]
  readonly downSlot: (slot: Vec3) => Vec3
}

/** A projection read through another first (a Super Revenge as a 4x4, then
 *  as a 3x3): `outer` from the big puzzle to the middle one, `inner` from
 *  there to the small one. */
export function thenProject(outer: Projection, inner: Projection): Projection {
  return {
    project: (cube) => inner.project(outer.project(cube)),
    up: (cube, piece) => inner.up(outer.project(cube), piece).flatMap((p) => outer.up(cube, p)),
    down: (cube, piece) => inner.down(outer.project(cube), outer.down(cube, piece)),
    upSlots: (slot) => inner.upSlots(slot).flatMap(outer.upSlots),
    downSlot: (slot) => inner.downSlot(outer.downSlot(slot)),
  }
}

/** A puzzle read as another with the same pieces where they stand (a super
 *  cube without its centers' borders): `project` alone changes them. Its
 *  projection is the same object for the same state (once each), so what
 *  the small puzzle's stages keep by state carries over. */
export function samePieces(project: (cube: Cube) => Cube): Projection {
  const seen = new WeakMap<Cube, Cube>()
  return {
    project: (cube) => {
      let small = seen.get(cube)
      if (!small) {
        small = project(cube)
        seen.set(cube, small)
      }
      return small
    },
    up: (_, piece) => [piece],
    down: (_, piece) => piece,
    upSlots: (slot) => [slot],
    downSlot: (slot) => slot,
  }
}

/** A small step lifted onto the big puzzle (`cube`), as stage `stage`. */
export function liftStep(
  step: TutorialStep,
  via: Projection,
  cube: Cube,
  stage: number,
): TutorialStep {
  const up = (pieces: readonly number[]) => pieces.flatMap((p) => via.up(cube, p))
  const down = (pick: TutorialPick | null): TutorialPick | null =>
    pick && { piece: via.down(cube, pick.piece), slot: via.downSlot(pick.slot) }
  const { suggestion } = step
  return {
    ...step,
    stage,
    hold: (pick) => step.hold(down(pick)),
    placed: up(step.placed),
    suggestion: suggestion && {
      piece: via.up(cube, suggestion.piece)[0]!,
      slot: via.upSlots(suggestion.slot)[0]!,
    },
    pickable: up(step.pickable),
    slots: (piece) => step.slots(via.down(cube, piece)).flatMap(via.upSlots),
    formula: (pick) => step.formula(down(pick)),
    ...(step.focus && { focus: up(step.focus) }),
    ...(step.subjects && { subjects: up(step.subjects) }),
  }
}
