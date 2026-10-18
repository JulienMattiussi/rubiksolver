import { stateKey } from '../core/cube'
import type { Hold, HoldFrame } from '../core/hold'
import { applyMoves } from '../core/turn'
import type { Cube, Turn } from '../core/types'

/**
 * A formula found as a chain of gestures learnt (a figure stage's: a turn of
 * the top then an algorithm, from one hold or another), the shortest that
 * reaches a goal. Each step of a figure stage plays the first gesture of the
 * chain; the next step looks again. The puzzle's own frame of holds turns
 * each gesture into the turns it plays.
 */

/** A gesture: turns read in a hold. */
export interface Gesture {
  readonly hold: Hold
  readonly moves: readonly Turn[]
}

/**
 * The first gesture of the shortest chain of `gestures` (at most `depth`
 * long) that brings the puzzle to `goal`: null if none does, or if it is
 * there already.
 */
export function firstGesture(
  cube: Cube,
  gestures: readonly Gesture[],
  goal: (cube: Cube) => boolean,
  depth: number,
  frame: HoldFrame,
): Gesture | null {
  if (goal(cube)) return null
  const played = gestures.map((g) => g.moves.map((m) => frame.played(g.hold, m)))
  const seen = new Set([stateKey(cube)])
  let frontier = played.map((moves, i) => ({ cube: applyMoves(cube, moves), first: i }))
  for (let level = 1; level <= depth && frontier.length; level++) {
    const found = frontier.find((n) => goal(n.cube))
    if (found) return gestures[found.first]!
    if (level === depth) break
    const next: typeof frontier = []
    for (const n of frontier) {
      const key = stateKey(n.cube)
      if (seen.has(key)) continue
      seen.add(key)
      for (const moves of played) next.push({ cube: applyMoves(n.cube, moves), first: n.first })
    }
    frontier = next
  }
  return null
}
