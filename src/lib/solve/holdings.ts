import { solvedCube } from '../core/cube'
import { AXIS_ROTATIONS, FACE_NORMAL, faceOfNormal } from '../core/geometry'
import { SHAPE_DIMS, type CubeShape } from '../core/shapes'
import { poseOf } from '../core/pieces'
import { isFaceMove, type Cube, type Cubie, type Turn, type Vec3 } from '../core/types'
import type { Rotation } from './everyWay'

/**
 * The ways a puzzle may be held, and which one its fixed pieces say: many
 * methods read their goal on the solved puzzle as the pieces that never
 * leave their place show it held (the Gear Cube's corners, the FTO's, a
 * Dino Cylinder's).
 */

/** A puzzle turned whole by a rotation. */
const turnedWhole = (cube: Cube, by: Rotation): Cube =>
  cube.map((c) => ({
    ...c,
    position: by(c.position),
    stickers: c.stickers.map((s) => ({ ...s, normal: by(s.normal) })),
  }))

/** A puzzle held each way (by default, the cube's 24 rotations). */
export const holdingsOf = (cube: Cube, rotations: readonly Rotation[] = AXIS_ROTATIONS): Cube[] =>
  rotations.map((by) => turnedWhole(cube, by))

/** The holdings whose pieces `fixed` stand as the state's at their places,
 *  compared by `look` (by default, all their stickers). */
export function holdingsShowing(
  holdings: readonly Cube[],
  cube: Cube,
  fixed: (c: Cubie) => boolean,
  look: (c: Cubie) => string = poseOf,
): Cube[] {
  const at = new Map(cube.filter(fixed).map((c) => [c.position.join(), look(c)]))
  return holdings.filter((h) => h.filter(fixed).every((c) => at.get(c.position.join()) === look(c)))
}

/** The holding where most of a puzzle's pieces already stand as solved,
 *  among those its box allows (a 2x2x4 tower keeps its long side upright,
 *  either way up): how a puzzle with no piece telling how it is held is
 *  read where it stands. The first one, the puzzle as it is, on a tie. */
export function bestHolding(cube: Cube, shape: CubeShape): Rotation {
  const dims = SHAPE_DIMS[shape]
  const at = (c: Cubie) => `${c.position.join()}:${poseOf(c)}`
  const solved = new Set(solvedCube(shape).map(at))
  const axes: Vec3[] = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ]
  const fits = (by: Rotation) =>
    axes.every((e, a) => dims[by(e).findIndex((x) => x !== 0)] === dims[a])
  const home = (by: Rotation) => turnedWhole(cube, by).filter((c) => solved.has(at(c))).length
  return AXIS_ROTATIONS.filter(fits).reduce((best, by) => (home(by) > home(best) ? by : best))
}

/** A turn of a puzzle held as `by` turned it, named for the puzzle as it
 *  stands: the face that was there. */
export function turnBack(turn: Turn, by: Rotation): Turn {
  if (!isFaceMove(turn)) return turn
  const n = FACE_NORMAL[turn.face].join()
  const was = Object.values(FACE_NORMAL).find((m) => by(m).join() === n)!
  return { ...turn, face: faceOfNormal(was) }
}
