import { solvedCube } from '../../core/cube'
import { projectPlan } from '../standard/solver4/steps'
import { FACE_SPEC } from '../../core/geometry'
import { invertMoves, simplifyMoves } from '../../core/moves'
import { allTurnsOf } from '../../core/moveSet'
import { barAxis, toStart, withoutBars } from '../../puzzles/bandaged/roadblock'
import { to3x3 } from '../standard/solver5/project'
import type { MethodPlan } from '../../solve/solverKit'
import { applyMove, applyMoves } from '../../core/turn'
import type { Cube, Cubie, Face, Move, Vec3 } from '../../core/types'
import { BEGINNER_PLAN } from '../standard/layers3'

/**
 * RoadBlock-I, "méthode des centres", after fan2cube.fr (roadblock-I2):
 * solved as a Professor (5x5x5), reduced to a 3x3x3, always keeping it
 * able to turn what the next formula needs.
 *
 * Which slice can turn depends on how each face's bars lie only, and that
 * only changes with that face's quarter turns: at START (the four sides'
 * bars level) the equator's three slices turn; a few quarter turns of the
 * faces around another axis lay their bars across it, its slices turn,
 * and the same quarter turns undone bring START back. Every formula here
 * goes from START back to START.
 *
 *   0. Middle centers  each face's middle bar home, by the middle slices
 *   1. Parity          the wings an even permutation from home (a quarter
 *                      of an equator slice when not)
 *   2. Bars            the others, by pure 3-cycles of bars
 *   3. Edges           each edge's wings by its middle, by 3-cycles of wings
 *   4. As a 3x3        its colors only: solved, its bars may lie either way
 */

const MECHANISM = [5, 5, 5] as const
const SOLVED = solvedCube('roadblock')
const FACES: readonly Face[] = ['U', 'D', 'L', 'R', 'F', 'B']
const AMOUNTS = [1, 2, 3] as const
const axisOf = (face: Face) => FACE_SPEC[face].coordIndex

// ---------------------------------------------------------------------------
// START and the modes
// ---------------------------------------------------------------------------

/** Each face's bars' axis at START. */
const START: Record<Face, number> = { U: 0, D: 0, F: 0, B: 0, L: 2, R: 2 }
/** A face's other axis across it. */
const other = (face: Face, axis: number) => 3 - axisOf(face) - axis

/** Whether a sequence plays out from START (every slice cutting no bar)
 *  and ends at START. */
