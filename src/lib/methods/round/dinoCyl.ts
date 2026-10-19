import { isSolved, solvedCube } from '../../core/cube'
import { vecKey } from '../../core/geometry'
import { allTurnsOf } from '../../core/moveSet'
import { invertMoves } from '../../core/moves'
import { colorsOf, withStickers } from '../../core/pieces'
import { parseDinoMoves } from '../../puzzles/shared/rainbow'
import type { MethodPlan } from '../../solve/solverKit'
import { applyMoves } from '../../core/turn'
import type { Cube, Cubie, RainbowMove } from '../../core/types'
import { dinoLayers } from '../diagonal/dino'
import { fromEverySide } from '../shared/rainbowKit'
import { holdingsOf, holdingsShowing } from '../../solve/holdings'

/**
 * Dino Cylinder, as fan2cube.fr teaches it (dinocylinder2), "à peine
 * différente" from the Dino Cube's, with two formulas:
 *
 *   1-3. Edges   the Dino's [GA'] = GA'G'A, a 3-cycle of edges, the top's,
 *                the middle's, the bottom's (dino.ts); placed, they turn the
 *                right way round
 *   4.   Corners turned by (A)+ = [AD]A'[DA'], which turns the corner A
 *                alone, from every side, both ways
 *
 * Its corners never move: they tell how the puzzle is held, and so where
 * each edge belongs (an even permutation away, as 3-cycles reach).
 */

const SOLVED = solvedCube('dinoCyl')
const TURNS = allTurnsOf('dinoCyl')
const isCorner = withStickers(3)
const isEdge = (c: Cubie) => !isCorner(c)

/** The page's corner turn: (A)+, the corner A a third clockwise. */
export const CORNER_TURN = parseDinoMoves("[AD]A'[DA']")

/** The solved puzzle held every way. */
const HELD: readonly Cube[] = holdingsOf(SOLVED)

/** The way of holding it the corners say (they never move), as each
 *  piece's home by its colors. */
function targetOf(state: Cube): Map<string, string> {
  const held = holdingsShowing(HELD, state, isCorner, colorsOf)[0]
  if (!held) throw new Error('dinoCyl: its corners are not a puzzle held any way')
  return new Map(held.map((c) => [colorsOf(c), vecKey(c.position)]))
}

/** The corner turns, from every side, both ways, and what each turns. */
const TURNERS = fromEverySide(CORNER_TURN).flatMap((moves) => [moves, invertMoves(moves)])

/** Each corner turned back, by the fewest formulas (one or two). */
function turnCorners(cube: Cube): RainbowMove[] {
  let state = cube
  const all: RainbowMove[] = []
  const pose = (c: Cubie) => c.stickers.map((s) => s.normal.join()).join('|')
  // The target's corners, by position: each as it should stand.
  const want = (s: Cube) => {
    const home = targetOf(s)
    const held = HELD.find((h) => h.every((c) => home.get(colorsOf(c)) === vecKey(c.position)))!
    return new Map(held.filter(isCorner).map((c) => [vecKey(c.position), pose(c)]))
  }
  for (let guard = 0; guard < 16; guard++) {
    const target = want(state)
    const off = state.filter((c) => isCorner(c) && target.get(vecKey(c.position)) !== pose(c))
    if (!off.length) return all
    const at = vecKey(off[0]!.position)
    const home = (s: Cube) => {
      const c = s.find((p) => vecKey(p.position) === at)!
      return target.get(at) === pose(c)
    }
    const moves = TURNERS.find((m) => home(applyMoves(state, m)))
    if (!moves) throw new Error('dinoCyl: this corner cannot turn back')
    state = applyMoves(state, moves)
    all.push(...moves)
  }
  throw new Error('dinoCyl: the corners cannot turn back')
}

export const DINO_CYL_PLAN: MethodPlan = [
  ...dinoLayers(SOLVED, targetOf, isEdge),
  { key: 'stepDinoCylCorners', goal: isSolved, moves: TURNS, phases: [turnCorners] },
]
