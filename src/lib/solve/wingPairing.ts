import { applyMoves } from '../core/turn'
import type { Cube, Move } from '../core/types'
import { borrow, findCycle, type Library } from './cycleLibrary'

/**
 * Wings brought where they are wanted by pure 3-cycles of wings (a slice
 * commutator, everything else untouched, the centers included): the edge
 * pairing of the 5x5 and the 6x6. Each round brings the wing a wrong slot
 * wants, by a 3-cycle whose third slot is wrong too (it can only get
 * better), through another wrong slot when no 3-cycle goes straight there
 * (a wing to the other end of its own edge), or at worst a few 3-cycles
 * borrowing a right slot. The wanted arrangement must be an even
 * permutation away: 3-cycles never make an odd one.
 */
export function pairWings(
  cube: Cube,
  library: Library,
  /** The wing each slot wants, by wing id. */
  wanted: ReadonlyMap<string, number>,
  /** Where each wing stands now, by wing id. */
  wingSlots: (cube: Cube) => Map<number, string>,
): Move[] {
  let state = cube
  const all: Move[] = []
  const play = (moves: Move[]) => {
    state = applyMoves(state, moves)
    all.push(...moves)
  }
  const misplaced = () => {
    const at = wingSlots(state)
    return [...wanted].filter(([slot, wing]) => at.get(wing) !== slot).map(([slot]) => slot)
  }
  const cycleTo = (from: string, to: string, free: (slot: string) => boolean) =>
    findCycle(library, from, to, (third) => third !== to && free(third))?.moves
  for (let guard = 0; ; guard++) {
    if (guard > 3 * wanted.size) throw new Error('pairWings: no progress')
    const wrong = misplaced()
    if (wrong.length === 0) return all
    const isWrong = (slot: string) => wrong.includes(slot)
    const slot = wrong[0]!
    const from = wingSlots(state).get(wanted.get(slot)!)!
    const straight = cycleTo(from, slot, isWrong)
    if (straight) {
      play(straight)
      continue
    }
    const via = wrong.find((m) => m !== slot && m !== from && cycleTo(from, m, isWrong))
    if (via) {
      play(cycleTo(from, via, isWrong)!)
      continue
    }
    // The last wrong ones hold an edge's two wings, which no 3-cycle takes
    // together: a few 3-cycles, borrowing a right slot.
    const holds = new Map([...wingSlots(state)].map(([wing, at]) => [at, wing]))
    const pair = borrow(library, holds, wanted, wrong)
    if (!pair) throw new Error(`pairWings: no 3-cycle to ${slot} (wrong: ${wrong.join(' ')})`)
    play(pair)
  }
}

/** Whether moving each wing to the slot that wants it is an odd
 *  permutation of the slots. */
export function oddArrangement(
  wanted: ReadonlyMap<string, number>,
  at: ReadonlyMap<number, string>,
): boolean {
  const seen = new Set<string>()
  let swaps = 0
  for (const start of wanted.keys()) {
    let length = 0
    for (let slot = start; !seen.has(slot); slot = at.get(wanted.get(slot)!)!) {
      seen.add(slot)
      length++
    }
    if (length > 0) swaps += length - 1
  }
  return swaps % 2 === 1
}
