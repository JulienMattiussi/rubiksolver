import type { HoldFrame } from '../../core/hold'
import { FACE_NORMAL } from '../../core/geometry'
import { isRainbowMove, type Face, type Turn, type Vec3 } from '../../core/types'
import { RAINBOW_CORNERS, RAINBOW_TRIANGLES } from '../../puzzles/shared/rainbow'

/**
 * The ways to hold a Skewb, its top center up: a side in front, each hold
 * the next round the top (the puzzle turned a quarter about it, the right
 * side brought in front), named by the side in front. A turn read in a
 * hold names its corner where it stands; the formulas are written in the
 * first (the front side in front, its top right corner `A`).
 */

const HOLDS: readonly Face[] = ['F', 'R', 'B', 'L']

/** A quarter about the vertical: the front brought to the right. */
const quarter = ([x, y, z]: Vec3): Vec3 => [z, y, -x + 0]

const turnedBy = (v: Vec3, k: number): Vec3 => (k === 0 ? v : turnedBy(quarter(v), k - 1))

/** A turn's corner moved round the top by `k` quarters. */
const relabeled = (turn: Turn, k: number): Turn => {
  if (!isRainbowMove(turn)) return turn
  const d = turnedBy(RAINBOW_CORNERS[turn.triangle], k).join()
  return { ...turn, triangle: RAINBOW_TRIANGLES.find((t) => RAINBOW_CORNERS[t].join() === d)! }
}

const quarters = (hold: string) => HOLDS.indexOf(hold as Face)

/** The hold with a top corner in front, on the right (where the formulas'
 *  `A` stands). */
export const holdAt = (corner: Vec3): Face =>
  HOLDS.find((_, k) => turnedBy(RAINBOW_CORNERS.U, k).join() === corner.join())!

export const SKEWB_HOLDS: HoldFrame = {
  holds: HOLDS,
  front: (hold) => FACE_NORMAL[hold as Face],
  down: FACE_NORMAL.D,
  played: (hold, turn) => relabeled(turn, quarters(hold)),
  inHold: (hold, turn) => relabeled(turn, (4 - quarters(hold)) % 4),
}
