import { invertMoves, simplifyMoves } from '../../core/moves'
import { applyMoves } from '../../core/turn'
import type { Cube, Cubie, Move, Vec3 } from '../../core/types'
import { stickerColors } from '../../core/pieces'
import { permutationIsOdd } from '../../solve/permutation'
import {
  AMOUNTS,
  FACES,
  type Macro,
  PLACE,
  PLACES,
  SOLVED,
  axisOf,
  colorful,
  first,
  inMode,
  legal,
  macroOf,
  placeKey,
  placeOf,
  route,
  slice,
  unit,
} from './roadblockKit'
import { barsDone, modeTurns } from './roadblockBars'

/**
 * RoadBlock-I's method (roadblock.ts), steps 1 and 3: the wings' parity,
 * then each edge's wings paired by its middle, by 3-cycles of wings.
 */

// ---------------------------------------------------------------------------
// 2. The edges, three by three
// ---------------------------------------------------------------------------

const isWingCell = (p: readonly number[]) =>
  p.filter((v) => Math.abs(v) === 2).length === 2 && p.some((v) => Math.abs(v) === 1)
const WING_CELLS = new Set(
  SOLVED.filter((c) => isWingCell(c.position)).map((c) => c.position.join()),
)
const isMidge = (c: Cubie) =>
  c.position.filter((v) => Math.abs(v) === 2).length === 2 && c.position.includes(0)

let WING_MACROS: Macro[] | undefined
/** Commutators of an inner slice and a turn sequence of its mode that
 *  keeps the mode (F U F': a face a quarter and back): only wings move,
 *  never a bar nor an edge's middle (none in the slice). Set up by a turn
 *  of the mode, and pairs of them moving three wings in all. */
function wingMacros(): Macro[] {
  if (WING_MACROS) return WING_MACROS
  const seen = new Set<string>()
  const out: Macro[] = []
  const add = (moves: Move[]) => {
    const macro = macroOf(moves)
    if ([...macro.moved].some((cell) => !WING_CELLS.has(cell) && !isCornerCell(cell))) return
    const wings = [...macro.moved].filter((cell) => WING_CELLS.has(cell)).length
    if (!wings || wings > 3) return
    const key = macro.to.join()
    if (seen.has(key) || !legal(moves)) return
    seen.add(key)
    out.push({ ...macro, moved: new Set([...macro.moved].filter((c) => WING_CELLS.has(c))) })
  }
  for (const axis of [0, 1, 2]) {
    const turns = modeTurns(axis)
    const around = FACES.filter((f) => axisOf(f) !== axis)
    const caps = FACES.filter((f) => axisOf(f) === axis)
    // A face around the axis a quarter, a cap's turn, the face back.
    const sides: Move[][] = around.flatMap((f) =>
      ([1, 3] as const).flatMap((q) =>
        caps.flatMap((c) =>
          AMOUNTS.map((a): Move[] => [
            { face: f, amount: q },
            { face: c, amount: a },
            { face: f, amount: (4 - q) as 1 | 3 },
          ]),
        ),
      ),
    )
    for (const depth of [2, 4] as const) {
      for (const amount of AMOUNTS) {
        const sl = slice(axis, depth, amount)
        for (const x of sides) {
          const commutator = [sl, ...x, ...invertMoves([sl]), ...invertMoves(x)]
          for (const setup of [[], ...turns.map((t) => [t])]) {
            add(inMode(axis, simplifyMoves([...setup, ...commutator, ...invertMoves(setup)])))
          }
        }
      }
    }
  }
  // Two of them sharing two wings: a 3-cycle of a new trio, when only
  // three wings move in all (their tables composed, not replayed).
  const firsts = [...out]
  const triples = new Set(firsts.map((m) => [...m.moved].sort().join(' ')))
  const byPair = new Map<string, Macro[]>()
  for (const m of firsts) {
    const cells = [...m.moved].sort()
    for (let a = 0; a < cells.length; a++)
      for (let b = a + 1; b < cells.length; b++) {
        const key = `${cells[a]} ${cells[b]}`
        byPair.set(key, [...(byPair.get(key) ?? []), m])
      }
  }
  for (const group of byPair.values()) {
    for (const x of group) {
      for (const y of group) {
        if (x === y) continue
        const to = x.to.map((p) => y.to[p]!)
        const moved = new Set<string>()
        to.forEach((q, p) => {
          if (q !== p) moved.add(PLACES[p]!.position.join())
        })
        const wings = [...moved].filter((c) => WING_CELLS.has(c))
        const trio = wings.sort().join(' ')
        if (wings.length !== 3 || triples.has(trio)) continue
        triples.add(trio)
        out.push({ moves: [...x.moves, ...y.moves], to, moved: new Set(wings) })
      }
    }
  }
  return (WING_MACROS = out)
}

const isCornerCell = (cell: string) => cell.split(',').every((v) => Math.abs(Number(v)) === 2)

/** For each wing, its place by its edge's middle: the cell of the middle's
 *  edge its hand fits, its stickers on the middle's faces. */
