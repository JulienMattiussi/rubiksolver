import { FACE_SPEC } from '../../core/geometry'
import { FACES } from '../../core/moves'
import { applyMove } from '../../core/turn'
import type { Cube, Cubie, Face, Move } from '../../core/types'

/**
 * The Quarter Cube (fan2cube.fr/quarter1, Katsuhiko Okamoto and Takafumi
 * Haseda, 2011): a 3x3 whose faces only turn by alternate quarter turns:
 * from where it stands, a face goes a quarter clockwise (A), then must come
 * back (A'), never two quarters the same way (no A², no A'²). Each center
 * wears a mark that shows where its face stands. In the model that is the
 * center's `spin`: 0 where its clockwise quarter goes (the page's START),
 * 1 a quarter on, where only the way back goes; every quarter turn of the
 * face changes it (turn.ts).
 */

/** The solved Quarter Cube: a 3x3, every face where it turns clockwise. */
export const withFaceMarks = (cube: Cube): Cube =>
  cube.map((c) => (c.stickers.length === 1 ? { ...c, spin: 0 } : c))

/** The center of a face, which says where it stands. */
const centerOf = (cube: Cube, face: Face): Cubie | undefined => {
  const { coordIndex, dir } = FACE_SPEC[face]
  return cube.find(
    (c) =>
      c.stickers.length === 1 &&
      c.position.every((v, a) => (a === coordIndex ? v === dir : v === 0)),
  )
}

/** Whether a turn goes: a face's quarter turn the way its mark allows. */
export function quarterTurns(cube: Cube, move: Move): boolean {
  if (move.depth || move.amount === 2) return false
  const spin = centerOf(cube, move.face)?.spin ?? 0
  return move.amount === (spin === 0 ? 1 : 3)
}

/** The turn a face can make now. */
const quarterMove = (cube: Cube, face: Face): Move => ({
  face,
  amount: (centerOf(cube, face)?.spin ?? 0) === 0 ? 1 : 3,
})

/** A Quarter Cube with these faces a quarter on (by their center's slot). */
export const withTurnedFaces = (cube: Cube, turned: readonly string[]): Cube =>
  withFaceMarks(cube).map((c) =>
    c.spin === undefined ? c : { ...c, spin: turned.includes(c.position.join(',')) ? 1 : 0 },
  )

/** A Quarter Cube's scramble: faces at random, never the same twice in a
 *  row, each the way its mark allows (quarter.ts), played along. */
export function scrambleQuarter(length: number, rng: () => number, start: Cube): Move[] {
  let state = start
  const moves: Move[] = []
  while (moves.length < length) {
    const choices = FACES.filter((f) => f !== moves[moves.length - 1]?.face)
    const move = quarterMove(state, choices[Math.floor(rng() * choices.length)]!)
    state = applyMove(state, move)
    moves.push(move)
  }
  return moves
}
