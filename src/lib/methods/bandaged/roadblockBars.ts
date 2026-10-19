import { FACE_SPEC } from '../../core/geometry'
import { invertMoves, simplifyMoves } from '../../core/moves'
import { barAxis } from '../../puzzles/bandaged/roadblock'
import { applyMoves } from '../../core/turn'
import type { Cube, Cubie, Move } from '../../core/types'
import {
  AMOUNTS,
  FACES,
  MECHANISM,
  type Macro,
  PLACE,
  SOLVED,
  START,
  axisOf,
  colorful,
  inMode,
  legal,
  macroOf,
  placeKey,
  placeOf,
  route,
  slice,
  unit,
} from './roadblockKit'
import { found, searchFormulas } from '../../solve/formulaSearch'

/**
 * RoadBlock-I's method (roadblock.ts), steps 0 and 2: the middle centers,
 * then the other bars, by pure 3-cycles of bars.
 */

// ---------------------------------------------------------------------------
// 0. The middle centers
// ---------------------------------------------------------------------------

/** The middle slices, each in its mode. */
const MIDDLES: Move[][] = [0, 1, 2].flatMap((axis) =>
  AMOUNTS.map((amount) => inMode(axis, [slice(axis, 3, amount)])),
)

const middleKey = (cube: Cube) =>
  cube
    .filter((c) => c.position.filter((v) => v === 0).length === 2)
    .map((c) => c.position.join() + colorful(c)[0]?.color)
    .sort()
    .join('|')
const MIDDLE_HOME = middleKey(SOLVED)

/** The fewest middle slices bringing every face's middle center home. */
export function middlesHome(cube: Cube): Move[] {
  return found(
    searchFormulas(
      cube.filter((c) => c.position.filter((v) => v === 0).length === 2),
      MIDDLES,
      (c) => middleKey(c) === MIDDLE_HOME,
      { key: middleKey, depth: 4, mechanism: MECHANISM },
    ),
    'roadblock: the middle centers cannot go home',
  )
}

export const middleDone = (cube: Cube) => middleKey(cube) === MIDDLE_HOME && barsAtStart(cube)

/** Every face's bars as at START (each face's middle center tells). */
export function barsAtStart(cube: Cube): boolean {
  return FACES.every((f) => {
    const at = [0, 0, 0]
    at[axisOf(f)] = 2 * FACE_SPEC[f].dir
    const middle = cube.find((c) => c.position.join() === at.join())!
    return barAxis(middle) === START[f]
  })
}

// ---------------------------------------------------------------------------
// 1. The other bars
// ---------------------------------------------------------------------------

const isCenterCell = (p: readonly number[]) => p.filter((v) => Math.abs(v) === 2).length === 1
const CENTER_CELLS = new Set(
  SOLVED.filter((c) => isCenterCell(c.position)).map((c) => c.position.join()),
)

/** The faces turned in a mode: around its axis by halves (their bars stay
 *  across it), its two ends freely. */
export function modeTurns(axis: number): Move[] {
  return FACES.flatMap((face): Move[] =>
    axisOf(face) === axis ? AMOUNTS.map((amount) => ({ face, amount })) : [{ face, amount: 2 }],
  )
}

let BAR_MACROS: Macro[] | undefined
/** Commutators of a slice and a face turn of its mode, set up by a turn of
 *  a face of the mode, in that mode: those moving a few bars only (edges
 *  and corners come later), and pairs of them moving three bars in all. */
function barMacros(): Macro[] {
  if (BAR_MACROS) return BAR_MACROS
  const seen = new Set<string>()
  const out: Macro[] = []
  const add = (moves: Move[]) => {
    const macro = macroOf(moves)
    const bars = [...macro.moved].filter((cell) => CENTER_CELLS.has(cell)).length
    if (!bars || bars > 9) return
    const key = macro.to.join()
    if (seen.has(key) || !legal(moves)) return
    seen.add(key)
    out.push({ ...macro, moved: new Set([...macro.moved].filter((c) => CENTER_CELLS.has(c))) })
  }
  for (const axis of [0, 1, 2]) {
    const turns = modeTurns(axis)
    for (const depth of [2, 3, 4] as const) {
      for (const amount of AMOUNTS) {
        const s = slice(axis, depth, amount)
        for (const t of turns) {
          const commutator = [s, t, ...invertMoves([s]), ...invertMoves([t])]
          for (const setup of [[], ...turns.map((x) => [x])]) {
            add(inMode(axis, simplifyMoves([...setup, ...commutator, ...invertMoves(setup)])))
          }
        }
      }
    }
  }
  return (BAR_MACROS = out)
}

/** A bar's middle center: a center whose bar runs across the line to its
 *  face's middle (or the face's middle itself). */
const isBarMiddle = (c: Cubie) => {
  const axis = barAxis(c)
  if (axis === undefined) return false
  const off = c.position.findIndex((v) => Math.abs(v) === 1)
  return off < 0 || (off !== axis && c.position.filter((v) => Math.abs(v) === 1).length === 1)
}

/** The outer bars' homes: on each face, the two rows beside its middle
 *  bar, their middle centers' places (either way round). */
const OUTER_HOMES = SOLVED.filter(
  (c) => isBarMiddle(c) && c.position.some((v) => Math.abs(v) === 1),
)

const homesOf = (home: Cubie) => {
  const n = colorful(home)[0]!.normal
  const axis = barAxis(home)!
  return new Set([1, -1].map((s) => PLACE.get(placeKey(home.position, n, unit(axis, s)))!))
}

/** Whether the outer bars are home (two of a color: either). */
export const barsDone = (cube: Cube) =>
  middleDone(cube) &&
  OUTER_HOMES.every((home) => {
    const piece = cube.find((c) => c.position.join() === home.position.join())!
    return (
      colorful(piece)[0]!.color === colorful(home)[0]!.color && barAxis(piece) === barAxis(home)
    )
  })

/** The outer bars, one after another, each by the fewest 3-cycles keeping
 *  the bars done (two of a color: the cheaper one). */
export function placeBars(cube: Cube): Move[] {
  let state = cube
  const all: Move[] = []
  // Done: every face's middle bar (three cells each).
  const kept = new Set(
    SOLVED.filter(
      (c) =>
        (barAxis(c) !== undefined && !c.position.some((v) => Math.abs(v) === 1)) ||
        (barAxis(c) !== undefined &&
          c.position.filter((v) => Math.abs(v) === 1).length === 1 &&
          !isBarMiddle(c)),
    ).map((c) => c.position.join()),
  )
  for (const home of OUTER_HOMES) {
    const color = colorful(home)[0]!.color
    const cells = (middle: Cubie) => {
      const axis = barAxis(middle)!
      return [-1, 0, 1].map((k) => middle.position.map((v, d) => (d === axis ? k : v)).join())
    }
    const atHome = state.find((c) => c.position.join() === home.position.join())!
    if (colorful(atHome)[0]!.color === color && barAxis(atHome) === barAxis(home)) {
      for (const cell of cells(home)) kept.add(cell)
      continue
    }
    const options = state.filter(
      (c) =>
        isBarMiddle(c) &&
        c.position.some((v) => Math.abs(v) === 1) &&
        colorful(c)[0]!.color === color &&
        !kept.has(c.position.join()),
    )
    const routes = options.map((piece) => route(placeOf(piece), homesOf(home), barMacros(), kept))
    const moves = routes.reduce((a, b) => (b.length < a.length ? b : a))
    state = applyMoves(state, moves)
    all.push(...moves)
    for (const cell of cells(home)) kept.add(cell)
  }
  return simplifyMoves(all)
}
