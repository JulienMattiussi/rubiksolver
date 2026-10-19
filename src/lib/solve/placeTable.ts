import type { Turn } from '../core/types'

/**
 * A puzzle's places, as a search reads them when its formulas act the same
 * whatever the state: a place is where a piece's first sticker (by color)
 * lies, so it says both where the piece is and how it is turned. A
 * sequence of turns is then a permutation of the places (`Macro`), read
 * once on the solved puzzle, and a piece goes home through such
 * permutations alone (`route`): a few hundred places to search, not the
 * puzzle's states. The Megaminx's pieces and the AI Cube's centers go so.
 */

export interface Places<T extends Turn> {
  readonly size: number
  /** The slot a place belongs to (the piece's cell), by key. */
  readonly slotOf: (place: number) => string
  /** Where each place goes as a turn is played. */
  readonly tableOf: (turn: T) => Int16Array
}

/** A list's places: each one's `slot`, where a turn sends it (`follow`,
 *  a probe carried), computed once per turn (`key`). */
export function placesOf<P, T extends Turn>(
  places: readonly P[],
  {
    slot,
    follow,
    key,
  }: {
    slot: (place: P) => string
    follow: (place: P, turn: T) => number
    key: (turn: T) => string
  },
): Places<T> {
  const slots = places.map(slot)
  const tables = new Map<string, Int16Array>()
  return {
    size: places.length,
    slotOf: (place) => slots[place]!,
    tableOf: (turn) => {
      const k = key(turn)
      let table = tables.get(k)
      if (!table) tables.set(k, (table = Int16Array.from(places, (p) => follow(p, turn))))
      return table
    },
  }
}

/** What a sequence does, whatever the state: where each place goes, and
 *  which slots it changes. */
export interface Macro<T extends Turn> {
  readonly moves: readonly T[]
  readonly to: Int16Array
  /** The slots whose piece it moves or turns. */
  readonly moved: ReadonlySet<string>
  /** The slots whose piece it takes elsewhere (not just turns). */
  readonly displaced: ReadonlySet<string>
}

export function macroOf<T extends Turn>(places: Places<T>, moves: readonly T[]): Macro<T> {
  const to = Int16Array.from({ length: places.size }, (_, i) => i)
  for (const move of moves) {
    const table = places.tableOf(move)
    for (let i = 0; i < to.length; i++) to[i] = table[to[i]!]!
  }
  const moved = new Set<string>()
  const displaced = new Set<string>()
  to.forEach((j, i) => {
    if (j !== i) moved.add(places.slotOf(i))
    if (places.slotOf(j) !== places.slotOf(i)) displaced.add(places.slotOf(i))
  })
  return { moves, to, moved, displaced }
}

/** The fewest turns taking a piece from a place to one meeting `goal`, by
 *  the macros (Dijkstra on its places); throws with `failure` if none
 *  does. */
export function route<T extends Turn>(
  from: number,
  goal: (place: number) => boolean,
  macros: readonly Macro<T>[],
  failure: string,
): T[] {
  const cost = new Map([[from, 0]])
  const back = new Map<number, { from: number; macro: Macro<T> }>()
  const done = new Set<number>()
  for (;;) {
    let here = -1
    for (const [p, c] of cost) if (!done.has(p) && (here < 0 || c < cost.get(here)!)) here = p
    if (here < 0) throw new Error(failure)
    if (goal(here)) {
      const moves: T[] = []
      for (let p = here; p !== from; p = back.get(p)!.from)
        moves.unshift(...back.get(p)!.macro.moves)
      return moves
    }
    done.add(here)
    const base = cost.get(here)!
    for (const macro of macros) {
      const next = macro.to[here]!
      const c = base + macro.moves.length
      if (!done.has(next) && c < (cost.get(next) ?? Infinity)) {
        cost.set(next, c)
        back.set(next, { from: here, macro })
      }
    }
  }
}
