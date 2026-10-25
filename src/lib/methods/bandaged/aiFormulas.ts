import { isBlock } from '../../puzzles/bandaged/ai'
import { solvedCube } from '../../core/cube'
import { invertMoves, simplifyMoves } from '../../core/moves'
import { macroOf as placeMacro, route, stickerPlaces, type Macro } from '../../solve/placeTable'
import { applyMove, turnAllowed } from '../../core/turn'
import type { Cube, Face, Move, Vec3 } from '../../core/types'
import { once } from '../../solve/once'

/**
 * The AI Cube's places and the page's formulas (ai.ts): T pivots an octant,
 * C cycles three centers; a piece goes home by the shortest chain of them
 * (and of the top's turns) leaving the done pieces in place, worked out on
 * the places alone (solve/placeTable.ts).
 */

export const MECHANISM = [4, 4, 4] as const
const SOLVED = solvedCube('ai')

export const wide = (face: Face, amount: 1 | 2 | 3): Move => ({
  face,
  amount,
  depth: 2,
  wide: true,
})
const top = (amount: 1 | 2 | 3): Move => ({ face: 'U', amount })
export const inner = (amount: 1 | 2 | 3): Move => ({ face: 'U', amount, depth: 2 })

/** The big blocks below: the standard holding, which the formulas keep. */
export const standard = (cube: Cube) => cube.filter(isBlock).every((c) => c.position[1] < 0)

/** Its places: every sticker of a 4x4x4's small cubie. */
const PLACES = stickerPlaces(solvedCube('4'), MECHANISM)
export const { at: placeAt, placeOf } = PLACES

export const macroOf = (moves: readonly Move[]) => placeMacro(PLACES.places, moves)

/** The standard holding's blocks, to check a formula plays out from there
 *  and leaves them below. */
const STANDARD_BLOCKS: Cube = SOLVED.filter(isBlock).map((c) => ({
  ...c,
  position: [c.position[0], -2, c.position[2]] as unknown as Vec3,
}))
function playable(moves: readonly Move[]): boolean {
  let state = STANDARD_BLOCKS
  for (const move of moves) {
    // The blocks alone tell what jams (and they are what a turn could cut).
    if (!turnAllowed([...state, ...SOLVED.filter((c) => !isBlock(c))], move)) return false
    state = applyMove(state, move, MECHANISM)
  }
  return standard(state)
}

/** T = D'BD.ABA', pivoting the top front right octant, from each corner. */
const T = [wide('R', 3), wide('D', 1), wide('R', 1), wide('F', 1), wide('D', 1), wide('F', 3)]
const turnedBy = (k: number, moves: readonly Move[]): Move[] =>
  k ? [wide('U', k as 1 | 2 | 3), ...moves, wide('U', (4 - k) as 1 | 2 | 3)] : [...moves]
const PIVOTS = [0, 1, 2, 3].flatMap((k) => [turnedBy(k, T), turnedBy(k, invertMoves(T))])
const LAYERS = ([1, 2, 3] as const).flatMap((a) => [[top(a)], [inner(a)]])

/** C = Th².(Th²T'h²)².T'h².(T'h²Th²)²: three centers cycled, nothing else. */
const h2 = [inner(2)]
const Ti = invertMoves(T)
export const C = [
  ...T,
  ...h2,
  ...[...T, ...h2, ...Ti, ...h2, ...T, ...h2, ...Ti, ...h2],
  ...Ti,
  ...h2,
  ...[...Ti, ...h2, ...T, ...h2, ...Ti, ...h2, ...T, ...h2],
]

type Generator = { forward: Macro<Move>; backward: Int16Array }
/** The wings' search turns: the top's two layers, T from each corner. */
const generators = once((): Generator[] =>
  [...LAYERS, ...PIVOTS].map((moves) => {
    const forward = macroOf(moves)
    const backward = new Int16Array(forward.to.length)
    forward.to.forEach((j, i) => (backward[j] = i))
    return { forward, backward }
  }),
)

