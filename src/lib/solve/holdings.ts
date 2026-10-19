import { AXIS_ROTATIONS } from '../core/geometry'
import { poseOf } from '../core/pieces'
import type { Cube, Cubie } from '../core/types'
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
