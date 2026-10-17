import { FACE_COLOR } from '../core/cube'
import { colorAt, hasColors } from '../core/pieces'
import type { Cube, Face, Vec3 } from '../core/types'
import { crossDone, edgePlaced } from '../methods/standard/layers3'
import { homeOf } from '../methods/standard/pieces3'
import { centersHome, recenter } from '../methods/standard/recenter'
import { OUTER_GENERATORS, search, SIDES } from '../solve/solverKit'
import { cornersDone, cornersStep } from './cube3Corners'
import type { Tutorial, TutorialPick, TutorialStep } from './tutorial'

/**
 * The 3x3's tutorial, layer by layer (the beginner method, its frame: yellow
 * down, white up). First the centers put back if a slice moved them, then
 * the yellow cross: an edge at a time, the shortest way that keeps the
 * edges already placed (a few turns, its corners hatched: placed later);
 * then the yellow corners (cube3Corners.ts). The rest of the solve is still
 * to come.
 */

const Y = FACE_COLOR.D

/** The front center's color: the formulas are written facing it (the
 *  centers home, the frame's front). */
const FRONT = FACE_COLOR.F

/** A cross slot: the edge between the bottom and a side. */
const crossSlot = (s: Face): Vec3 => homeOf(`D${s}`)

const sameAt = (a: Vec3, b: Vec3) => a.join() === b.join()

/** The index of the edge carrying yellow and a side's color. */
const crossEdge = (cube: Cube, s: Face) => cube.findIndex((c) => hasColors(c, [Y, FACE_COLOR[s]]))

/** The centers put back first: all the steps read them as their frame. */
function recenterStep(cube: Cube): TutorialStep {
  return {
    key: 'stepRecenter',
    front: FRONT,
    placed: [],
    suggestion: null,
    pickable: [],
    slots: () => [],
    formula: () => recenter(cube),
  }
}

/** The yellow cross, an edge at a time: any yellow edge not placed, to any
 *  cross slot no placed edge holds, yellow down; the edges placed read
 *  where the step began (`begun`), all brought back. */
function crossStep(cube: Cube, begun: Cube): TutorialStep {
  const placedSides = SIDES.filter((s) => edgePlaced(begun, s))
  const placed = placedSides.map((s) => crossEdge(cube, s))
  const free = SIDES.filter((s) => !placedSides.includes(s))
  const next = free[0]!
  const formula = (pick: TutorialPick | null) => {
    if (!pick) return null
    const colors = cube[pick.piece]!.stickers.map((s) => s.color)
    const goal = (c: Cube) =>
      placedSides.every((s) => edgePlaced(c, s)) &&
      c.some((p) => hasColors(p, colors) && sameAt(p.position, pick.slot) && colorAt(p, 'D') === Y)
    return search(cube, goal, OUTER_GENERATORS, 8)
  }
  return {
    key: 'stepTutorialCross',
    stage: 1,
    progress: { done: placedSides.length, total: SIDES.length },
    front: FRONT,
    marker: Y,
    placed,
    suggestion: { piece: crossEdge(cube, next), slot: crossSlot(next) },
    pickable: free.map((s) => crossEdge(cube, s)),
    slots: () => free.map(crossSlot),
    formula,
  }
}

/** What comes after the first layer, not taught yet. */
const comingSoon = (placed: number[]): TutorialStep => ({
  key: 'stepMiddle',
  stage: 3,
  front: FRONT,
  placed,
  suggestion: null,
  pickable: [],
  slots: () => [],
  formula: () => null,
  comingSoon: true,
})

export const CUBE3_TUTORIAL: Tutorial = {
  // The stage is the one the step began in.
  stepOf: (cube, begun = cube) => {
    if (!centersHome(begun)) return recenterStep(cube)
    if (!crossDone(begun)) return crossStep(cube, begun)
    const cross = SIDES.map((s) => crossEdge(cube, s))
    if (!cornersDone(begun)) return cornersStep(cube, begun, cross)
    return comingSoon(cross)
  },
}
