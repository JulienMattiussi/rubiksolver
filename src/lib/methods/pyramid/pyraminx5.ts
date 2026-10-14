import { isSolved, solvedCube } from '../../core/cube'
import { normalIndex } from '../../core/geometry'
import type { MethodPlan } from '../../solve/solverKit'
import type { Cube, Cubie, PyraMove, PyraVertex, Vec3 } from '../../core/types'
import { cycleTable, handedHome, placeByCycles } from '../../solve/cycleTable'
import {
  alignCorners,
  cornersDone,
  faceColors,
  formula as pyraFormula,
  FORMULAS_ONLY,
  fromEverySide,
  groupSolver,
  pyraSet,
  showsFaces,
} from './pyraKit'

/**
 * Professor Pyraminx (the Pyraminx 5x5x5), "wings then co-wings", as taught
 * on fan2cube.fr (profpyraminx2), with its slices only (a face but in the
 * co-centers' formula, which turns it back):
 *
 *   1. Co-tips          a first-slice turn each: they say each face's color
 *   2. Tips             a tip turn each
 *   3. Centers          placed with third-slice turns (each cycles three):
 *                       the last step can only swap them two by two
 *   4. Wings            3-cycles [H'₁ D₃], [H₁ G'₃], [H₃ G'₁], [H'₃ D₁]
 *                       ("hide, raise, take, lower"), from every side, set
 *                       up by turns, one wing placed at a time
 *   5. Co-wings         the same with the second slice, [H'₂ D₃]...; they
 *                       stir the co-centers, done later
 *   6. Edges            placed with [G₂ D'₂] and D₂ H₂ D'₂ H₂ D₂ H₂ D'₂
 *                       (each cycles three), flipped two by two with
 *                       [G₂ D'₂][H'₂ D₂]
 *   7. Co-centers       3-cycles [H₃ G'₃]² G₄ [H₃ G'₃] G'₄ (the page's G,
 *                       "Gauche-opposé", is the face opposite the left
 *                       corner); they swap the centers two by two
 *   8. Centers again    [G₃ D'₃]³ swaps them two by two: (A,B)(G,D)
 *
 * Each formula's effect is asserted in tests/unit/puzzles/pyramid/pyraminx5.test.ts.
 */

const SIZE = 5
const formula = pyraFormula(SIZE)
const SOLVED = solvedCube('pyra5')

const slice = (n: 1 | 2 | 3) => (vertex: PyraVertex) => ({ vertex, slice: n })
const TIPS = pyraSet((vertex) => ({ vertex, tip: true }))
const CO_TIPS = pyraSet(slice(1))
const THIRD = pyraSet(slice(3))
const SECOND = pyraSet(slice(2))
const FACES = pyraSet((vertex) => ({ vertex, slice: 4 }))
/** Everything but the faces: the tips and the three inner slices. */
const SLICES: typeof TIPS = {
  generators: [CO_TIPS, SECOND, THIRD, TIPS].flatMap((set) => set.generators),
  turns: [CO_TIPS, SECOND, THIRD, TIPS].flatMap((set) => set.turns),
}

// The kinds of piece, by where they stand: the octahedra sit at odd
// coordinates (co-tips, co-wings, centers), the small tetrahedra at even
// ones (tips, wings, edges, co-centers); an edge has two zero coordinates.
const odd = (c: Cubie) => Math.abs(c.position[0]) % 2 === 1
const isEdge = (c: Cubie) =>
  c.stickers.length === 2 && !odd(c) && c.position.filter((x) => x === 0).length === 2
const isWing = (c: Cubie) => c.stickers.length === 2 && !odd(c) && !isEdge(c)
const isCoWing = (c: Cubie) => c.stickers.length === 2 && odd(c)
const isCoCenter = (c: Cubie) => c.stickers.length === 1 && !odd(c)
const isCenter = (c: Cubie) => c.stickers.length === 1 && odd(c)

const key = (p: Vec3) => p.join()
const solveGroup = groupSolver('pyra5')

/** Each piece of `among` in the slot its handedness says (cycleTable.ts). */
const handedHomes = (among: (c: Cubie) => boolean) => {
  const slots = SOLVED.filter(among)
  return (cube: Cube) => (state: Cube) => {
    const faces = faceColors(cube, SIZE)
    return new Map(state.filter(among).map((c) => [key(c.position), handedHome(c, slots, faces)]))
  }
}

/**
 * Where each co-center goes: those of one color are alike, so a wrong slot
 * sends its piece to any wrong slot wanting its color (each taken once);
 * a right one stays.
 */
