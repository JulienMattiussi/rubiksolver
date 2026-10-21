import { stateKey } from '../core/cube'
import type { Hold, HoldFrame } from '../core/hold'
import { applyMoves } from '../core/turn'
import type { Cube, Cubie, Dims, Turn } from '../core/types'
import { searchChain } from '../solve/formulaSearch'
import type { Kept, PieceStage } from './stages'
import type { TutorialPick } from './tutorial'

/**
 * A formula found as a chain of gestures learnt (a figure stage's: a turn of
 * the top then an algorithm, from one hold or another), the shortest that
 * reaches a goal. Each step of a figure stage plays the first gesture of the
 * chain; the next step looks again; a piece stage plays it all. The
 * puzzle's own frame of holds turns each gesture into the turns it plays.
 */

/** A gesture: turns read in a hold, and what kind of formula it plays
 *  (the figure telling what it does, when a stage says it). */
export interface Gesture {
  readonly hold: Hold
  readonly moves: readonly Turn[]
  readonly kind?: string
}

/**
 * Formulas held every way (the turns they play: a method's "from every
 * side"), as gestures: each read in the hold where it looks most like one
 * of the formulas as written (the most turns the same, place by place),
 * the first hold if none does (one of the top or the bottom). A tutorial
 * thus declines the formulas its method declares once.
 */
export function asGestures(
  formulas: readonly (readonly Turn[])[],
  written: readonly (readonly Turn[])[],
  frame: HoldFrame,
): Gesture[] {
  const same = (a: readonly Turn[], b: readonly Turn[]) =>
    a.filter((t, i) => b[i] !== undefined && JSON.stringify(t) === JSON.stringify(b[i])).length
  return formulas.map((played) => {
    const read = frame.holds.map((hold) => ({
      hold,
      moves: played.map((t) => frame.inHold(hold, t)),
    }))
    const score = (g: Gesture) => Math.max(...written.map((w) => same(g.moves, w)))
    return read.reduce((best, g) => (score(g) > score(best) ? g : best))
  })
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

/** Memoized by state (a step asks again and again). */
export function perState<T>(compute: (cube: Cube) => T): (cube: Cube) => T {
  const memo = new WeakMap<Cube, T>()
  return (cube) => {
    if (!memo.has(cube)) memo.set(cube, compute(cube))
    return memo.get(cube)!
  }
}

/** A chain of gestures' turns, as played. */
const turnsOf = (chain: readonly Gesture[], frame: HoldFrame): Turn[] =>
  chain.flatMap((g) => g.moves.map((m) => frame.played(g.hold, m)))

/**
 * The shortest chain of gestures bringing some pieces (`keep`) to a goal,
 * the others left out of the search (the gestures keep them, which keeps
 * it small): null if none does within the depth. The whole chain, unlike
 * `firstGesture`: a piece stage plays it all, a figure stage its first.
 */
export function gestureChain(
  cube: Cube,
  gestures: readonly Gesture[],
  goal: (pieces: Cube) => boolean,
  options: {
    keep: (c: Cubie) => boolean
    depth: number
    mechanism: Dims
    frame: HoldFrame
  },
): Gesture[] | null {
  const formulas = gestures.map((g) => turnsOf([g], options.frame))
  const chain = searchChain(cube.filter(options.keep), formulas, goal, options)
  return chain && chain.map((i) => gestures[i]!)
}

/** A chain's first gesture as a figure's formula (null: no chain, or
 *  nothing to play). */
export function leading(chain: readonly Gesture[] | null) {
  const first = chain?.[0]
  return first ? { hold: first.hold, moves: first.moves } : null
}

/** A figure seen on the first gesture of a chain: there when that gesture
 *  is of its kind. */
export const chainFigure = (
  chainOf: (cube: Cube) => Gesture[] | null,
  kind: string,
  key: string,
) => ({
  key,
  match: (cube: Cube) => {
    const chain = chainOf(cube)
    return chain?.[0]?.kind === kind ? leading(chain) : null
  },
})

/** A piece stage played by chains of gestures: held as the first one, its
 *  formula the whole chain (`chainFor`: from a state, for a pick, the step
 *  having begun at `begun`). */
export function chainedPieces(
  chainFor: (cube: Cube, pick: TutorialPick, begun: Cube) => Gesture[] | null,
  frame: HoldFrame,
): Pick<PieceStage, 'hold' | 'formula'> {
  return {
    hold: (begun, pick, next) =>
      chainFor(begun, pick ?? { piece: next.piece(begun), slot: next.slot }, begun)?.[0]?.hold ??
      frame.holds[0]!,
    formula: (cube: Cube, pick: TutorialPick, kept: Kept) => {
      const chain = chainFor(cube, pick, kept.begun)
      return chain && turnsOf(chain, frame)
    },
  }
}
