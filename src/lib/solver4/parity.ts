import { colorsOf, solvedCube } from '../cube'
import { applyMoves } from '../turn'
import { parseMoves } from '../moves'
import { edgeOriented } from '../methods/pieces3'
import { to3x3 } from './project'
import type { Color, Cube, Cubie, Move } from '../types'

/**
 * 4x4 parities. A reduced 4x4 can project onto a 3x3 state that no legal 3x3
 * reaches: a single composite edge flipped (OLL parity) or two composite
 * edges swapped (PLL parity). Both are perfectly legal 4x4 states, detected
 * here by deterministic invariants of the projection and corrected by the two
 * standard slice algorithms BEFORE the 3x3 phase, so the existing 3x3 solvers
 * then run without surprises. A corner twist, by contrast, is impossible on
 * any legal cube and makes this module throw (validation relies on it).
 */

// Flips the UF composite edge in place (wings swapped), everything else -
// centers included - restored. Slice form of r2 B2 U2 l U2 r' U2 r U2 F2 r F2 l' B2 r2.
const OLL_PARITY = parseMoves("2R2 B2 U2 2L U2 2R' U2 2R U2 F2 2R F2 2L' B2 2R2")
// Swaps the UF and UB composite edges without flipping them. Slice form of
// r2 U2 r2 Uw2 r2 u2.
const PLL_PARITY = parseMoves('2R2 U2 2R2 Uw2 2R2 2U2')

function isWY(color: Color): boolean {
  return color === 'W' || color === 'Y'
}

/**
 * Count of misoriented edges, mod 2 (orientation on the F/B axis, see
 * `edgeOriented`). U/D/R/L turns keep every edge oriented and F/B quarter
 * turns flip exactly four, so the count stays even on any legal 3x3; an odd
 * count is the 4x4 OLL parity.
 */
export function edgeFlipParity(cube3: Cube): number {
  return cube3.filter((c) => c.stickers.length === 2 && !edgeOriented(c)).length % 2
}

function posKey(c: Cubie): string {
  return c.position.join(',')
}

/** Sign of the permutation sending each piece's home slot to its current slot. */
function permutationSign(cube3: Cube, stickers: number): 1 | -1 {
  const home = new Map<string, number>()
  const solvedPieces = SOLVED_3.filter((c) => c.stickers.length === stickers)
  solvedPieces.forEach((c, i) => home.set(colorsOf(c), i))
  const slotOf = new Map<string, number>()
  solvedPieces.forEach((c, i) => slotOf.set(posKey(c), i))
  const perm: number[] = []
  for (const c of cube3) {
    if (c.stickers.length !== stickers) continue
    const slot = slotOf.get(posKey(c))
    const piece = home.get(colorsOf(c))
    if (slot === undefined || piece === undefined) {
      throw new Error('permutationSign: unknown piece or slot')
    }
    perm[slot] = piece
  }
  let inversions = 0
  for (let i = 0; i < perm.length; i++) {
    for (let j = i + 1; j < perm.length; j++) if (perm[i]! > perm[j]!) inversions++
  }
  return inversions % 2 === 0 ? 1 : -1
}

const SOLVED_3 = solvedCube('3')

/**
 * On a legal 3x3 every quarter turn 4-cycles corners and edges together, so
 * the two permutation signs always match; a mismatch is the 4x4 PLL parity.
 */
export function permSignsMatch(cube3: Cube): boolean {
  return permutationSign(cube3, 3) === permutationSign(cube3, 2)
}

/**
 * Corner twist: steps from the y axis to the corner's W/Y sticker axis in the
 * cyclic order of axes around the corner's outward diagonal (its handedness is
 * the sign of x*y*z). Legal cubes sum to 0 mod 3; anything else is a twisted
 * corner, i.e. an unsolvable cube.
 */
export function cornerTwistSum(cube3: Cube): number {
  let sum = 0
  for (const c of cube3) {
    if (c.stickers.length !== 3) continue
    const wy = c.stickers.find((s) => isWY(s.color))
    if (!wy) throw new Error('cornerTwistSum: corner without a W/Y sticker')
    const axis = wy.normal[0] !== 0 ? 0 : wy.normal[1] !== 0 ? 1 : 2
    const handedness = c.position[0] * c.position[1] * c.position[2]
    const cycle = handedness > 0 ? [1, 2, 0] : [1, 0, 2]
    sum += cycle.indexOf(axis)
  }
  return sum % 3
}

/**
 * Detect and fix both 4x4 parities on a reduced cube; throws on a twisted
 * corner (unsolvable) and asserts the fixes landed. Returns the applied moves.
 */
export function fixParities(cube4: Cube): Move[] {
  const all: Move[] = []
  let state = cube4
  let v = to3x3(state)
  if (cornerTwistSum(v) !== 0) throw new Error('fixParities: twisted corner (unsolvable cube)')
  if (edgeFlipParity(v) === 1) {
    state = applyMoves(state, OLL_PARITY)
    all.push(...OLL_PARITY)
    v = to3x3(state)
  }
  if (!permSignsMatch(v)) {
    state = applyMoves(state, PLL_PARITY)
    all.push(...PLL_PARITY)
    v = to3x3(state)
  }
  if (edgeFlipParity(v) === 1 || !permSignsMatch(v)) {
    throw new Error('fixParities: parity fix failed')
  }
  return all
}
