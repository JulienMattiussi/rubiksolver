import type { HoldFrame } from '../../core/hold'
import { mapVec } from '../../core/geometry'
import { isPyraMove, type PyraVertex, type Turn } from '../../core/types'
import { AROUND_TOP } from '../../methods/pyramid/pyraKit'
import { PYRA_CORNERS } from '../../puzzles/pyramid/pyraminx'

/**
 * The ways to hold a Pyraminx laid flat (a face down, its top corner up):
 * a side in front, each hold the next round the top (the puzzle turned a
 * third about it, `AROUND_TOP`), named by the corner at the back. A turn read
 * in a hold names its corner where it stands; the formulas of the page are
 * written in the first (green in front, the back corner behind).
 */

const HOLDS: readonly PyraVertex[] = ['B', 'L', 'R']

/** A corner after the puzzle turned `k` thirds about its top. */
const around = (vertex: PyraVertex, k: number): PyraVertex =>
  k === 0 ? vertex : around(AROUND_TOP[vertex], k - 1)

const thirds = (hold: string) => HOLDS.indexOf(hold as PyraVertex)

/** A turn's corner moved round the top by `k` thirds. */
const relabeled = (turn: Turn, k: number): Turn =>
  isPyraMove(turn) ? { ...turn, vertex: around(turn.vertex, k) } : turn

export const PYRA_HOLDS: HoldFrame = {
  holds: HOLDS,
  // The side in front: the face across from the corner at the back.
  front: (hold) => mapVec(PYRA_CORNERS[hold as PyraVertex], (v) => -v),
  // Laid flat on the face across from the top.
  down: mapVec(PYRA_CORNERS.U, (v) => -v),
  played: (hold, turn) => relabeled(turn, thirds(hold)),
  inHold: (hold, turn) => relabeled(turn, (3 - thirds(hold)) % 3),
}

/** The hold with a corner at the back (the top: the first). */
export const holdBehind = (vertex: PyraVertex): string => (vertex === 'U' ? HOLDS[0]! : vertex)
