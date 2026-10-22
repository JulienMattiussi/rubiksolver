import { isSolved, solvedCube } from '../../core/cube'
import { allTurnsOf } from '../../core/moveSet'
import { colorsOf, homesOf, withStickers } from '../../core/pieces'
import { solvePieces } from '../../solve/pieceSearch'
import { parseRainbowMoves, RAINBOW_CORNERS } from '../../puzzles/shared/rainbow'
import type { MethodPlan } from '../../solve/solverKit'
import type { Cube, RainbowMove } from '../../core/types'
import { cycleTable, placeByCycles } from '../../solve/cycleTable'
import { fromEverySide } from '../shared/rainbowKit'
import { dot, vecKey } from '../../core/geometry'
import { once } from '../../solve/once'

/**
 * Rainbow, "extended triangle", as taught on fan2cube.fr (rainbow2):
 *
 *   1. The top triangle   its three pieces (fan2cube's "triangle
 *                         prolongé": each also completes the squares
 *                         around it), placed one by one by searching
 *   2. The rest           with fan2cube's two commutators, "place left"
 *                         [H' G'] and "place right" [H D] (each a 3-cycle
 *                         of pieces), from every side, set up by a turn;
 *                         once seven triangles are done the eighth is too
 *
 * Each formula's effect is asserted in tests/unit/puzzles/polyhedron/rainbow.test.ts.
 */

const SOLVED = solvedCube('rainbow')
const TURNS = allTurnsOf('rainbow')

const isPiece = withStickers(4)

/** The top triangle's three pieces. */
const TOP = homesOf('rainbow', (c) => isPiece(c) && dot(c.position, RAINBOW_CORNERS.U) === 2)

/** Where each piece belongs: the slot of its colors when solved (no two
 *  pieces wear the same four). */
const HOME_OF = new Map(SOLVED.filter(isPiece).map((c) => [colorsOf(c), vecKey(c.position)]))

const homes = (state: Cube) =>
  new Map(state.filter(isPiece).map((c) => [vecKey(c.position), HOME_OF.get(colorsOf(c))!]))

const topDone = (cube: Cube) =>
  TOP.every((p) => {
    const piece = cube.find((c) => vecKey(c.position) === vecKey(p))!
    return HOME_OF.get(colorsOf(piece)) === vecKey(p)
  })

/** fan2cube's two formulas, as the page writes them. */
export const PLACE_LEFT = parseRainbowMoves("[H' G']")
export const PLACE_RIGHT = parseRainbowMoves('[H D]')

/** Every 3-cycle of pieces, from the two formulas (built once). */
const cycles = once(() =>
  cycleTable(
    SOLVED,
    isPiece,
    [...fromEverySide(PLACE_LEFT), ...fromEverySide(PLACE_RIGHT)],
    TURNS.turns as RainbowMove[],
  ),
)

export const RAINBOW_PLAN: MethodPlan = [
  {
    key: 'stepRainbowTop',
    goal: topDone,
    moves: TURNS,
    phases: [
      (cube) =>
        solvePieces<RainbowMove>(cube, { track: TOP, among: isPiece, moves: TURNS, maxDepth: 14 }),
    ],
  },
  {
    key: 'stepRainbowRest',
    goal: isSolved,
    moves: TURNS,
    phases: [(cube) => placeByCycles(cube, cycles(), homes)],
  },
]
