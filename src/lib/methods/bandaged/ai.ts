import { isBlock } from '../../puzzles/bandaged/ai'
import { isSolved, solvedCube } from '../../core/cube'
import { AXIS_ROTATIONS } from '../../core/geometry'
import { invertMoves, simplifyMoves } from '../../core/moves'
import { allTurnsOf } from '../../core/moveSet'
import type { MethodPlan } from '../../solve/solverKit'
import { applyMove, applyMoves, turnAllowed } from '../../core/turn'
import type { Cube, Cubie, Face, Move, Vec3 } from '../../core/types'
import { solveOptimal2 } from '../standard/cube2'

/**
 * AI Cube, "méthode des Blocs", after fan2cube.fr (AIcube2): make it a
 * 2x2x2, then solve that as a Pocket.
 *
 *   0. Standard     the four big blocks below, by half turns of the cube
 *   1. Edges        each small octant's wings around its small corner
 *   2. Centers      and its centers: every octant a block, as if fused
 *   3. Pocket       the eight octants as a 2x2x2's corners, by half turns
 *
 * Held standard, the top turns alone (H, the inner h below it), the rest
 * only by halves (the page's D, G, A, P, B: Rw, Lw, Fw, Bw, Dw). The
 * page's formulas: T = D'BD.ABA' pivots the top front right octant in
 * place; X = H².GBG'.D'B'D.GBG'.H swaps two caps; C =
 * Th².(Th²T'h²)².T'h².(T'h²Th²)² cycles three centers. Here each piece goes
 * home by the shortest chain of those and of T's commutators with H and h,
 * set up by turns of the top, that leaves every piece done in place (and
 * the small corners, which say where each octant's pieces go).
 */

const MECHANISM = [4, 4, 4] as const
const SOLVED = solvedCube('ai')

const wide = (face: Face, amount: 1 | 2 | 3): Move => ({ face, amount, depth: 2, wide: true })
const top = (amount: 1 | 2 | 3): Move => ({ face: 'U', amount })
const inner = (amount: 1 | 2 | 3): Move => ({ face: 'U', amount, depth: 2 })

// ---------------------------------------------------------------------------
// 0. The big blocks below
// ---------------------------------------------------------------------------

const HALVES: Move[] = (['U', 'D', 'L', 'R', 'F', 'B'] as const).flatMap((f) =>
  ([1, 2, 3] as const).map((a) => wide(f, a)),
)

const blocksOf = (cube: Cube) =>
  cube
    .filter(isBlock)
    .map((c) => c.position.join())
    .sort()
    .join('|')
const standard = (cube: Cube) => cube.filter(isBlock).every((c) => c.position[1] < 0)

/** The fewest half turns bringing the big blocks below. */
function toStandard(cube: Cube): Move[] {
  const blocks = cube.filter(isBlock)
  const seen = new Set([blocksOf(blocks)])
  let frontier: { blocks: Cube; moves: Move[] }[] = [{ blocks, moves: [] }]
  for (let depth = 0; depth < 8; depth++) {
    for (const node of frontier) if (standard(node.blocks)) return node.moves
    const next: typeof frontier = []
    for (const node of frontier) {
      for (const move of HALVES) {
        const moved = applyMove(node.blocks, move, MECHANISM)
        const key = blocksOf(moved)
        if (seen.has(key)) continue
        seen.add(key)
        next.push({ blocks: moved, moves: [...node.moves, move] })
      }
    }
    frontier = next
  }
  throw new Error('ai: the big blocks cannot go below')
}

// ---------------------------------------------------------------------------
// Places and formulas
// ---------------------------------------------------------------------------

/** A place: a small piece's cell and the normal of its first sticker (by
 *  color), as `cell|normal`; every sticker of a 4x4x4's small cubie. */
const keyOf = (position: readonly number[], normal: readonly number[]) =>
  `${position.join()}|${normal.join()}`
const PLACES: { position: Vec3; normal: Vec3 }[] = solvedCube('4').flatMap((c) =>
  c.stickers.map((s) => ({ position: c.position, normal: s.normal })),
)
const PLACE = new Map(PLACES.map((p, i) => [keyOf(p.position, p.normal), i]))

const first = (c: Cubie) => c.stickers.reduce((m, s) => (s.color < m.color ? s : m))
const placeOf = (c: Cubie) => PLACE.get(keyOf(c.position, first(c).normal))!

/** Where each place goes as a move is played (a one-sticker probe). */
const TABLES = new Map<string, Int16Array>()
const moveKey = (m: Move) => `${m.face}${m.amount}${m.depth ?? ''}${m.wide ? 'w' : ''}`
function tableOf(move: Move): Int16Array {
  const key = moveKey(move)
  let table = TABLES.get(key)
  if (table) return table
  table = Int16Array.from(PLACES, ({ position, normal }) => {
    const [probe] = applyMove([{ position, stickers: [{ normal, color: 'W' }] }], move, MECHANISM)
    return PLACE.get(keyOf(probe!.position, probe!.stickers[0]!.normal))!
  })
  TABLES.set(key, table)
  return table
}

