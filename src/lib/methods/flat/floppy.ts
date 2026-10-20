import { parseMoves } from '../../core/notation'

/**
 * Floppy (3x3x1), "corners then edges", as taught on fan2cube.fr (floppy1):
 * a 3x3 one layer tall. Its sides only take half turns, so the edges never
 * leave their spot (a half turn just flips the one it carries) and only the
 * corners travel; 192 states in all. The method is its tutorial's
 * (lib/tutorials/flat/floppy.ts): the corners placed with plain half
 * turns, then the edges flipped two at a time by this formula.
 */

/** Flips the F and R edges, nothing else (asserted in tests/unit/puzzles/flat/floppy.test.ts). */
export const FLIP_EDGES = parseMoves('F2 R2 F2 R2 F2 R2')
