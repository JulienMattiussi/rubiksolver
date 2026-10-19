import { isBlock } from '../../puzzles/bandaged/ai'
import { isSolved, solvedCube } from '../../core/cube'
import { AXIS_ROTATIONS, mapVec } from '../../core/geometry'
import { simplifyMoves } from '../../core/moves'
import { allTurnsOf } from '../../core/moveSet'
import type { MethodPlan } from '../../solve/solverKit'
import {
  centerRoute,
  inner,
  keyOf,
  macroOf,
  MECHANISM,
  meet,
  first,
  PLACE,
  placeOf,
  standard,
  wide,
} from './aiFormulas'
import { applyMove, applyMoves } from '../../core/turn'
import type { Cube, Cubie, Move, Vec3 } from '../../core/types'
import { solveOptimal2 } from '../standard/cube2'
import { colorsOf, withStickers } from '../../core/pieces'
import { permutationIsOdd } from '../../solve/permutation'
import { found, searchFormulas } from '../../solve/formulaSearch'

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

/** The fewest half turns bringing the big blocks below. */
function toStandard(cube: Cube): Move[] {
  return found(
    searchFormulas(
      cube.filter(isBlock),
      HALVES.map((move) => [move]),
      standard,
      { key: blocksOf, depth: 7, mechanism: MECHANISM },
    ),
    'ai: the big blocks cannot go below',
  )
}

// ---------------------------------------------------------------------------
// 1-2. Each octant around its small corner
// ---------------------------------------------------------------------------

const SOLVED4 = solvedCube('4')
const sign = (p: readonly number[]) => p.map(Math.sign).join()

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

const isWing = withStickers(2)
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
      if (images.every((i) => i >= 0) && permutationIsOdd(images)) {
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
        moves = centerRoute(assigned[index]!, target, keptCells)
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
    if (images.some((i) => i < 0) || permutationIsOdd(images)) continue
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
    .map((c) => ({ ...c, position: mapVec(c.position, Math.sign) }))

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
