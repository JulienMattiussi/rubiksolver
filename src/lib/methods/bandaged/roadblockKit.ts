import { solvedCube } from '../../core/cube'
import { MARK } from '../../core/types'
import { FACE_SPEC, mapVec } from '../../core/geometry'
import { invertMoves } from '../../core/moves'
import { barAxis } from '../../puzzles/bandaged/roadblock'
import { applyMove } from '../../core/turn'
import type { Cubie, Face, Move, Vec3 } from '../../core/types'

/**
 * RoadBlock-I's method (roadblock.ts), its mechanism: START and the modes
 * (which slices turn as the faces' bars lie), the places of its pieces and
 * the formulas between them, as tables, and the route a piece takes.
 */

export const MECHANISM = [5, 5, 5] as const
export const SOLVED = solvedCube('roadblock')
export const FACES: readonly Face[] = ['U', 'D', 'L', 'R', 'F', 'B']
export const AMOUNTS = [1, 2, 3] as const
export const axisOf = (face: Face) => FACE_SPEC[face].coordIndex

// ---------------------------------------------------------------------------
// START and the modes
// ---------------------------------------------------------------------------

/** Each face's bars' axis at START. */
export const START: Record<Face, number> = { U: 0, D: 0, F: 0, B: 0, L: 2, R: 2 }
/** A face's other axis across it. */
const other = (face: Face, axis: number) => 3 - axisOf(face) - axis

/** Whether a sequence plays out from START (every slice cutting no bar)
 *  and ends at START. */
export function legal(moves: readonly Move[]): boolean {
  const bars = { ...START }
  for (const m of moves) {
    const axis = axisOf(m.face)
    if (m.depth) {
      for (const f of FACES) if (axisOf(f) !== axis && bars[f] === axis) return false
    }
    if ((!m.depth || m.wide) && m.amount !== 2) bars[m.face] = other(m.face, bars[m.face])
  }
  return FACES.every((f) => bars[f] === START[f])
}

/** The quarter turns laying the bars around an axis across it (from
 *  START): none for the equator's; two or four for the others'. */
const SETUP: Record<number, Move[]> = {
  1: [],
  0: (['U', 'D', 'F', 'B'] as const).map((face) => ({ face, amount: 1 })),
  2: (['L', 'R'] as const).map((face) => ({ face, amount: 1 })),
}
export const inMode = (axis: number, moves: readonly Move[]): Move[] => [
  ...SETUP[axis]!,
  ...moves,
  ...invertMoves(SETUP[axis]!),
]

const OPPOSITE: Partial<Record<Face, Face>> = { R: 'L', U: 'D', F: 'B' }

/** The slices along an axis, by the face that names them. */
const SLICE_FACE: Record<number, Face> = { 0: 'R', 1: 'U', 2: 'F' }
export const slice = (axis: number, depth: 2 | 3 | 4, amount: 1 | 2 | 3): Move =>
  depth === 4
    ? { face: OPPOSITE[SLICE_FACE[axis]!]!, amount, depth: 2 }
    : { face: SLICE_FACE[axis]!, amount, depth }

// ---------------------------------------------------------------------------
// Places and formulas
// ---------------------------------------------------------------------------

/** A place: where a piece's first sticker (by color) lies, and for a
 *  center, its bar's way too. */
export const placeKey = (
  position: readonly number[],
  normal: readonly number[],
  bar?: readonly number[],
) => `${position.join()}|${normal.join()}|${bar?.join() ?? ''}`
export const unit = (axis: number, sign: number) =>
  mapVec([0, 1, 2], (d) => (d === axis ? sign : 0))
export const PLACES: { position: Vec3; normal: Vec3; bar?: Vec3 }[] = SOLVED.flatMap((c) => {
  const face = c.stickers.filter((s) => s.color !== MARK)
  if (face.length === 1 && barAxis(c) !== undefined) {
    const n = face[0]!.normal
    const across = [0, 1, 2].filter((d) => n[d] === 0)
    return across.flatMap((d) =>
      [1, -1].map((s) => ({ position: c.position, normal: n, bar: unit(d, s) })),
    )
  }
  return face.map((s) => ({ position: c.position, normal: s.normal }))
})
export const PLACE = new Map(PLACES.map((p, i) => [placeKey(p.position, p.normal, p.bar), i]))

export const colorful = (c: Cubie) => c.stickers.filter((s) => s.color !== MARK)
export const first = (c: Cubie) => colorful(c).reduce((m, s) => (s.color < m.color ? s : m))
export const placeOf = (c: Cubie) =>
  PLACE.get(
    placeKey(c.position, first(c).normal, c.stickers.find((s) => s.color === MARK)?.normal),
  )!

const TABLES = new Map<string, Int16Array>()
const moveKey = (m: Move) => `${m.face}${m.amount}${m.depth ?? ''}${m.wide ? 'w' : ''}`
function tableOf(move: Move): Int16Array {
  let table = TABLES.get(moveKey(move))
  if (table) return table
  table = Int16Array.from(PLACES, ({ position, normal, bar }) => {
    const probe: Cubie = {
      position,
      stickers: [{ normal, color: 'W' }, ...(bar ? [{ normal: bar, color: MARK as never }] : [])],
    }
    return placeOf(applyMove([probe], move, MECHANISM)[0]!)
  })
  TABLES.set(moveKey(move), table)
  return table
}

export interface Macro {
  readonly moves: readonly Move[]
  readonly to: Int16Array
  /** The cells whose piece it moves or turns. */
  readonly moved: ReadonlySet<string>
}

export function macroOf(moves: readonly Move[]): Macro {
  const to = Int16Array.from(PLACES, (_, i) => i)
  for (const move of moves) {
    const table = tableOf(move)
    for (let i = 0; i < to.length; i++) to[i] = table[to[i]!]!
  }
  const moved = new Set<string>()
  to.forEach((j, i) => {
    if (j !== i) moved.add(PLACES[i]!.position.join())
  })
  return { moves, to, moved }
}

/** The fewest turns taking a piece from its place to one of `to`, by
 *  macros that leave the kept cells alone (Dijkstra on its places). */
export function route(
  from: number,
  to: ReadonlySet<number>,
  macros: readonly Macro[],
  kept: ReadonlySet<string>,
) {
  const safe = macros.filter((m) => ![...m.moved].some((cell) => kept.has(cell)))
  const cost = new Map([[from, 0]])
  const back = new Map<number, { from: number; macro: Macro }>()
  const done = new Set<number>()
  for (;;) {
    let here = -1
    for (const [p, c] of cost) if (!done.has(p) && (here < 0 || c < cost.get(here)!)) here = p
    if (here < 0) throw new Error('roadblock: this piece cannot go home')
    if (to.has(here)) {
      const moves: Move[] = []
      for (let p = here; p !== from; p = back.get(p)!.from)
        moves.unshift(...back.get(p)!.macro.moves)
      return moves
    }
    done.add(here)
    for (const macro of safe) {
      const next = macro.to[here]!
      const c = cost.get(here)! + macro.moves.length
      if (!done.has(next) && c < (cost.get(next) ?? Infinity)) {
        cost.set(next, c)
        back.set(next, { from: here, macro })
      }
    }
  }
}
