import { FACES, invertMoves } from '../core/moves'
import { applyMoves } from '../core/turn'
import type { Cube, Cubie, Dims, Move, Vec3 } from '../core/types'

/**
 * 3-cycle libraries of the big cubes' pieces (the 5x5's and 6x6's centers and wings,
 * the 4-Trajber's Octahedron's pieces), the brick of their steps.
 * A commutator [A, X Y X'] (A a slice, X and Y single turns) is found
 * pure when it moves exactly three pieces of one kind and nothing else that
 * matters; conjugated by a turn or two (X C X'), it cycles three other
 * slots. Each cycle is indexed by the move it makes (a piece from slot a to
 * slot b), with the third slot it disturbs, so a step can pick one that
 * brings the right piece home and only touches what is still to be done.
 *
 * Effects are read on the solved puzzle, by position: a cycle only moves
 * pieces, so its effect on any state is the same permutation of slots.
 */

/** The 5x5's mechanism, by default. */
const FIVE: Dims = [5, 5, 5]

const key = (p: Vec3) => p.join(',')

interface Cycle {
  readonly moves: readonly Move[]
  /** The slot the piece at `to` goes to (the cycle is from -> to -> third). */
  readonly third: string
}

/** The turns of a big cube a library is built from (the 5x5's middle
 *  slices too). */
const turns = (depth?: 2 | 3): Move[] =>
  FACES.flatMap((face) =>
    ([1, 2, 3] as const).map((amount): Move =>
      depth ? { face, amount, depth } : { face, amount },
    ),
  )
export const OUTER = turns()
export const SLICES = turns(2)
/** The third layer in from each face (a 6x6's 3R). */
export const DEEP = turns(3)
export const MIDDLES = DEEP.filter((m) => ['R', 'U', 'F'].includes(m.face))

/** Where each piece of `pieces` lands under `moves`, by slot. */
function slotMap(moves: readonly Move[], pieces: Cube, mechanism: Dims): Map<string, string> {
  const after = applyMoves(pieces, moves, mechanism)
  return new Map(pieces.map((c, i) => [key(c.position), key(after[i]!.position)]))
}

/** The moved slots of a sequence, if it is a pure 3-cycle of `kind`'s
 *  slots (nothing else among `watched` moving or turning). */
function pureCycle(
  moves: readonly Move[],
  watched: Cube,
  kind: (c: Cubie) => boolean,
  mechanism: Dims,
): [string, string, string] | null {
  const after = applyMoves(watched, moves, mechanism)
  const moved: number[] = []
  for (let i = 0; i < watched.length; i++) {
    const before = watched[i]!
    const now = after[i]!
    const still =
      key(now.position) === key(before.position) &&
      now.stickers.every((s, k) => key(s.normal) === key(before.stickers[k]!.normal))
    if (still) continue
    if (!kind(before) || moved.length === 3) return null
    moved.push(i)
  }
  if (moved.length !== 3) return null
  const from = key(watched[moved[0]!]!.position)
  const to = key(after[moved[0]!]!.position)
  const next = moved.find((i) => key(watched[i]!.position) === to)
  if (next === undefined) return null // not a single 3-cycle
  const third = key(after[next]!.position)
  return [from, to, third]
}

/** A cycle library: every move a -> b it can make, by `a>b`, on the
 *  pieces of its kind and the mechanism they turn on. */
export interface Library {
  readonly cycles: ReadonlyMap<string, readonly Cycle[]>
  readonly pieces: Cube
  readonly mechanism: Dims
}

/**
 * The pure 3-cycles of `kind` among the commutators [A, X Y X'] (A in
 * `slices`, X in `outer`, Y in `inner`), each also conjugated by every
 * outer turn. `watched` are the pieces that must stay put (or only move
 * within the cycle), `kind`'s among them.
 */