interface Macro {
  readonly moves: readonly Move[]
  readonly to: Int16Array
  /** The cells whose piece it moves (or turns). */
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

type Generator = { forward: Macro; backward: Int16Array }
let GENERATORS: Generator[] | undefined
/** The wings' search turns: the top's two layers, T from each corner. */
function generators(): Generator[] {
  GENERATORS ??= [...LAYERS, ...PIVOTS].map((moves) => {
    const forward = macroOf(moves)
    const backward = new Int16Array(forward.to.length)
    forward.to.forEach((j, i) => (backward[j] = i))
    return { forward, backward }
  })
  return GENERATORS
}

/** States a search may hold before giving up (memory). */
const MAX_STATES = 600_000

/**
 * The fewest generators taking the tracked pieces from their places to
 * those wanted, the others untracked: from both ends at once, meeting in
 * the middle.
 */
function meet(from: readonly number[], to: readonly number[]): Move[] {
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

let CYCLES: Macro[] | undefined
/** C from every side, both ways, set up by up to two turns of the top or a
 *  pivot in any order, undone after: pure 3-cycles of centers. */
function cycles(): Macro[] {
  if (CYCLES) return CYCLES
  const bases = [0, 1, 2, 3].flatMap((k) => [turnedBy(k, C), invertMoves(turnedBy(k, C))])
  const singles: Move[][] = [[], ...LAYERS, ...PIVOTS]
  const seen = new Set<string>()
  const out: Macro[] = []
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
 *  that leave the kept cells alone (Dijkstra on its places). */
function route(from: number, to: number, kept: ReadonlySet<string>): Move[] {
  const safe = cycles().filter((m) => ![...m.moved].some((cell) => kept.has(cell)))
  const cost = new Map([[from, 0]])
  const back = new Map<number, { from: number; macro: Macro }>()
  const done = new Set<number>()
  for (;;) {
    let here = -1
    for (const [p, c] of cost) if (!done.has(p) && (here < 0 || c < cost.get(here)!)) here = p
    if (here < 0) throw new Error('ai: this center cannot go home')
    if (here === to) {
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
// 1-2. Each octant around its small corner
// ---------------------------------------------------------------------------

const SOLVED4 = solvedCube('4')
const sign = (p: readonly number[]) => p.map(Math.sign).join()
const colorsOf = (c: Cubie) =>
  c.stickers
    .map((s) => s.color)
    .sort()
    .join()

/** The top octants' cells where a piece is wanted: for each small corner
 *  on top, the cells of its solved octant turned as it stands. */
function wanted(cube: Cube): { home: Cubie; position: Vec3; normal: Vec3 }[] {
  const out: { home: Cubie; position: Vec3; normal: Vec3 }[] = []
  for (const corner of cube.filter((c) => c.stickers.length === 3 && c.position[1] === 3)) {
    const home = SOLVED4.find((c) => colorsOf(c) === colorsOf(corner))!
    const at = (color: string) => corner.stickers.find((s) => s.color === color)!.normal.join()
    const turn = AXIS_ROTATIONS.find(
      (r) =>
        r(home.position).join() === corner.position.join() &&
        home.stickers.every((s) => r(s.normal).join() === at(s.color)),
    )!
    for (const piece of SOLVED4) {
      if (
        piece === home ||
        piece.stickers.length === 0 ||
        sign(piece.position) !== sign(home.position)
      )
        continue
      const f = first(piece)
      out.push({ home: piece, position: turn(piece.position), normal: turn(f.normal) })
    }
  }
  return out
}

const isWing = (c: Cubie) => c.stickers.length === 2
const atPlace = (cube: Cube, w: { home: Cubie; position: Vec3; normal: Vec3 }) => {
  const piece = cube.find(
    (c) =>
      !isBlock(c) && c.position.join() === w.position.join() && colorsOf(c) === colorsOf(w.home),
  )
  return !!piece && first(piece).normal.join() === w.normal.join()
}

const wingsDone = (cube: Cube) =>
  standard(cube) &&
  wanted(cube)
    .filter((w) => isWing(w.home))
    .every((w) => atPlace(cube, w))
const octantsDone = (cube: Cube) => standard(cube) && wanted(cube).every((w) => atPlace(cube, w))

/** The sign of a permutation given as a list of images. */
function odd(images: readonly number[]): boolean {
  const seen = new Set<number>()
  let parity = 0
  images.forEach((_, i) => {
    let j = i
    let length = 0
    while (!seen.has(j)) {
      seen.add(j)
      j = images[j]!
      length++
    }
    if (length) parity += length - 1
  })
  return parity % 2 === 1
}

/** Pieces of one kind into their wanted places, one after another; the
 *  corners kept, and every piece placed. */
function placeAll(kind: (c: Cubie) => boolean) {
  return (cube: Cube): Move[] => {
    let state = cube
    const all: Move[] = []
    // Tracked, each kept where it is: the small corners, and (placing
    // centers) the wings.
    const tracked = state.filter(
      (c) => !isBlock(c) && (c.stickers.length === 3 || (kind !== isWing && isWing(c))),
    )
    let keep = tracked.map(placeOf)
    // Wings: an odd permutation of their places cannot come from the
    // formulas (even): the inner turn h, a 4-cycle of wings, sets it right.
    if (state.some(isWing) && kind === isWing) {
      const wings = wanted(state).filter((w) => isWing(w.home))
      const cells = wings.map((w) => w.position.join())
      const images = wings.map((w) => {
        const piece = state.find((c) => isWing(c) && colorsOf(c) === colorsOf(w.home))!
        return cells.indexOf(piece.position.join())
      })
      if (images.every((i) => i >= 0) && odd(images)) {
        state = applyMove(state, inner(1))
        all.push(inner(1))
      }
    }
    const done = new Set<string>()
    const keptCells = new Set(tracked.map((c) => c.position.join()))
    const targets = wanted(state).filter((x) => kind(x.home))
    // Centers: which of the two of a color goes where, so that they go by
    // an even permutation (3-cycles make no other).
    let assigned = kind === isWing ? undefined : evenAssignment(state, targets)
    for (const [index, w] of targets.entries()) {
      const target = PLACE.get(keyOf(w.position, w.normal))!
      const cell = w.position.join()
      // Home already (a center: the one the assignment sends there).
      if (assigned ? assigned[index] === target : atPlace(state, w)) {
        keep = [...keep, target]
        done.add(cell)
        keptCells.add(cell)
        continue
      }
      let moves: Move[]
      if (assigned) {
        moves = route(assigned[index]!, target, keptCells)
        const table = macroOf(moves).to
        assigned = assigned.map((p) => table[p]!)
      } else {
        const piece = state.find((c) => isWing(c) && colorsOf(c) === colorsOf(w.home))!
        moves = meet([...keep, placeOf(piece)], [...keep, target])
      }
      state = applyMoves(state, moves)
      all.push(...moves)
      keep = [...keep, target]
      done.add(cell)
      keptCells.add(cell)
    }
    return simplifyMoves(all)
  }
}

/** For each wanted center, the place of the center sent there: two of each
 *  color, so 64 ways; one making an even permutation, as many already home
 *  as can be. */
function evenAssignment(
  cube: Cube,
  targets: readonly { home: Cubie; position: Vec3; normal: Vec3 }[],
): number[] {
  const centers = cube.filter((c) => !isBlock(c) && c.stickers.length === 1)
  const cells = targets.map((t) => t.position.join())
  let best: number[] | undefined
  let bestHome = -1
  for (let mask = 0; mask < 1 << 6; mask++) {
    const used = new Set<Cubie>()
    const colorIndex = new Map<string, number>()
    const choice = targets.map((t) => {
      const color = colorsOf(t.home)
      if (!colorIndex.has(color)) colorIndex.set(color, colorIndex.size)
      const options = centers.filter((c) => colorsOf(c) === color && !used.has(c))
      const pick =
        options.length > 1 && mask & (1 << colorIndex.get(color)!) ? options[1]! : options[0]!
      used.add(pick)
      return pick
    })
    const images = choice.map((c) => cells.indexOf(c.position.join()))
    if (images.some((i) => i < 0) || odd(images)) continue
    const home = images.filter((i, k) => i === k).length
    if (home > bestHome) [best, bestHome] = [choice.map(placeOf), home]
  }
  if (!best) throw new Error('ai: these centers cannot go home')
  return best
}

// ---------------------------------------------------------------------------
// 3. The Pocket
// ---------------------------------------------------------------------------

/** The puzzle as a 2x2x2: each octant a corner, a big block's stickers or
 *  its small corner's. */
const asPocket = (cube: Cube): Cube =>
  cube
    .filter((c) => c.stickers.length === 3)
    .map((c) => ({ ...c, position: c.position.map(Math.sign) as unknown as Vec3 }))

function solvePocket(cube: Cube): Move[] {
  return solveOptimal2(asPocket(cube)).map((m) => {
    const move = m as Move
    return wide(move.face, move.amount)
  })
}

const TURNS = allTurnsOf('ai')

export const AI_PLAN: MethodPlan = [
  { key: 'stepAiStandard', goal: standard, moves: TURNS, phases: [toStandard] },
  { key: 'stepAiWings', goal: wingsDone, moves: TURNS, phases: [placeAll(isWing)] },
  {
    key: 'stepAiCenters',
    goal: octantsDone,
    moves: TURNS,
    phases: [placeAll((c) => c.stickers.length === 1)],
  },
  { key: 'stepAiPocket', goal: isSolved, moves: TURNS, phases: [solvePocket] },
]
