import { isSolved, solvedCube } from '../cube'
import { allTurnsOf } from '../moveSet'
import { invertMoves } from '../moves'
import { colorsOf } from '../pieces'
import { parseDinoMoves } from '../rainbow'
import type { MethodPlan } from '../solverKit'
import type { Cube, Cubie, RainbowMove, Vec3 } from '../types'
import { cycleTable, placeByCycles } from './pyraCycles'
import { fromEverySide, heldTargets, isEven } from './rainbowKit'

/**
 * Rex Cube, "edges, centers, petals", as taught on fan2cube.fr (rexcube2):
 *
 *   1. Edges    3-cycles of edges, [GA'] = GA'G'A (the centers and petals
 *               stirred, fixed after)
 *   2. Centers  3-cycles of centers, [DG'] = DG'D'G (petals stirred)
 *   3. Petals   with [DG'][D'B], which swaps petals and nothing else: set
 *               up by a turn, then played again, it makes 3-cycles
 *
 * Each formula from every side, set up by a turn undone after. Nothing is
 * fixed: the solved puzzle aimed at is the way of holding it nearest the
 * state that 3-cycles can reach (an even permutation of its edges and of
 * its centers); it solves either way round (left and right swapped, as the
 * Dino does), both tried.
 */

const SOLVED = solvedCube('rex')
const TURNS = allTurnsOf('rex')
const SETUPS = TURNS.turns as RainbowMove[]
const key = (p: Vec3) => p.join()

const isEdge = (c: Cubie) => c.stickers.length === 2
const isCenter = (c: Cubie) =>
  c.stickers.length === 1 && c.position.filter((x) => x !== 0).length === 1
const isPetal = (c: Cubie) => c.stickers.length === 1 && !isCenter(c)

const EDGE_CYCLE = parseDinoMoves("[GA']", 'rex')
const CENTER_CYCLE = parseDinoMoves("[DG']", 'rex')
const PETAL_SWAP = parseDinoMoves("[DG'][D'B]", 'rex')

let edgeTable: Map<string, RainbowMove[]> | undefined
let centerTable: Map<string, RainbowMove[]> | undefined
const edgeCycles = () =>
  (edgeTable ??= cycleTable(SOLVED, isEdge, fromEverySide(EDGE_CYCLE), SETUPS, (c) => !isEdge(c)))
const centerCycles = () =>
  (centerTable ??= cycleTable(SOLVED, isCenter, fromEverySide(CENTER_CYCLE), SETUPS, isPetal))

/**
 * Pure 3-cycles of petals. The page's formula swaps two pairs of petals of
 * one face each (so it changes nothing on a solved face); played once set
 * up by a turn or two and once as it is, two of its swaps that share a
 * petal leave a 3-cycle, across faces. Then set up by turns.
 */
let petalTable: Map<string, RainbowMove[]> | undefined
const petalCycles = () => {
  if (petalTable) return petalTable
  const setups = [...SETUPS.map((s) => [s]), ...SETUPS.flatMap((a) => SETUPS.map((b) => [a, b]))]
  const formulas = fromEverySide(PETAL_SWAP).flatMap((swap) =>
    setups.map((s) => [...s, ...swap, ...invertMoves(s), ...swap]),
  )
  return (petalTable = cycleTable(SOLVED, isPetal, formulas, SETUPS))
}

/** Every solved puzzle: both solutions, each held every way. */
const TARGETS = heldTargets(SOLVED)

/** A target's homes: the slot of each edge's and center's colors, and each
 *  petal slot's color. */
function homesOf(target: Cube) {
  return {
    home: new Map(target.filter((c) => !isPetal(c)).map((c) => [colorsOf(c), key(c.position)])),
    petal: new Map(target.filter(isPetal).map((c) => [key(c.position), c.stickers[0]!.color])),
  }
}

/** The target the state is nearest, among those its 3-cycles reach. */
function targetOf(state: Cube) {
  let best: ReturnType<typeof homesOf> | undefined
  let most = -1
  for (const target of TARGETS) {
    const homes = homesOf(target)
    if (!isEven(state.filter(isEdge), homes.home) || !isEven(state.filter(isCenter), homes.home))
      continue
    const right =
      state.filter((c) => !isPetal(c) && homes.home.get(colorsOf(c)) === key(c.position)).length *
        4 +
      state.filter((c) => isPetal(c) && homes.petal.get(key(c.position)) === c.stickers[0]!.color)
        .length
    if (right > most) [best, most] = [homes, right]
  }
  return best!
}

/** Each piece of a kind, from where it stands to its home. */
const homesFor = (kind: (c: Cubie) => boolean) => (state: Cube) => {
  const { home } = targetOf(state)
  return new Map(state.filter(kind).map((c) => [key(c.position), home.get(colorsOf(c))!]))
}

const placed = (kind: (c: Cubie) => boolean) => (state: Cube) =>
  [...homesFor(kind)(state)].every(([at, to]) => at === to)
const edgesDone = placed(isEdge)
const centersDone = (state: Cube) => edgesDone(state) && placed(isCenter)(state)

/** Which of the two families of petals a slot is in: they point to the
 *  corners of one tetrahedron or the other, which no turn mixes. */
const family = (slot: string) => slot.split(',').reduce((p, x) => p * Math.sign(Number(x)), 1)

/** Each petal sent to a slot of its color: those right stay, the others
 *  each to one of the wrong slots of their color; one family at a time. */
const petalHomes = (side: number) => (state: Cube) => {
  const { petal } = targetOf(state)
  // One family at a time (the other's petals left where they are).
  const petals = state.filter((c) => isPetal(c) && family(key(c.position)) === side)
  const colorAt = (c: Cubie) => c.stickers[0]!.color
  const right = (c: Cubie) => petal.get(key(c.position)) === colorAt(c)
  const free = petals.filter((c) => !right(c)).map((c) => key(c.position))
  return new Map(
    petals.map((c) => {
      const at = key(c.position)
      if (right(c)) return [at, at]
      const slot = free.findIndex((s) => petal.get(s) === colorAt(c))
      return [at, free.splice(slot, 1)[0]!]
    }),
  )
}

export const REX_PLAN: MethodPlan = [
  {
    key: 'stepRexEdges',
    goal: edgesDone,
    moves: TURNS,
    phases: [(cube) => placeByCycles(cube, edgeCycles(), homesFor(isEdge))],
  },
  {
    key: 'stepRexCenters',
    goal: centersDone,
    moves: TURNS,
    phases: [(cube) => placeByCycles(cube, centerCycles(), homesFor(isCenter))],
  },
  {
    key: 'stepRexPetals',
    goal: isSolved,
    moves: TURNS,
    phases: [1, -1].map(
      (side) => (cube: Cube) => placeByCycles(cube, petalCycles(), petalHomes(side)),
    ),
  },
]
