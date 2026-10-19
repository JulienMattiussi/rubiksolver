import { AXIS_ROTATIONS, FACE_NORMAL, faceOfNormal } from '../core/geometry'
import { formatMoves, invertMoves } from '../core/moves'
import type { Face, Turn, Vec3 } from '../core/types'

/**
 * A formula as seen holding the puzzle each way: each of its turns carried
 * by a whole-puzzle rotation onto the layer it then turns. How a rotation
 * renames a turn is its kind's (a face's, a triangle's, an edge's...); the
 * rest is shared by every method that plays its page's formulas "from every
 * side".
 */

/** A whole-puzzle rotation, on integer vectors. */
export type Rotation = (v: Vec3) => Vec3

export interface EveryWay {
  /** Each followed by its inverse. */
  readonly inverses?: boolean
  /** The same formula once (told by its notation). */
  readonly once?: boolean
  /** The rotations (by default, the cube's 24). */
  readonly rotations?: readonly Rotation[]
}

/** `formula` held each way, its turns carried by `turned`. */
export function heldEveryWay<T extends Turn>(
  formula: readonly T[],
  turned: (turn: T, by: Rotation) => T,
  { inverses = false, once = false, rotations = AXIS_ROTATIONS }: EveryWay = {},
): T[][] {
  const seen = new Set<string>()
  return rotations.flatMap((by) => {
    const held = formula.map((turn) => turned(turn, by))
    if (once) {
      const key = formatMoves(held)
      if (seen.has(key)) return []
      seen.add(key)
    }
    return inverses ? [held, invertMoves(held)] : [held]
  })
}

/** Each formula set up by each setup, undone after (X F X'): it acts
 *  elsewhere. */
export const conjugated = <T extends Turn>(
  formulas: readonly (readonly T[])[],
  setups: readonly (readonly T[])[],
): T[][] => setups.flatMap((x) => formulas.map((f) => [...x, ...f, ...invertMoves(x)]))

/** A face, carried by a rotation. */
export const turnedFace = (face: Face, by: Rotation): Face => faceOfNormal(by(FACE_NORMAL[face]))