export function buildLibrary(
  slices: readonly Move[],
  outer: readonly Move[],
  inner: readonly Move[],
  watched: Cube,
  kind: (c: Cubie) => boolean,
  mechanism: Dims = FIVE,
): Library {
  const bases: { moves: Move[]; cycle: [string, string, string] }[] = []
  const seen = new Set<string>()
  for (const a of slices) {
    for (const x of outer) {
      for (const y of inner) {
        if (x.face === y.face) continue
        const b = [x, y, ...invertMoves([x])]
        const moves = [a, ...b, ...invertMoves([a]), ...invertMoves(b)]
        const cycle = pureCycle(moves, watched, kind, mechanism)
        if (!cycle) continue
        const id = cycle.join('|')
        if (seen.has(id)) continue
        seen.add(id)
        bases.push({ moves, cycle })
      }
    }
  }
  // Conjugates X C X': the cycle (a b c) becomes (X'(a) X'(b) X'(c)).
  const pieces = watched.filter(kind)
  const cycles = new Map<string, Cycle[]>()
  const add = (moves: Move[], [a, b, c]: string[]) => {
    for (const [from, to, third] of [
      [a!, b!, c!],
      [b!, c!, a!],
      [c!, a!, b!],
    ]) {
      const list = cycles.get(`${from}>${to}`) ?? []
      list.push({ moves, third: third! })
      cycles.set(`${from}>${to}`, list)
    }
  }
  for (const { moves, cycle } of bases) add(moves, cycle)
  for (const x of outer) {
    const back = slotMap(invertMoves([x]), pieces, mechanism)
    for (const { moves, cycle } of bases) {
      const conjugated = cycle.map((slot) => back.get(slot)!)
      if (conjugated.join('|') === cycle.join('|')) continue
      add([x, ...moves, ...invertMoves([x])], conjugated)
    }
  }
  // Shortest first: a step picks the first that fits.
  for (const list of cycles.values()) list.sort((p, q) => p.moves.length - q.moves.length)
  return { cycles, pieces, mechanism }
}

const MAPS = new WeakMap<
  Library,
  Map<string, { there: Map<string, string>; back: Map<string, string> }>
>()

/** Where each slot of a library's pieces goes under a turn, and back. */
function turnMaps(library: Library, move: Move) {
  let byTurn = MAPS.get(library)
  if (!byTurn) {
    byTurn = new Map()
    MAPS.set(library, byTurn)
  }
  const id = `${move.face}${move.amount}`
  let maps = byTurn.get(id)
  if (!maps) {
    const { pieces, mechanism } = library
    maps = {
      there: slotMap([move], pieces, mechanism),
      back: slotMap(invertMoves([move]), pieces, mechanism),
    }
    byTurn.set(id, maps)
  }
  return maps
}

/** A 3-cycle found: its moves, and the slot whose piece goes on (the cycle
 *  is from -> to -> third). */
export interface Found {
  readonly moves: Move[]
  readonly third: string
}

/**
 * A 3-cycle taking the piece at `from` to `to`, whose third slot `free`
 * accepts: from the library, else conjugated once more by an outer turn
 * (X C X'). Null when there is none.
 */
export function findCycle(
  library: Library,
  from: string,
  to: string,
  free: (slot: string) => boolean,
): Found | null {
  const direct = (library.cycles.get(`${from}>${to}`) ?? []).find((c) => free(c.third))
  if (direct) return { moves: [...direct.moves], third: direct.third }
  for (const x of OUTER) {
    const { there, back } = turnMaps(library, x)
    const cycle = (library.cycles.get(`${there.get(from)}>${there.get(to)}`) ?? []).find((c) =>
      free(back.get(c.third)!),
    )
    if (cycle) {
      return { moves: [x, ...cycle.moves, ...invertMoves([x])], third: back.get(cycle.third)! }
    }
  }
  return null
}

/** What a slot holds, for the placement below: a piece's identity, or its
 *  color where pieces of one color are alike. */
type Label = string | number

/**
 * The fewest 3-cycles putting the few `wrong` slots right when no single
 * one helps (they hold, say, an edge's two wings, which no 3-cycle takes
 * together): a right slot or two are borrowed, and a breadth-first search
 * runs on those slots alone, a 3-cycle's effect being a permutation of them.
 */
