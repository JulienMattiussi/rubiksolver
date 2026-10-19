import { CUBE_HOLDS, type HoldFrame } from '../core/hold'
import { formatMove } from '../core/notation'
import type { Turn } from '../core/types'
import type { Sequence } from './tutorial'

/** A piece of a formula as it is taught: turns to play one by one, or a
 *  gesture of a sequence learnt, played `times` times in a row. */
export interface FormulaSegment {
  readonly kind: 'moves' | 'sequence'
  readonly moves: Turn[]
  readonly times: number
}

/** Two turns the same (whatever the puzzle: written alike). */
export const sameTurn = (a: Turn, b: Turn) => formatMove(a) === formatMove(b)

/**
 * A formula (read in its hold) cut as it is taught: the sequences learnt
 * (`known`: the corners' trigger, the middle edges' insertions) wherever
 * they come and from whichever hold of the frame they are played (another
 * slot's insertion lifting an edge out), gesture by gesture, a sequence of
 * one gesture repeated told once with its count, and the turns between
 * them one by one.
 */
export function formulaSegments(
  moves: readonly Turn[],
  known: readonly Sequence[] = [],
  frame: HoldFrame = CUBE_HOLDS,
): FormulaSegment[] {
  const segments: { kind: 'moves' | 'sequence'; moves: Turn[]; times: number }[] = []
  for (let i = 0; i < moves.length;) {
    const learnt = known.find((sequence) => {
      const k = sequence.flat()
      return (
        i + k.length <= moves.length &&
        frame.holds.some((hold) =>
          k.every((m, j) => sameTurn(frame.inHold(hold, moves[i + j]!), m)),
        )
      )
    })
    const last = segments[segments.length - 1]
    if (learnt) {
      const played = moves.slice(i, i + learnt.flat().length)
      if (
        learnt.length === 1 &&
        last?.kind === 'sequence' &&
        last.moves.length === played.length &&
        last.moves.every((m, j) => sameTurn(m, played[j]!))
      ) {
        last.times++
      } else {
        let at = 0
        for (const gesture of learnt) {
          segments.push({
            kind: 'sequence',
            moves: played.slice(at, at + gesture.length),
            times: 1,
          })
          at += gesture.length
        }
      }
      i += played.length
    } else {
      if (last?.kind === 'moves') last.moves.push(moves[i]!)
      else segments.push({ kind: 'moves', moves: [moves[i]!], times: 1 })
      i++
    }
  }
  return segments
}
