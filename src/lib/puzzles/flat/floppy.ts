import type { Cube, Face } from '../../core/types'

/**
 * The Floppy (3x3x1): its sides turn by half turns, the real puzzle's
 * quarter turns only once unlocked (a mode the user turns on). A quarter
 * turn stands a row up, out of the plate: so it turns on a 3x3x3's
 * mechanism, its nine pieces the middle layer's, its top and bottom never
 * turning (no axle there).
 */

const SIDES: readonly Face[] = ['L', 'R', 'F', 'B']

/** Half turns of its sides only, its top and bottom none. */
export const floppyAmounts = (face: Face): readonly (1 | 2 | 3)[] =>
  SIDES.includes(face) ? [2] : []

/** Unlocked: every turn of its sides. */
export const unlockedAmounts = (face: Face): readonly (1 | 2 | 3)[] =>
  SIDES.includes(face) ? [1, 2, 3] : []

/** Flat as its half turns keep it: every piece in the plate, lying (a
 *  sticker up or down: an edge turned a quarter stands on its side). */
export const lyingFlat = (cube: Cube): boolean =>
  cube.every((c) => c.position[1] === 0 && c.stickers.some((s) => s.normal[1] !== 0))