export function borrow(
  library: Library,
  at: ReadonlyMap<string, Label>,
  wanted: ReadonlyMap<string, Label>,
  wrong: readonly string[],
): Move[] | null {
  if (wrong.length > 5) return null
  const right = [...wanted.keys()].filter((slot) => !wrong.includes(slot))
  // One right slot borrowed, else two (two wrong wings of one edge need
  // both), those wanting what the wrong ones hold first.
  const useful = right.filter((slot) => wrong.some((w) => at.get(w) === wanted.get(slot)))
  const pairs = useful.flatMap((a, i) => [...useful.slice(i + 1), ...right].map((b) => [a, b]))
  for (const borrowed of [...right.map((slot) => [slot]), ...pairs]) {
    if (borrowed.length === 2 && borrowed[0] === borrowed[1]) continue
    const path = within(library, at, wanted, [...wrong, ...borrowed])
    if (path) return path
  }
  return null
}

/** The fewest 3-cycles among `slots` alone putting them all right, if any
 *  within four. */
function within(
  library: Library,
  at: ReadonlyMap<string, Label>,
  wanted: ReadonlyMap<string, Label>,
  slots: readonly string[],
): Move[] | null {
  // Every 3-cycle within these slots: x -> y -> z.
  const cycles: { x: number; y: number; z: number; moves: Move[] }[] = []
  slots.forEach((sx, x) =>
    slots.forEach((sy, y) =>
      slots.forEach((sz, z) => {
        if (x === y || y === z || x === z) return
        const found = findCycle(library, sx, sy, (third) => third === sz)
        if (found) cycles.push({ x, y, z, moves: found.moves })
      }),
    ),
  )
  const start = slots.map((slot) => at.get(slot)!)
  const goal = slots.map((slot) => wanted.get(slot)!).join()
  const seen = new Map<string, Move[]>([[start.join(), []]])
  let frontier = [start]
  for (let depth = 0; depth < 4 && frontier.length; depth++) {
    const next: Label[][] = []
    for (const state of frontier) {
      for (const { x, y, z, moves } of cycles) {
        const after = [...state]
        after[y] = state[x]!
        after[z] = state[y]!
        after[x] = state[z]!
        const id = after.join()
        if (seen.has(id)) continue
        const path = [...seen.get(state.join())!, ...moves]
        if (id === goal) return path
        seen.set(id, path)
        next.push(after)
      }
    }
    frontier = next
  }
  return null
}

/**
 * Put every slot of a kind right (`wanted` says what each wants, `at` what
 * each holds) by 3-cycles: each brings a wrong slot what it wants from
 * another wrong slot, through a third wrong one (it can only get better);
 * when none fits, a few cycles borrowing a right slot (`borrow`). Worked on
 * the slots alone, then played.
 */
export function placeAll(
  library: Library,
  holds: ReadonlyMap<string, Label>,
  wanted: ReadonlyMap<string, Label>,
): Move[] {
  const at = new Map(holds)
  const moves: Move[] = []
  const play = (found: Move[], cycle?: [string, string, string]) => {
    moves.push(...found)
    if (cycle) {
      const [a, b, c] = cycle
      const [la, lb, lc] = [at.get(a)!, at.get(b)!, at.get(c)!]
      at.set(b, la)
      at.set(c, lb)
      at.set(a, lc)
    }
  }
  for (let guard = 0; ; guard++) {
    if (guard > 100) throw new Error('placeAll: no progress')
    const wrong = [...wanted.keys()].filter((slot) => at.get(slot) !== wanted.get(slot))
    if (wrong.length === 0) return moves
    let progressed = false
    for (const target of wrong) {
      for (const source of wrong) {
        if (source === target || at.get(source) !== wanted.get(target)) continue
        const found = findCycle(
          library,
          source,
          target,
          (third) => third !== source && wrong.includes(third),
        )
        if (!found) continue
        play(found.moves, [source, target, found.third])
        progressed = true
        break
      }
      if (progressed) break
    }
    if (progressed) continue
    const borrowed = borrow(library, at, wanted, wrong)
    if (!borrowed) throw new Error(`placeAll: no 3-cycle fits (wrong: ${wrong.join(' ')})`)
    // The borrowing search ends with every slot right.
    moves.push(...borrowed)
    for (const slot of wrong) at.set(slot, wanted.get(slot)!)
  }
}
