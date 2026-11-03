import { isSolved, solvedCube } from '../../core/cube'
import type { Cube, Cubie } from '../../core/types'
import { once } from '../../solve/once'
import type { MethodPlan } from '../../solve/solverKit'
import {
  bottomLayer,
  EVERY_TURN,
  homeOf,
  INSERT_CORNER,
  INSERT_EDGE,
  isCorner,
  isCube,
  isEdge,
  pairsFormula,
  piecesOf,
  placedTogether,
  QUARTERS,
  search,
  toCube,
  topCorners,
  topLayer,
} from './square1Kit'

/**
 * The Square-1, face by face, as francocube.com teaches it (Cyril's simple
 * method), its formulas written in pairs (`(x, y)`: the top turned x, the
 * bottom y):
 *
 *   1. Back to a cube      its layers' shapes only
 *   2. The first face      the bottom and its crown, piece by piece; the
 *                          page does it by feel, here with fan2cube's two
 *                          insertions (square1Kit) and the quarter turns
 *   3. Top corners         /(3,0)/(-3,0)/(-3,3)/(-3,0)/(3,0)/(0,-3) swaps
 *                          the two right ones, twice at most
 *   4. Top edges           (-2,0)/(0,3)/(-1,-1)/(1,-2)/(2,0) swaps two
 *                          neighbors on each layer (so played twice), and
 *                          the parity's: two opposite ones on top
 *   5. The middle          /(6,0)/(6,0)/ squares it, (1,-1)/(6,6)/ when its
 *                          colors stand the wrong way; the layers in line
 *
 * Each formula's effect is asserted in tests/unit/puzzles/twisted/square1.test.ts.
 */

export const SWAP_RIGHT_CORNERS = pairsFormula('/(3,0)/(-3,0)/(-3,3)/(-3,0)/(3,0)/(0,-3)')
export const SWAP_NEIGHBOR_EDGES = pairsFormula('(-2,0)/(0,3)/(-1,-1)/(1,-2)/(2,0)')
export const SWAP_OPPOSITE_EDGES = pairsFormula(
  '/(3,3)/(3,2)/(-4,2)/(-2,4)/(-2,0)/(-4,2)/(-5,1)/(3,0)/(3,3)/(0,-3)',
)
export const SQUARE_MIDDLE = pairsFormula('/(6,0)/(6,0)/')
export const TURN_MIDDLE = pairsFormula('(1,-1)/(6,6)/')

/** The first face's pieces in the order they are placed: its corners, then
 *  its edges. */
const FIRST_FACE = once(() => {
  const solved = solvedCube('square1')
  return [...piecesOf(solved, false, isCorner), ...piecesOf(solved, false, isEdge)]
})

/** The homes of the first face's first `n` pieces. */
const firstHomes = (n: number): Set<string> =>
  new Set(
    FIRST_FACE()
      .slice(0, n)
      .map((c) => c.position.join()),
  )

/** Whether the first `n` of the first face's pieces stand together, the
 *  puzzle a cube again. */
const firstPieces = (pieces: readonly Cubie[], n: number): boolean => {
  if (!isCube(pieces, false)) return false
  const homes = firstHomes(n)
  const placed = pieces.filter((c) => homes.has(homeOf(c).position.join()))
  return placed.length === n && placedTogether(placed)
}

const layersPlaced = (c: readonly Cubie[]) =>
  placedTogether(bottomLayer(c)) && placedTogether(topLayer(c))

export const SQUARE1_FACE_PLAN: MethodPlan = [
  {
    key: 'stepSq1Cube',
    goal: (c) => isCube(c, false),
    moves: EVERY_TURN,
    phases: [(c) => toCube(c, false)],
  },
  {
    key: 'stepSq1FirstFace',
    goal: (c) => isCube(c, false) && placedTogether(bottomLayer(c)),
    moves: EVERY_TURN,
    phases: Array.from({ length: 8 }, (_, i) => (cube: Cube) => {
      const homes = firstHomes(i + 1)
      return search(cube, (c) => homes.has(c.position.join()), {
        moves: QUARTERS,
        macros: [INSERT_CORNER, INSERT_EDGE],
        goal: (p) => firstPieces(p, i + 1),
        maxDepth: 10,
      })
    }),
  },
  {
    key: 'stepSq1TopCorners',
    goal: (c) =>
      isCube(c, false) && placedTogether(bottomLayer(c)) && placedTogether(topCorners(c)),
    moves: EVERY_TURN,
    phases: [
      (cube) =>
        search(cube, isEdge, {
          moves: QUARTERS,
          macros: [SWAP_RIGHT_CORNERS],
          goal: (p) => placedTogether(bottomLayer(p)) && placedTogether(topCorners(p)),
          maxDepth: 8,
        }),
    ],
  },
  {
    key: 'stepSq1TopEdges',
    goal: (c) => isCube(c, false) && layersPlaced(c),
    moves: EVERY_TURN,
    phases: [
      (cube) =>
        search(cube, isEdge, {
          moves: QUARTERS,
          macros: [SWAP_NEIGHBOR_EDGES, SWAP_OPPOSITE_EDGES],
          goal: layersPlaced,
          maxDepth: 10,
        }),
    ],
  },
  {
    key: 'stepSq1Middle',
    goal: isSolved,
    moves: EVERY_TURN,
    phases: [
      (cube) =>
        search(cube, () => true, {
          moves: QUARTERS,
          macros: [SQUARE_MIDDLE, TURN_MIDDLE],
          goal: isSolved,
          maxDepth: 6,
        }),
    ],
  },
]