const coCenterHomes = (cube: Cube) => (state: Cube) => {
  const faces = faceColors(cube, SIZE)
  const wants = (c: Cubie) => faces.get(normalIndex(c.stickers[0]!.normal))!
  const coCenters = state.filter(isCoCenter)
  const wrong = coCenters.filter((c) => c.stickers[0]!.color !== wants(c))
  const open = [...wrong]
  const homes = new Map(coCenters.map((c) => [key(c.position), key(c.position)]))
  for (const c of wrong) {
    const i = open.findIndex((slot) => wants(slot) === c.stickers[0]!.color)
    homes.set(key(c.position), key(open.splice(i, 1)[0]!.position))
  }
  return homes
}

let tables:
  | {
      wings: Map<string, PyraMove[]>
      coWings: Map<string, PyraMove[]>
      coCenters: Map<string, PyraMove[]>
    }
  | undefined

/** The 3-cycle tables of the three kinds placed one at a time (built once). */
function cycleTables() {
  const sides = (texts: string[]) => texts.flatMap((f) => fromEverySide(formula(f)))
  const setups = SLICES.turns as PyraMove[]
  tables ??= {
    wings: cycleTable(
      SOLVED,
      isWing,
      sides(["[H'1 D3]", "[H1 G'3]", "[H3 G'1]", "[H'3 D1]"]),
      setups,
    ),
    coWings: cycleTable(
      SOLVED,
      isCoWing,
      sides(["[H'2 D3]", "[H2 G'3]", "[H3 G'2]", "[H'3 D2]"]),
      setups,
      isCoCenter,
    ),
    coCenters: cycleTable(
      SOLVED,
      isCoCenter,
      sides(["[H3 G'3][H3 G'3] G4 [H3 G'3] G4'"]),
      setups,
      isCenter,
    ),
  }
  return tables
}

const wingHomes = handedHomes(isWing)
const coWingHomes = handedHomes(isCoWing)

const EDGE_CYCLES = ["[G2 D'2]", "D2 H2 D'2 H2 D2 H2 D'2"].flatMap((f) => fromEverySide(formula(f)))
const EDGE_FLIPS = fromEverySide(formula("[G2 D'2][H'2 D2]"))
const CENTER_SWAPS = fromEverySide(formula("[G3 D'3][G3 D'3][G3 D'3]"))

const home = (cube: Cube, keep: (c: Cubie) => boolean) => {
  const right = showsFaces(faceColors(cube, SIZE))
  return cube.filter(keep).every(right)
}
const cornersGoal = (tips: boolean) => (c: Cube) => cornersDone(c, SIZE, tips)
const centersGoal = (c: Cube) => cornersDone(c, SIZE, true) && home(c, isCenter)
const wingsGoal = (c: Cube) => centersGoal(c) && home(c, isWing)
const coWingsGoal = (c: Cube) => wingsGoal(c) && home(c, isCoWing)
const edgesGoal = (c: Cube) => coWingsGoal(c) && home(c, isEdge)
const coCentersGoal = (c: Cube) =>
  cornersDone(c, SIZE, true) && [isWing, isCoWing, isEdge, isCoCenter].every((k) => home(c, k))

export const PYRAMINX5_PLAN: MethodPlan = [
  {
    key: 'stepCoTips',
    goal: cornersGoal(false),
    moves: CO_TIPS,
    phases: [alignCorners(SIZE, false, slice(1))],
  },
  {
    key: 'stepPyraTips',
    goal: cornersGoal(true),
    moves: TIPS,
    phases: [alignCorners(SIZE, true, (vertex) => ({ vertex, tip: true }))],
  },
  {
    key: 'stepPlaceCenters',
    goal: centersGoal,
    moves: THIRD,
    phases: [solveGroup(isCenter, THIRD, [], 4)],
  },
  {
    key: 'stepWings',
    goal: wingsGoal,
    moves: SLICES,
    phases: [(cube) => placeByCycles(cube, cycleTables().wings, wingHomes(cube))],
  },
  {
    key: 'stepCoWings',
    goal: coWingsGoal,
    moves: SLICES,
    phases: [(cube) => placeByCycles(cube, cycleTables().coWings, coWingHomes(cube))],
  },
  {
    key: 'stepPyraEdges',
    goal: edgesGoal,
    moves: SLICES,
    phases: [
      solveGroup(isEdge, FORMULAS_ONLY, EDGE_CYCLES, 6, true),
      solveGroup(isEdge, FORMULAS_ONLY, EDGE_FLIPS, 6),
    ],
  },
  {
    key: 'stepCoCenters',
    goal: coCentersGoal,
    // Its formula turns a face, and turns it back.
    moves: {
      generators: [...SLICES.generators, ...FACES.generators],
      turns: [...SLICES.turns, ...FACES.turns],
    },
    phases: [(cube) => placeByCycles(cube, cycleTables().coCenters, coCenterHomes(cube))],
  },
  {
    key: 'stepFinishCenters',
    goal: isSolved,
    moves: SLICES,
    phases: [solveGroup(isCenter, FORMULAS_ONLY, CENTER_SWAPS, 3)],
  },
]
