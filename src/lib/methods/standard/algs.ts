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
/** Ub-perm: the other pure 3-cycle of last-layer edges (fan2cube's E,
 *  D.(DH)²(D'H')².D'HD': (HG) -> (HD) -> (HA)). */
export const PLL_UB = "R2 U R U R' U' R' U' R' U R'"

// The commutators fan2cube builds its cube formulas from, and those
// formulas (shared by the bandaged cubes, the Tori, the Void Cube, the
// Barrel, the VTO and the 3x3 tutorial). fan2cube's letters: H = U,
// D = R, A = F, G = L, B = D, P = B.

/** [HD]: the right trigger seen from above ((HDA) -> (BAD)). */
export const COMM_UR = "U R U' R'"
/** [H'A']: the front one, the other way. */
export const COMM_UF_BACK = "U' F' U F"
/** [HA]: the front one ((HAG) -> (BGA)). */
export const COMM_UF = "U F U' F'"
/** [AD']: the front and right faces ((HDA) -> (BAD)). */
export const COMM_FR = "F R' F' R"
/** [HD][H'A']: a top edge inserted at front right (the F2L's). */
export const INSERT_RIGHT = `${COMM_UR} ${COMM_UF_BACK}`
/** [H'A'][HD]: the same, from the other side. */
export const INSERT_RIGHT_BACK = `${COMM_UF_BACK} ${COMM_UR}`
/** DHD'H.DH²D'H²: three top corners twisted (and three top edges cycled):
 *  the Sune, the top turned back. */
export const SUNE_BACK = `${SUNE} U2`
/** J = A[DH]A'H: the top edges placed (J² turns them): the OLL edge flip,
 *  the top turned after. */
export const OLL_EDGE_TURN = `${OLL_EDGE} U`
/** [AD'].G[D'A]G': (HAG) -> (HGP) -> (HPD), three top corners cycled. */
export const CORNER_CYCLE = "F R' F' R L R' F R F' L'"
/** [AD']².G[D'A]².G': (HAG)- (HGP)+, two top corners twisted. */
export const CORNER_TWIST_PAIR = "F R' F' R F R' F' R L R' F R F' R' F R F' L'"
