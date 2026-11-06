import { parseMoves } from '../../core/notation'

/**
 * Floppy (3x3x1): a 3x3 one layer tall. Its sides only take half turns, so
 * the edges never leave their spot (a half turn just flips the one it
 * carries) and only the corners travel; 192 states in all. Both its
 * methods are its tutorials' (lib/tutorials/flat/):
 *
 *   Edges then corners   its manual's (QiYi, floppyEdgesFirst.ts): the
 *                        cross, each flipped edge by a half turn of its own
 *                        side, then the corners by `CORNER_FORMULAS`, which
 *                        leave the edges as they are. Edges right, the
 *                        corners stand an even permutation away from
 *                        solved: two placed, all are.
 *   Corners then edges   fan2cube.fr's (floppy1, floppy.ts): the corners
 *                        placed with plain half turns, then the edges
 *                        flipped two at a time by `FLIP_EDGES`.
 */

/** Flips the F and R edges, nothing else (asserted in tests/unit/puzzles/flat/floppy.test.ts). */
export const FLIP_EDGES = parseMoves('F2 R2 F2 R2 F2 R2')

/** The manual's formulas, each cycling three corners and leaving the edges
 *  (asserted in tests): the first corner brought to the front right from
 *  the front left, the back left or the back right; the second from the
 *  back right or the back left, the first one kept on the front left. */
export const CORNER_FORMULAS = [
  'F2 R2 F2 R2',
  'F2 L2 F2 L2',
  'R2 F2 R2 F2',
  'B2 R2 B2 R2',
  'R2 B2 R2 B2',
].map((alg) => parseMoves(alg))
