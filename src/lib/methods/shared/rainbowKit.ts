import { vecKey } from '../../core/geometry'
import { colorsOf } from '../../core/pieces'
import { RAINBOW_CORNERS, RAINBOW_TRIANGLES } from '../../puzzles/shared/rainbow'
import type { Color, Cube, RainbowMove } from '../../core/types'
import { permutationIsOdd } from '../../solve/permutation'
import { heldEveryWay } from '../../solve/everyWay'
import { holdingsOf } from '../../solve/holdings'

/**
 * What the Rainbow, the Dino Cube and the Rex Cube methods share: their
 * formulas seen from every side, and, for the last two (nothing fixed, two
 * ways to solve), the solved puzzles they may aim at and the parity a
 * 3-cycle keeps.
 */

/** A formula as seen holding the puzzle each way: its triangles carried by
 *  the whole-puzzle turn. */
export const fromEverySide = (moves: readonly RainbowMove[]): RainbowMove[][] =>
  heldEveryWay(moves, (m, by) => {
    const d = by(RAINBOW_CORNERS[m.triangle])
    const triangle = RAINBOW_TRIANGLES.find((t) => vecKey(RAINBOW_CORNERS[t]) === vecKey(d))!
    return { ...m, triangle }
  })

/** Every solved puzzle: as it is and its mirror (left and right swapped,
 *  orange and red), each held every way. */
export function heldTargets(solved: Cube): Cube[] {
  const swap = (c: Color): Color => (c === 'O' ? 'R' : c === 'R' ? 'O' : c)
  const mirror = solved.map((c) => ({
    ...c,
    stickers: c.stickers.map((s) => ({ ...s, color: swap(s.color) })),
  }))
  return [solved, mirror].flatMap((cube) => holdingsOf(cube))
}

/** Whether sending each piece to its home (the slot of its colors) is an
 *  even permutation: what 3-cycles can do. */
export function isEven(pieces: Cube, home: Map<string, string>): boolean {
  return !permutationIsOdd(new Map(pieces.map((c) => [vecKey(c.position), home.get(colorsOf(c))!])))
}
