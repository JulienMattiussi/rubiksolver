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
 * there already. Of the gestures starting a shortest chain, the one leaving
 * the puzzle best by `rank` (how far along it looks: never a step back
 * when a chain as short goes forward).
 */
export function firstGesture(
  cube: Cube,
  gestures: readonly Gesture[],
  goal: (cube: Cube) => boolean,
  depth: number,
  frame: HoldFrame,
  rank: (cube: Cube) => number = () => 0,
): Gesture | null {
  if (goal(cube)) return null
  const played = gestures.map((g) => g.moves.map((m) => frame.played(g.hold, m)))
  /** How many gestures from a state to the goal, at most `limit`. */
  const distance = (start: Cube, limit: number) => {
    const seen = new Set([stateKey(start)])
    let frontier = [start]
    for (let level = 0; level <= limit; level++) {
      if (frontier.some(goal)) return level
      if (level === limit) break
      frontier = frontier.flatMap((c) =>
        played.flatMap((moves) => {
          const next = applyMoves(c, moves)
          const key = stateKey(next)
          if (seen.has(key)) return []
          seen.add(key)
          return [next]
        }),
      )
    }
    return Infinity
  }
  let best: { gesture: Gesture; length: number; rank: number } | null = null
  for (const [i, gesture] of gestures.entries()) {
    const after = applyMoves(cube, played[i]!)
    const length = 1 + distance(after, depth - 1)
    if (length > depth) continue
    const ranked = rank(after)
    if (!best || length < best.length || (length === best.length && ranked > best.rank)) {
      best = { gesture, length, rank: ranked }
    }
  }
  return best?.gesture ?? null
}
