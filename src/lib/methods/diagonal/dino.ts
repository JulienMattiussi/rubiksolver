import { isSolved, solvedCube } from '../../core/cube'
import { allTurnsOf } from '../../core/moveSet'
import { colorsOf } from '../../core/pieces'
import { parseDinoMoves } from '../../puzzles/shared/rainbow'
import type { MethodPlan } from '../../solve/solverKit'
import type { Cube, Cubie, RainbowMove, Vec3 } from '../../core/types'
import { cycleTable, placeByCycles } from '../../solve/cycleTable'
import { fromEverySide, heldTargets, isEven } from '../shared/rainbowKit'

/**
 * Dino Cube, "layer by layer", as taught on fan2cube.fr (dinocube2), with
 * its one formula, [GA'] = G A' G' A, a 3-cycle of edges (HA)->(HD)->(HG),
 * from every side and set up by a turn (its pieces turn the right way round
 * once in place):
 *
 *   1. The top     its four edges (the page holds white on top)
 *   2. The middle  the four of the equator
 *   3. The bottom  the last four
 *
 * Nothing is fixed, so the solved puzzle is the one, among its ways of
 * being held, nearest the state; and it solves two ways (the page's "two
 * solutions": left and right faces swapped, a mirror, which a 3-cycle
 * cannot undo), so both are tried, the one an even permutation away kept.
 */

const SOLVED = solvedCube('dino')
const TURNS = allTurnsOf('dino')
const key = (p: Vec3) => p.join()

/** The page's formula, as it writes it. */
const DINO_CYCLE = parseDinoMoves("[GA']")

const TABLES = new Map<Cube, Map<string, RainbowMove[]>>()
/** The 3-cycles of edges of a solved puzzle (the Dino's, the Cylinder's:
 *  its corners never move). */
const dinoCycles = (solved: Cube, isEdge: (c: Cubie) => boolean = () => true) => {
  let table = TABLES.get(solved)
  if (!table) {
    table = cycleTable(solved, isEdge, fromEverySide(DINO_CYCLE), TURNS.turns as RainbowMove[])
    TABLES.set(solved, table)
  }
  return table
}

/** Every solved puzzle: both solutions, each held every way. */
const TARGETS = heldTargets(SOLVED)

/** Where each piece belongs in a target: the slot of its colors. */
const homeIn = (target: Cube) => new Map(target.map((c) => [colorsOf(c), key(c.position)]))

/** The target the state is nearest (most pieces home), among those a
 *  3-cycle can reach. */
function targetOf(state: Cube): Map<string, string> {
  let best: Map<string, string> | undefined
  let most = -1
  for (const target of TARGETS) {
    const home = homeIn(target)
    if (!isEven(state, home)) continue
    const right = state.filter((c) => home.get(colorsOf(c)) === key(c.position)).length
    if (right > most) [best, most] = [home, right]
  }
  return best!
}

/**
 * The page's three steps, its edges placed layer by layer (top, middle,
 * bottom), toward the target `targetOf` says (where each piece belongs, by
 * its colors); `isEdge`, the pieces placed (the Cylinder's corners left).
 */
export function dinoLayers(
  solved: Cube,
  targetOf: (state: Cube) => Map<string, string>,
  isEdge: (c: Cubie) => boolean = () => true,
): MethodPlan {
  /** The edges whose home is in the layers `rows` (y), each mapped from
   *  where it stands to that home; the others left where they are. */
  const homesIn = (rows: readonly number[]) => (state: Cube) => {
    const home = targetOf(state)
    return new Map(
      state.filter(isEdge).map((c) => {
        const to = home.get(colorsOf(c))!
        const y = Number(to.split(',')[1])
        return [key(c.position), rows.includes(y) ? to : key(c.position)]
      }),
    )
  }
  const layerDone = (rows: readonly number[]) => (state: Cube) =>
    [...homesIn(rows)(state)].every(([at, to]) => at === to)
  const ALL = [1, 0, -1]
  const step = (key: string, rows: number[]) => ({
    key,
    goal: layerDone(rows),
    moves: TURNS,
    phases: [
      (cube: Cube) => {
        const table = dinoCycles(solved, isEdge)
        try {
          return placeByCycles(cube, table, homesIn(rows))
        } catch {
          // Two of the layer's edges left swapped, which no 3-cycle among
          // them undoes: the layer done with the edges below, not placed yet
          // (all placed, this layer with them).
          return placeByCycles(cube, table, homesIn(ALL))
        }
      },
    ],
  })
  return [
    step('stepDinoTop', [1]),
    step('stepDinoMiddle', [1, 0]),
    step('stepDinoBottom', [1, 0, -1]),
  ]
}

export const DINO_PLAN: MethodPlan = dinoLayers(SOLVED, targetOf).map((spec, i) =>
  i === 2 ? { ...spec, goal: isSolved } : spec,
)
