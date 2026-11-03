import { isSolved } from '../../core/cube'
import type { Cube, Cubie, SectorMove } from '../../core/types'
import type { MethodPlan } from '../../solve/solverKit'
import {
  bottomCorners,
  bottomLayer,
  EVERY_TURN,
  formula,
  INSERT_CORNER,
  INSERT_EDGE,
  isCube,
  isEdge,
  offsetOf,
  piecesOf,
  placedTogether,
  QUARTERS,
  search,
  toCube,
  topCorners,
  topLayer,
} from './square1Kit'

/**
 * The Square-1, corners first, as fan2cube.fr teaches it (squareone2):
 *
 *   1. Back to a cube      its layers' shapes, the middle square too
 *   2. Bottom corners      one by one, (HDA)->(BAD) = -B/3/3/6/B (square1Kit)
 *   3. Top corners         (HGP)<->(HAG) = 3/-3+3B/3/-3B/3B/-3B/
 *   4. Bottom edges        one by one, (HD)->(BD) = 1/-3B/-1-4B/1+B/3B/3B/-1
 *                          (square1Kit)
 *   5. Top edges           E = 1/-3B/-1/3/1/3B/-1/-3/, (HG)->(HD)->(HP),
 *                          and the parity's formula, one time in two
 *   6. Layers in line      quarter turns of the top and the bottom
 *
 * Each step searches among its formulas and the layers' quarter turns,
 * which keep it a cube; each formula's effect is asserted in
 * tests/unit/puzzles/twisted/square1.test.ts.
 */

export const SWAP_TOP_CORNERS = formula('3/-3+3B/3/-3B/3B/-3B/')
export const TOP_EDGES = formula('1/-3B/-1/3/1/3B/-1/-3/')
export const PARITY = formula('/-3/ 3B/-3B/3B/ 2/2B/-2/ 4/-2B/2B/ -1+4B/6-3B/6/6+3B')

/** At least `n` of these pieces in their layer, as far from home. */
function atLeast(pieces: readonly Cubie[], n: number): boolean {
  const counts = new Map<number, number>()
  for (const c of pieces) {
    const offset = offsetOf(c)
    if (offset !== null) counts.set(offset, (counts.get(offset) ?? 0) + 1)
  }
  return Math.max(0, ...counts.values()) >= n
}

/** One more piece placed with the others, by a formula and quarter turns. */
const placing =
  (
    keep: (c: Cubie) => boolean,
    macros: readonly (readonly SectorMove[])[],
    goal: (pieces: readonly Cubie[]) => boolean,
  ) =>
  (cube: Cube): SectorMove[] =>
    search(cube, keep, { moves: QUARTERS, macros, goal, maxDepth: 10 })

const cornersDone = (c: readonly Cubie[]) =>
  placedTogether(bottomCorners(c)) && placedTogether(topCorners(c))

/** The bottom edges, `n` of them, with the bottom corners. */
const bottomEdges = (c: readonly Cubie[], n: number) => {
  const corners = bottomCorners(c)
  const offset = offsetOf(corners[0]!)
  return (
    cornersDone(c) && piecesOf(c, false, isEdge).filter((e) => offsetOf(e) === offset).length >= n
  )
}

export const SQUARE1_CORNERS_PLAN: MethodPlan = [
  {
    key: 'stepSq1Cube',
    goal: (c) => isCube(c),
    moves: EVERY_TURN,
    phases: [(c) => toCube(c, true)],
  },
  {
    key: 'stepSq1BottomCorners',
    goal: (c) => isCube(c) && placedTogether(bottomCorners(c)),
    moves: EVERY_TURN,
    phases: [1, 2, 3, 4].map((n) =>
      placing(
        () => false,
        [INSERT_CORNER],
        (p) => atLeast(bottomCorners(p), n),
      ),
    ),
  },
  {
    key: 'stepSq1TopCorners',
    goal: (c) => isCube(c) && cornersDone(c),
    moves: EVERY_TURN,
    phases: [placing(() => false, [SWAP_TOP_CORNERS], cornersDone)],
  },
  {
    key: 'stepSq1BottomEdges',
    goal: (c) => isCube(c) && cornersDone(c) && placedTogether(bottomLayer(c)),
    moves: EVERY_TURN,
    phases: [1, 2, 3, 4].map((n) => placing(isEdge, [INSERT_EDGE], (p) => bottomEdges(p, n))),
  },
  {
    key: 'stepSq1TopEdges',
    goal: (c) => isCube(c) && placedTogether(bottomLayer(c)) && placedTogether(topLayer(c)),
    moves: EVERY_TURN,
    phases: [
      placing(
        isEdge,
        [TOP_EDGES, PARITY],
        (p) => placedTogether(bottomLayer(p)) && placedTogether(topLayer(p)),
      ),
    ],
  },
  {
    key: 'stepSq1InLine',
    goal: isSolved,
    moves: EVERY_TURN,
    phases: [(cube) => search(cube, () => true, { moves: QUARTERS, goal: isSolved, maxDepth: 4 })],
  },
]
