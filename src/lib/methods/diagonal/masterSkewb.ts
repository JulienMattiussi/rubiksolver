import { faceColorsOf, isSolved, solvedCube } from '../../core/cube'
import { invertMoves } from '../../core/moves'
import { allTurnsOf } from '../../core/moveSet'
import { cycleTable, placeByCycles } from '../../solve/cycleTable'
import type { MethodPlan } from '../../solve/solverKit'
import type { Cube, Cubie, RainbowMove, Vec3 } from '../../core/types'
import { faceOfNormal } from '../../core/geometry'
import { aroundTop } from '../shared/skewbKit'
import { skewbFirst } from './skewb'

/**
 * Master Skewb, "Skewb d'abord", as taught on fan2cube.fr (masterskewb3):
 *
 *   1. The Skewb      its corners and centers, solved as a Skewb's ("le
 *                     Haut d'abord", skewb.ts): its outer layers turn them
 *                     as a Skewb's turns do
 *   2. The edges      (HG) -> (HD) -> (AD) = o'.(P'DP).o.(P'D'P) and its
 *                     mirror (HP) -> (HA) -> (AD) = e.(PG'P').e'.(PGP')
 *   3. The petals     (D) -> (P) -> (G) = e.(D'GD).e'.(D'G'D) and its mirror
 *                     (A) -> (G) -> (P) = o'.(GD'G').o.(GDG')
 *
 * Each formula set up by turns, a corner's or a slice's, until every
 * 3-cycle is found (cycleTable.ts: the page's conjugations, "(PA) ...
 * (A'P')", "(D'o'PA) ..."), as the Rex Cube's. Petals of a color are alike:
 * each place wants its face's color, in each of their two families. Each formula's effect is asserted in
 * tests/unit/puzzles/diagonal/masterSkewb.test.ts.
 */

/** (HG) -> (HD) -> (AD), and its mirror (HP) -> (HA) -> (AD). */
export const EDGE_CYCLES = ["o'(P'DP)o(P'D'P)", "e(PG'P')e'(PGP')"]
/** (D) -> (P) -> (G), and its mirror (A) -> (G) -> (P). */
export const PETAL_CYCLES = ["e(D'GD)e'(D'G'D)", "o'(GD'G')o(GDG')"]

const { steps, kit, skewb, parse } = skewbFirst('masterSkewb', 'master')
const { held } = kit
const TURNS = allTurnsOf('masterSkewb')
const SOLVED = solvedCube('masterSkewb')

const isPetal = (c: Cubie) =>
  c.stickers.length === 1 && c.position.filter((v) => v !== 0).length > 1
const EDGES = SOLVED.filter((c) => c.stickers.length === 2).map((c) => c.position)

/** The color a petal slot wants: its face's. */
const colorOf = (p: Vec3) =>
  faceColorsOf('masterSkewb')[
    faceOfNormal(p.map((v) => (Math.abs(v) === 4 ? Math.sign(v) : 0)) as unknown as Vec3)
  ]

/** The setups: a turn of every corner's outer layer, or of a slice (the
 *  page's (PA)..., (D'o'PA)...). */
const SETUPS = TURNS.turns as RainbowMove[]

/** Each formula from each side of the top (t H: a quarter round takes
 *  petals of one family to the other's slots), both ways. */
const bothWays = (formulas: readonly string[]) =>
  formulas.flatMap((f) => aroundTop(parse(f))).flatMap((f) => [f, invertMoves(f)])

const key = (p: Vec3) => p.join()
const isEdge = (c: Cubie) => c.stickers.length === 2
const colorsOf = (c: Cubie) =>
  c.stickers
    .map((s) => s.color)
    .sort()
    .join()

/** Every 3-cycle of edges (the petals stirred: placed after) and of
 *  petals, built once. */
let edgeTable: Map<string, RainbowMove[]> | undefined
const edgeCycles = () =>
  (edgeTable ??= cycleTable(SOLVED, isEdge, bothWays(EDGE_CYCLES), SETUPS, isPetal))
let petalTable: Map<string, RainbowMove[]> | undefined
const petalCycles = () =>
  (petalTable ??= cycleTable(SOLVED, isPetal, bothWays(PETAL_CYCLES), SETUPS))

/** Each edge sent to its own slot (an edge is one of a kind). */
const edgeHomes = (state: Cube) => {
  const homes = new Map(SOLVED.filter(isEdge).map((c) => [colorsOf(c), key(c.position)]))
  return new Map(state.filter(isEdge).map((c) => [key(c.position), homes.get(colorsOf(c))!]))
}

/** Which of the two families of petals a slot is in (its coordinates'
 *  signs multiplied): no turn takes a petal from one to the other. */
const family = (p: Vec3) => Math.sign(p[0] * p[1] * p[2])

/** Each petal of a family sent to a slot of its color: those right stay,
 *  the others to the wrong slots of their color. */
const petalHomes = (side: number) => (state: Cube) => {
  const petals = state.filter((c) => isPetal(c) && family(c.position) === side)
  const colorAt = (c: Cubie) => c.stickers[0]!.color
  const right = (c: Cubie) => colorOf(c.position) === colorAt(c)
  const free = petals.filter((c) => !right(c)).map((c) => c.position)
  return new Map(
    petals.map((c) => {
      const at = key(c.position)
      if (right(c)) return [at, at]
      const slot = free.findIndex((s) => colorOf(s) === colorAt(c))
      return [at, key(free.splice(slot, 1)[0]!)]
    }),
  )
}

export const MASTER_SKEWB_PLAN: MethodPlan = [
  ...steps,
  {
    key: 'stepMasterEdges',
    goal: (cube) => kit.home([...skewb, ...EDGES])(cube),
    moves: TURNS,
    phases: [held((cube) => placeByCycles(cube, edgeCycles(), edgeHomes))],
  },
  {
    key: 'stepMasterPetals',
    goal: isSolved,
    moves: TURNS,
    phases: [1, -1].map((side) =>
      held((cube) => placeByCycles(cube, petalCycles(), petalHomes(side))),
    ),
  },
]
