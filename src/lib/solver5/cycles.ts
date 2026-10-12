import { solvedCube } from '../cube'
import { FACES, invertMoves } from '../moves'
import { applyMoves } from '../turn'
import type { Cube, Cubie, Move, Vec3 } from '../types'

/**
 * 3-cycle libraries of the 5x5, the brick of its center and edge steps.
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

const MECHANISM = [5, 5, 5] as const
const SOLVED = solvedCube('5')

const key = (p: Vec3) => p.join(',')

interface Cycle {
  readonly moves: readonly Move[]
  /** The slot the piece at `to` goes to (the cycle is from -> to -> third). */
  readonly third: string
}

/** The turns of the 5x5 a library is built from. */
const turns = (depth?: 2 | 3): Move[] =>
  FACES.flatMap((face) =>
    ([1, 2, 3] as const).map((amount): Move =>
      depth ? { face, amount, depth } : { face, amount },
    ),
  )
export const OUTER = turns()
export const SLICES = turns(2)
export const MIDDLES = turns(3).filter((m) => ['R', 'U', 'F'].includes(m.face))

/** Where each piece of `pieces` lands under `moves`, by slot. */
function slotMap(moves: readonly Move[], pieces: Cube): Map<string, string> {
  const after = applyMoves(pieces, moves, MECHANISM)
  return new Map(pieces.map((c, i) => [key(c.position), key(after[i]!.position)]))
}

/** The moved slots of a sequence, if it is a pure 3-cycle of `kind`'s
 *  slots (nothing else among `watched` moving or turning). */
function pureCycle(
  moves: readonly Move[],
  watched: Cube,
  kind: (c: Cubie) => boolean,
): [string, string, string] | null {
  const after = applyMoves(watched, moves, MECHANISM)
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

/** A cycle library: every move a -> b it can make, by `a>b`. */
export type Library = ReadonlyMap<string, readonly Cycle[]>

/**
 * The pure 3-cycles of `kind` among the commutators [A, X Y X'] (A in
 * `slices`, X in `outer`, Y in `inner`), each also conjugated by every
 * outer turn. `watched` are the pieces that must stay put (or only move
 * within the cycle).
 */
export function buildLibrary(
  slices: readonly Move[],
  outer: readonly Move[],
  inner: readonly Move[],
  watched: Cube,
  kind: (c: Cubie) => boolean,
): Library {
  const bases: { moves: Move[]; cycle: [string, string, string] }[] = []
  const seen = new Set<string>()
  for (const a of slices) {
    for (const x of outer) {
      for (const y of inner) {
        if (x.face === y.face) continue
        const b = [x, y, ...invertMoves([x])]
        const moves = [a, ...b, ...invertMoves([a]), ...invertMoves(b)]
        const cycle = pureCycle(moves, watched, kind)
        if (!cycle) continue
        const id = cycle.join('|')
        if (seen.has(id)) continue
        seen.add(id)
        bases.push({ moves, cycle })
      }
    }
  }
  // Conjugates X C X': the cycle (a b c) becomes (X'(a) X'(b) X'(c)).
  const pieces = SOLVED.filter(kind)
  const library = new Map<string, Cycle[]>()
  const add = (moves: Move[], [a, b, c]: string[]) => {
    for (const [from, to, third] of [
      [a!, b!, c!],
      [b!, c!, a!],
      [c!, a!, b!],
    ]) {
      const list = library.get(`${from}>${to}`) ?? []
      list.push({ moves, third: third! })
      library.set(`${from}>${to}`, list)
    }
  }
  for (const { moves, cycle } of bases) add(moves, cycle)
  for (const x of outer) {
    const back = slotMap(invertMoves([x]), pieces)
    for (const { moves, cycle } of bases) {
      const conjugated = cycle.map((s) => back.get(s)!)
      if (conjugated.join('|') === cycle.join('|')) continue
      add([x, ...moves, ...invertMoves([x])], conjugated)
    }
  }
  // Shortest first: a step picks the first that fits.
  for (const list of library.values()) list.sort((p, q) => p.moves.length - q.moves.length)
  return library
}

const MAPS = new Map<string, { there: Map<string, string>; back: Map<string, string> }>()

/** Where each slot of `pieces` goes under a turn, and back (memoized). */
function turnMaps(move: Move, pieces: Cube) {
  const id = `${move.face}${move.amount}:${pieces.length}`
  let maps = MAPS.get(id)
  if (!maps) {
    maps = { there: slotMap([move], pieces), back: slotMap(invertMoves([move]), pieces) }
    MAPS.set(id, maps)
  }
  return maps
}

/**
 * Moves taking the piece at `from` to `to` by a 3-cycle whose third slot
 * `free` accepts: from the library, else conjugated once more by an outer
 * turn (X C X'). Null when there is none.
 */
export function findCycle(
  library: Library,
  pieces: Cube,
  from: string,
  to: string,
  free: (slot: string) => boolean,
): Move[] | null {
  const direct = (library.get(`${from}>${to}`) ?? []).find((c) => free(c.third))
  if (direct) return [...direct.moves]
  for (const x of OUTER) {
    const { there, back } = turnMaps(x, pieces)
    const cycle = (library.get(`${there.get(from)}>${there.get(to)}`) ?? []).find((c) =>
      free(back.get(c.third)!),
    )
    if (cycle) return [x, ...cycle.moves, ...invertMoves([x])]
  }
  return null
}
