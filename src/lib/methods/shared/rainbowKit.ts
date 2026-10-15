import { AXIS_ROTATIONS, vecKey } from '../../core/geometry'
import { colorsOf } from '../../core/pieces'
import { RAINBOW_CORNERS, RAINBOW_TRIANGLES } from '../../puzzles/shared/rainbow'
import type { Color, Cube, RainbowMove } from '../../core/types'

/**
 * What the Rainbow, the Dino Cube and the Rex Cube methods share: their
 * formulas seen from every side, and, for the last two (nothing fixed, two
 * ways to solve), the solved puzzles they may aim at and the parity a
 * 3-cycle keeps.
 */

/** A formula as seen holding the puzzle each way: its triangles carried by
 *  the whole-puzzle turn. */
export function fromEverySide(moves: readonly RainbowMove[]): RainbowMove[][] {
  return AXIS_ROTATIONS.map((turn) =>
    moves.map((m) => {
      const d = turn(RAINBOW_CORNERS[m.triangle])
      const triangle = RAINBOW_TRIANGLES.find((t) => vecKey(RAINBOW_CORNERS[t]) === vecKey(d))!
      return { ...m, triangle }
    }),
  )
}

/** Every solved puzzle: as it is and its mirror (left and right swapped,
 *  orange and red), each held every way. */
export function heldTargets(solved: Cube): Cube[] {
  const swap = (c: Color): Color => (c === 'O' ? 'R' : c === 'R' ? 'O' : c)
  const mirror = solved.map((c) => ({
    ...c,
    stickers: c.stickers.map((s) => ({ ...s, color: swap(s.color) })),
  }))
  return [solved, mirror].flatMap((cube) =>
    AXIS_ROTATIONS.map((turn) =>
      cube.map((c) => ({
        position: turn(c.position),
        stickers: c.stickers.map((s) => ({ normal: turn(s.normal), color: s.color })),
      })),
    ),
  )
}

/** Whether sending each piece to its home (the slot of its colors) is an
 *  even permutation: what 3-cycles can do. */
export function isEven(pieces: Cube, home: Map<string, string>): boolean {
  const to = new Map(pieces.map((c) => [vecKey(c.position), home.get(colorsOf(c))!]))
  const seen = new Set<string>()
  let swaps = 0
  for (const start of to.keys()) {
    let at = start
    let length = 0
    while (!seen.has(at)) {
      seen.add(at)
      at = to.get(at)!
      length++
    }
    swaps += Math.max(0, length - 1)
  }
  return swaps % 2 === 0
}