function wingTargets(cube: Cube): { colors: string; places: Set<number> }[] {
  const out: { colors: string; places: Set<number> }[] = []
  for (const midge of cube.filter(isMidge)) {
    const axis = midge.position.indexOf(0)
    const colors = colorsOf(midge)
    const f = first(midge)
    // Both wings of the edge: either cell, each fits one way only.
    out.push({
      colors,
      places: new Set(
        [1, -1].map((k) =>
          PLACE.get(
            placeKey(
              midge.position.map((v, d) => (d === axis ? k : v)),
              f.normal,
            ),
          )!,
        ),
      ),
    })
  }
  return out
}

const colorsOf = (c: Cubie) => stickerColors(colorful(c))

/** Whether every edge's wings sit by its middle, as it does. */
export const edgesDone = (cube: Cube) =>
  barsDone(cube) &&
  cube.filter(isMidge).every((midge) => {
    const axis = midge.position.indexOf(0)
    return [1, -1].every((k) => {
      const cell = midge.position.map((v, d) => (d === axis ? k : v)).join()
      const wing = cube.find((c) => c.position.join() === cell)!
      return (
        colorsOf(wing) === colorsOf(midge) &&
        colorful(wing).every((s) =>
          colorful(midge).some((m) => m.color === s.color && m.normal.join() === s.normal.join()),
        )
      )
    })
  })

const CELL_OF = PLACES.map((p) => p.position.join())
const INVERSES = new WeakMap<Macro, Int16Array>()
const inverseOf = (macro: Macro) => {
  let inverse = INVERSES.get(macro)
  if (!inverse) {
    inverse = new Int16Array(macro.to.length)
    macro.to.forEach((j, i) => (inverse![j] = i))
    INVERSES.set(macro, inverse)
  }
  return inverse
}

/** As `route`, and when the wings left over make a trio no 3-cycle takes,
 *  a 3-cycle conjugated by another (S' C S moves S's image of C's trio). */
function routeOrConjugate(from: number, to: ReadonlySet<number>, kept: ReadonlySet<string>) {
  try {
    return route(from, to, wingMacros(), kept)
  } catch {
    const macros = wingMacros()
    // A place in each cell C moves, to follow the cell through S.
    const placeIn = new Map<string, number>(CELL_OF.map((cell, i) => [cell, i]))
    for (const s of macros) {
      const back = inverseOf(s)
      const start = back[from]!
      for (const c of macros) {
        // S' C S: from goes back through S, through C (once or twice), then S.
        let at = start
        for (const times of [1, 2]) {
          at = c.to[at]!
          if (!to.has(s.to[at]!)) continue
          const cells = [...c.moved].map((x) => CELL_OF[s.to[placeIn.get(x)!]!]!)
          if (cells.some((x) => kept.has(x))) break
          const once = [...c.moves]
          return [...invertMoves(s.moves), ...(times === 2 ? [...once, ...once] : once), ...s.moves]
        }
      }
    }
    throw new Error('roadblock: this piece cannot go home')
  }
}

/** Each edge's wings brought by its middle, one after another. */
export function pairEdges(cube: Cube): Move[] {
  let state = cube
  const all: Move[] = []
  const kept = new Set<string>()
  for (const target of wingTargets(state)) {
    for (let k = 0; k < 2; k++) {
      const wing = state.find(
        (c) =>
          WING_CELLS.has(c.position.join()) &&
          colorsOf(c) === target.colors &&
          !kept.has(c.position.join()),
      )!
      const here = placeOf(wing)
      if (target.places.has(here)) {
        kept.add(wing.position.join())
        continue
      }
      const moves = routeOrConjugate(here, target.places, kept)
      state = applyMoves(state, moves)
      all.push(...moves)
      const moved = state.find(
        (c) =>
          WING_CELLS.has(c.position.join()) &&
          colorsOf(c) === target.colors &&
          !kept.has(c.position.join()) &&
          target.places.has(placeOf(c)),
      )
      if (moved) kept.add(moved.position.join())
    }
  }
  return simplifyMoves(all)
}

/** A wing's hand: which way round its two colors go along its edge (no
 *  turn changes it). */
const handOf = (normals: readonly Vec3[], along: Vec3) => {
  const [a, b] = normals as [Vec3, Vec3]
  return (
    a[0] * (b[1] * along[2] - b[2] * along[1]) -
    a[1] * (b[0] * along[2] - b[2] * along[0]) +
    a[2] * (b[0] * along[1] - b[1] * along[0])
  )
}
const byColor = (c: Cubie) => [...colorful(c)].sort((s, t) => (s.color < t.color ? -1 : 1))

/** Whether the wings stand an even permutation away from their places by
 *  the middles: the 3-cycles can then finish them. */
export function wingsEven(cube: Cube): boolean {
  const cells = cube.filter((c) => WING_CELLS.has(c.position.join()))
  const index = new Map(cells.map((c, i) => [c.position.join(), i]))
  const target = cells.map((wing) => {
    const midge = cube.find((c) => isMidge(c) && colorsOf(c) === colorsOf(wing))!
    const axis = midge.position.indexOf(0)
    const own = wing.position.findIndex((v) => Math.abs(v) === 1)
    const hand = handOf(
      byColor(wing).map((s) => s.normal),
      unit(own, wing.position[own]!),
    )
    const k = [1, -1].find(
      (k) =>
        handOf(
          byColor(midge).map((s) => s.normal),
          unit(axis, k),
        ) === hand,
    )!
    return index.get(midge.position.map((v, d) => (d === axis ? k : v)).join())!
  })
  return !permutationIsOdd(target)
}
