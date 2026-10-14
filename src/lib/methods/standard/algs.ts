/**
 * The algorithm catalogue: every fixed sequence a method applies, written for
 * front = F (solvers remap them per side with `relMoves` / `atEverySide`).
 * Keeping them in one place, each named as the cubing literature names it,
 * is what lets a method be checked against its sources. Each one's effect is
 * asserted in tests/unit/puzzles/standard/algs.test.ts.
 */

/** OLL edge flip: orients the last-layer edges (the "top cross"). */
export const OLL_EDGE = "F R U R' U' F'"
/** Sune: twists three last-layer corners (and cycles three edges). */
export const SUNE = "R U R' U R U2 R'"
/** Antisune: the mirror twist. */
export const ANTISUNE = "R U2 R' U' R U' R'"
/** Aa-perm: pure 3-cycle of last-layer corners. */
export const PLL_AA = "R' F R' B2 R F' R' B2 R2"
/** Ua-perm: pure 3-cycle of last-layer edges. */
export const PLL_UA = "R U' R U R U R U' R' U' R2"
/** T-perm: swaps two adjacent corners (and two edges). */
export const PLL_T = "R U R' U' R' F R2 U' R' U' R U R' F'"
/** Y-perm: swaps two diagonal corners (and two edges). */
export const PLL_Y = "F R U' R' U' R U R' F' R U R' U' R' F R F'"
/** Niklas: 3-cycle of last-layer corners that leaves every edge alone. */
export const NIKLAS = "R U' L' U R' U' L U"
/** CMLL adjacent corner swap (2-look CMLL, Roux): edges may move, F2B stays. */
export const CMLL_ADJACENT = "R U2 R' U' R U2 L' U R' U' L"
