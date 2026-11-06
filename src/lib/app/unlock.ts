import { cubeShape } from '../core/cube'
import type { CubeShape } from '../core/shapes'
import type { Cube } from '../core/types'
import { MODELS } from '../puzzles/models'
import { proveSolvable } from '../solve/solver'

/**
 * The unlocked mode a puzzle may have (PuzzleModel.unlocked: the Floppy's
 * quarter turns, which the real puzzle makes): turned on by the user, back
 * off once the puzzle is reset.
 */

/** Whether a puzzle has an unlocked mode. */
export const canUnlock = (shape: CubeShape): boolean => !!MODELS[shape]?.unlocked

/** Whether a state is out of the shape the locked turns keep (a row stood
 *  up): the editor cannot enter it. */
export function outOfShape(cube: Cube): boolean {
  const unlocked = MODELS[cubeShape(cube)]?.unlocked
  return !!unlocked && !unlocked.inShape(cube)
}

/** Whether a state needs the mode on: out of the shape its locked turns
 *  keep (a row stood up), or beyond their reach (one edge flipped alone). */
export function needsUnlock(cube: Cube): boolean {
  if (!canUnlock(cubeShape(cube))) return false
  if (outOfShape(cube)) return true
  try {
    proveSolvable(cube)
    return false
  } catch {
    return true
  }
}
