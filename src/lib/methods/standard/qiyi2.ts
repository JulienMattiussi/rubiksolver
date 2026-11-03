import { cubeOrientations, FACE_COLOR, faceColorsOf, solvedCube } from '../../core/cube'
import { invertMoves } from '../../core/moves'
import { layoutKey, recolored } from '../../core/pieces'
import { applyMoves } from '../../core/turn'
import type { Color, Cube, Face } from '../../core/types'
import { solveOptimal2 } from './cube2'

/**
 * The Qiyi 2x2 read as the 2x2 it is: its layers two sizes only, it wears
 * two colors (a face of each its size's), so its corners go by threes of
 * twins, and the all-thick and all-thin ones turn on themselves unseen.
 * The 2x2's methods solve it once each piece is given a 2x2 corner's
 * colors, a choice its quickest solution makes: each piece takes those of
 * the corner it brings it home as, so the 2x2 read is a real one, and as
 * near solved as the puzzle is.
 */

/** A 2x2's colors as the Qiyi 2x2 wears them: each face's its size's. */
const AS_QIYI = new Map<Color, Color>(
  (Object.keys(FACE_COLOR) as Face[]).map((f) => [FACE_COLOR[f], faceColorsOf('qiyi2')[f]]),
)

/** The 24 ways a solved 2x2 can be held. */
let held: readonly Cube[] | undefined

/** The 2x2 a Qiyi 2x2 is, its twins told apart. */
export function asPocket(cube: Cube): Cube {
  const moves = solveOptimal2(cube)
  const solved = layoutKey(applyMoves(cube, moves))
  held ??= cubeOrientations(solvedCube('2'))
  const pocket = held.find((p) => layoutKey(recolored(p, AS_QIYI)) === solved)!
  return applyMoves(pocket, invertMoves(moves))
}