function legal(moves: readonly Move[]): boolean {
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
const inMode = (axis: number, moves: readonly Move[]): Move[] => [
  ...SETUP[axis]!,
  ...moves,
  ...invertMoves(SETUP[axis]!),
]

const OPPOSITE: Partial<Record<Face, Face>> = { R: 'L', U: 'D', F: 'B' }

/** The slices along an axis, by the face that names them. */
const SLICE_FACE: Record<number, Face> = { 0: 'R', 1: 'U', 2: 'F' }
const slice = (axis: number, depth: 2 | 3 | 4, amount: 1 | 2 | 3): Move =>
  depth === 4
    ? { face: OPPOSITE[SLICE_FACE[axis]!]!, amount, depth: 2 }
    : { face: SLICE_FACE[axis]!, amount, depth }

// ---------------------------------------------------------------------------
// Places and formulas
// ---------------------------------------------------------------------------

/** A place: where a piece's first sticker (by color) lies, and for a
 *  center, its bar's way too. */
const MARK = 'H'
const placeKey = (
  position: readonly number[],
  normal: readonly number[],
  bar?: readonly number[],
) => `${position.join()}|${normal.join()}|${bar?.join() ?? ''}`
const unit = (axis: number, sign: number) =>
  [0, 1, 2].map((d) => (d === axis ? sign : 0)) as unknown as Vec3
const PLACES: { position: Vec3; normal: Vec3; bar?: Vec3 }[] = SOLVED.flatMap((c) => {
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
const PLACE = new Map(PLACES.map((p, i) => [placeKey(p.position, p.normal, p.bar), i]))

const colorful = (c: Cubie) => c.stickers.filter((s) => s.color !== MARK)
const first = (c: Cubie) => colorful(c).reduce((m, s) => (s.color < m.color ? s : m))
const placeOf = (c: Cubie) =>
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

interface Macro {
  readonly moves: readonly Move[]
  readonly to: Int16Array
  /** The cells whose piece it moves or turns. */
  readonly moved: ReadonlySet<string>
}

function macroOf(moves: readonly Move[]): Macro {
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
function route(
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
function middlesHome(cube: Cube): Move[] {
  let frontier: { cube: Cube; moves: Move[] }[] = [
    { cube: cube.filter((c) => c.position.filter((v) => v === 0).length === 2), moves: [] },
  ]
  const seen = new Set([middleKey(frontier[0]!.cube)])
  for (let depth = 0; depth < 5; depth++) {
    for (const node of frontier) if (middleKey(node.cube) === MIDDLE_HOME) return node.moves
    const next: typeof frontier = []
    for (const node of frontier) {
      for (const moves of MIDDLES) {
        const moved = applyMoves(node.cube, moves, MECHANISM)
        const key = middleKey(moved)
        if (seen.has(key)) continue
        seen.add(key)
        next.push({ cube: moved, moves: [...node.moves, ...moves] })
      }
    }
    frontier = next
  }
  throw new Error('roadblock: the middle centers cannot go home')
}

const middleDone = (cube: Cube) => middleKey(cube) === MIDDLE_HOME && barsAtStart(cube)

/** Every face's bars as at START (each face's middle center tells). */
function barsAtStart(cube: Cube): boolean {
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
function modeTurns(axis: number): Move[] {
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
const barsDone = (cube: Cube) =>
  middleDone(cube) &&
  OUTER_HOMES.every((home) => {
    const piece = cube.find((c) => c.position.join() === home.position.join())!
    return (
      colorful(piece)[0]!.color === colorful(home)[0]!.color && barAxis(piece) === barAxis(home)
    )
  })

/** The outer bars, one after another, each by the fewest 3-cycles keeping
 *  the bars done (two of a color: the cheaper one). */
function placeBars(cube: Cube): Move[] {
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
    const colors = colorful(midge)
      .map((s) => s.color)
      .sort()
      .join()
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

const colorsOf = (c: Cubie) =>
  colorful(c)
    .map((s) => s.color)
    .sort()
    .join()

/** Whether every edge's wings sit by its middle, as it does. */
const edgesDone = (cube: Cube) =>
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
function pairEdges(cube: Cube): Move[] {
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
function wingsEven(cube: Cube): boolean {
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
  let swaps = 0
  const seen = new Set<number>()
  for (let i = 0; i < target.length; i++) {
    for (let j = i, n = 0; !seen.has(j); j = target[j]!, n++) {
      seen.add(j)
      if (n) swaps++
    }
  }
  return swaps % 2 === 0
}

/** An odd wing permutation, made even by a quarter of an equator slice
 *  (a 4-cycle of wings; it keeps START and the middles). */
const fixParity = (cube: Cube): Move[] =>
  wingsEven(cube) ? [] : [{ face: 'U', amount: 1, depth: 2 }]

const TURNS = allTurnsOf('roadblock')

export const ROADBLOCK_PLAN: MethodPlan = [
  { key: 'stepRbStart', goal: barsAtStart, moves: TURNS, phases: [toStart], optional: true },
  { key: 'stepRbMiddles', goal: middleDone, moves: TURNS, phases: [middlesHome] },
  {
    key: 'stepRbParity',
    goal: (cube) => middleDone(cube) && wingsEven(cube),
    moves: TURNS,
    phases: [fixParity],
    optional: true,
  },
  { key: 'stepRbBars', goal: barsDone, moves: TURNS, phases: [placeBars] },
  { key: 'stepRbEdges', goal: edgesDone, moves: TURNS, phases: [pairEdges] },
  ...projectPlan(BEGINNER_PLAN, (cube) => to3x3(withoutBars(cube))),
]
