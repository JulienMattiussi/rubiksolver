import { FACE_NORMAL, FACE_SPEC } from '../../core/geometry'
import type { Cube, Dims, Move } from '../../core/types'

/**
 * The 2x3x4 tower (fan2cube.fr/tower2341, MF8, 2012): 3 wide, 4 high, 2
 * deep. Its left and right columns turn by quarters: a column 4 high and 2
 * deep then stands 2 high and 4 deep, sticking out in front and behind, and
 * the tower changes shape. Its layers and its front and back halves only
 * turn by halves; a layer only when it is whole, as on the 2x2x4.
 *
 * Model: the 3x4x2's grid (x -1, 0, 1; y -3 to 3; z -1, 1), each piece a
 * cube 1 across on x and 2 on y and z, so that a column turned a quarter
 * puts its pieces at y -1 or 1 and z -3 to 3. Its mechanism
 * (`TOWER234_MECHANISM`) cuts z as it does y, at 0 and +-2.
 */

export const TOWER234_MECHANISM: Dims = [3, 4, 4]

/** Whether a turn can go, on the 2x2x4 tower's principles: a column or a
 *  half always turns, a layer (or the slice beside it, the half less the
 *  layer) only when that layer is whole, its six pieces upright in place. */
export function tower234Turns(cube: Cube, move: Move): boolean {
  if (FACE_SPEC[move.face].coordIndex !== 1 || move.wide) return true
  const side = FACE_NORMAL[move.face][1]
  const layer = cube.filter((c) => c.position[1] * side === 3)
  return layer.length === 6 && layer.every((c) => Math.abs(c.position[2]) === 1)
}

/** Whether it stands in its box: its columns upright, 2 deep. */
export const tower234Boxed = (cube: Cube): boolean =>
  cube.every((c) => Math.abs(c.position[2]) <= 1)