/** States a search may hold before giving up (memory). */
const MAX_STATES = 600_000

/**
 * The fewest generators taking the tracked pieces from their places to
 * those wanted, the others untracked: from both ends at once, meeting in
 * the middle.
 */
export function meet(from: readonly number[], to: readonly number[]): Move[] {
  const gens = generators()
  type Seen = Map<string, { parent: string | null; gen: number }>
  const grow = (frontier: number[][], seen: Seen, backward: boolean): number[][] => {
    const next: number[][] = []
    for (const state of frontier) {
      const key = state.join()
      gens.forEach((g, i) => {
        const table = backward ? g.backward : g.forward.to
        const moved = state.map((p) => table[p]!)
        const k = moved.join()
        if (seen.has(k)) return
        seen.set(k, { parent: key, gen: i })
        next.push(moved)
      })
    }
    return next
  }
  const ahead: Seen = new Map([[from.join(), { parent: null, gen: -1 }]])
  const behind: Seen = new Map([[to.join(), { parent: null, gen: -1 }]])
  let fa = [[...from]]
  let fb = [[...to]]
  for (let depth = 0; depth < 12 && ahead.size + behind.size < MAX_STATES; depth++) {
    const [small, large] = ahead.size <= behind.size ? [ahead, behind] : [behind, ahead]
    const common = [...small.keys()].find((k) => large.has(k))
    if (common !== undefined) {
      const moves: Move[] = []
      for (let k = common; ahead.get(k)!.parent !== null; k = ahead.get(k)!.parent!) {
        moves.unshift(...gens[ahead.get(k)!.gen]!.forward.moves)
      }
      // Found from the goal by undoing a generator: played forward.
      for (let k = common; behind.get(k)!.parent !== null; k = behind.get(k)!.parent!) {
        moves.push(...gens[behind.get(k)!.gen]!.forward.moves)
      }
      return moves
    }
    if (fa.length <= fb.length) fa = grow(fa, ahead, false)
    else fb = grow(fb, behind, true)
  }
  throw new Error('ai: this piece cannot go home')
}

let CYCLES: Macro<Move>[] | undefined
/** C from every side, both ways, set up by up to two turns of the top or a
 *  pivot in any order, undone after: pure 3-cycles of centers. */
function cycles(): Macro<Move>[] {
  if (CYCLES) return CYCLES
  const bases = [0, 1, 2, 3].flatMap((k) => [turnedBy(k, C), invertMoves(turnedBy(k, C))])
  const singles: Move[][] = [[], ...LAYERS, ...PIVOTS]
  const seen = new Set<string>()
  const out: Macro<Move>[] = []
  for (const base of bases) {
    for (const a of singles) {
      for (const b of singles) {
        const setup = [...a, ...b]
        const moves = simplifyMoves([...setup, ...base, ...invertMoves(setup)])
        const macro = macroOf(moves)
        const key = macro.to.join()
        if (seen.has(key) || !playable(moves)) continue
        seen.add(key)
        out.push(macro)
      }
    }
  }
  // Two of them sharing centers: a 3-cycle of a new trio, when only three
  // centers move in all.
  const firsts = [...out]
  for (const x of firsts) {
    for (const y of firsts) {
      if (![...x.moved].some((cell) => y.moved.has(cell))) continue
      const macro = macroOf([...x.moves, ...y.moves])
      const key = macro.to.join()
      if (macro.moved.size !== 3 || seen.has(key)) continue
      seen.add(key)
      out.push(macro)
    }
  }
  return (CYCLES = out)
}

/** The fewest turns taking a center from one place to another by 3-cycles
 *  that leave the kept cells alone. */
export function centerRoute(from: number, to: number, kept: ReadonlySet<string>): Move[] {
  const safe = cycles().filter((m) => ![...m.moved].some((cell) => kept.has(cell)))
  return route(from, (p) => p === to, safe, 'ai: this center cannot go home')
}
