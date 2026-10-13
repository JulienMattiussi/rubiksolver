import { isSolved, solvedCube } from '../cube'
import { allTurnsOf } from '../moveSet'
import { colorsOf } from '../pieces'
import { parseDinoMoves } from '../rainbow'
import type { MethodPlan } from '../solverKit'
import type { Cube, RainbowMove, Vec3 } from '../types'
import { cycleTable, placeByCycles } from './pyraCycles'
import { fromEverySide, heldTargets, isEven } from './rainbowKit'

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

let table: Map<string, RainbowMove[]> | undefined
const cycles = () =>
  (table ??= cycleTable(
    SOLVED,
    () => true,
    fromEverySide(DINO_CYCLE),
    TURNS.turns as RainbowMove[],
  ))

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

/** The pieces whose home is in the layers `rows` (y), each mapped from where
 *  it stands to that home; the others left where they are. */
const homesIn = (rows: readonly number[]) => (state: Cube) => {
  const home = targetOf(state)
  return new Map(
    state.map((c) => {
      const to = home.get(colorsOf(c))!
      const y = Number(to.split(',')[1])
      return [key(c.position), rows.includes(y) ? to : key(c.position)]
    }),
  )
}

const layerDone = (rows: readonly number[]) => (state: Cube) => {
  const home = homesIn(rows)(state)
  return [...home].every(([at, to]) => at === to)
}

export const DINO_PLAN: MethodPlan = [
  {
    key: 'stepDinoTop',
    goal: layerDone([1]),
    moves: TURNS,
    phases: [(cube) => placeByCycles(cube, cycles(), homesIn([1]))],
  },
  {
    key: 'stepDinoMiddle',
    goal: layerDone([1, 0]),
    moves: TURNS,
    phases: [(cube) => placeByCycles(cube, cycles(), homesIn([1, 0]))],
  },
  {
    key: 'stepDinoBottom',
    goal: isSolved,
    moves: TURNS,
    phases: [(cube) => placeByCycles(cube, cycles(), homesIn([1, 0, -1]))],
  },
]
