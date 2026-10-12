import { isSolved, solvedCube } from '../cube'
import type { MethodPlan } from '../solverKit'
import type { Cube, Cubie, PyraMove, PyraVertex, Vec3 } from '../types'
import { cycleTable, handedHome, placeByCycles } from './pyraCycles'
import {
  alignCorners,
  cornersDone,
  faceColors,
  formula as pyraFormula,
  groupSolver,
  FORMULAS_ONLY,
  fromEverySide,
  pyraSet,
  showsFaces,
} from './pyraKit'

/**
 * Master Pyraminx, "wings then midges", as taught on fan2cube.fr
 * (pyraminx42), with its slices only (never a face: a face turn is the whole
 * puzzle turned with the three other slices):
 *
 *   1. Co-tips          a first-slice turn each, like the Pyraminx's centers
 *   2. Tips             a tip turn each
 *   3. Centers          placed with second-slice turns (each a 3-cycle of
 *                       centers): the formulas of step 5 can only swap them
 *                       two by two, so a 3-cycle must be undone now
 *   4. Wings            3-cycles of a face's wings: [H'₁ D₂], [H₁ G'₂],
 *                       [H₂ G'₁], [H'₂ D₁] (reserve, raise, take, lower),
 *                       from every side, set up by turns, one wing placed
 *                       at a time
 *   5. Midges           placed with [H'₂ D₂] and D₂ H₂ D'₂ H₂ D₂ H₂ D'₂ (each
 *                       cycles three), then flipped by [G₂ D'₂][H'₂ D₂],
 *                       (AG)° (AD)°; they leave the wings but swap centers
 *                       two by two
 *   6. Centers again    [G₂ D'₂]³ swaps them two by two: (A,B)(G,D)
 *
 * Each formula's effect is asserted in tests/unit/pyraminx4.test.ts.
 */

const SIZE = 4
const formula = pyraFormula(SIZE)

const coTip = (vertex: PyraVertex) => ({ vertex, slice: 1 as const })
const CO_TIPS = pyraSet(coTip)
const TIPS = pyraSet((vertex) => ({ vertex, tip: true }))
const SECOND = pyraSet((vertex) => ({ vertex, slice: 2 as const }))
/** Everything but the faces: tips and the two inner slices. */
const SLICES: typeof TIPS = {
  generators: [...TIPS.generators, ...CO_TIPS.generators, ...SECOND.generators],
  turns: [...TIPS.turns, ...CO_TIPS.turns, ...SECOND.turns],
}

const isWing = (c: Cubie) => c.stickers.length === 2 && c.position.some((x) => Math.abs(x) === 3)
const isMidge = (c: Cubie) => c.stickers.length === 2 && !isWing(c)
const isCenter = (c: Cubie) => c.stickers.length === 1

const home = (cube: Cube, keep: (c: Cubie) => boolean) => {
  const right = showsFaces(faceColors(cube, SIZE))
  return cube.filter(keep).every(right)
}

// ---------------------------------------------------------------------------
// Wings: 3-cycles, one wing placed at a time
// ---------------------------------------------------------------------------

const WING_SLOTS = solvedCube('pyra4').filter(isWing)
const key = (p: Vec3) => p.join()

/**
 * Every wing 3-cycle (all 440), keyed by what it does, `a>b>c`: fan2cube's
 * four, from every side, then set up by turns (pyraCycles.ts).
 */
let cycles: Map<string, PyraMove[]> | undefined
export function wingCycles(): Map<string, PyraMove[]> {
  cycles ??= cycleTable(
    solvedCube('pyra4'),
    isWing,
    ["[H'1 D2]", "[H1 G'2]", "[H2 G'1]", "[H'2 D1]"].flatMap((f) => fromEverySide(formula(f))),
    SLICES.turns as PyraMove[],
  )
  return cycles
}

/** Place the wings one by one, each with a 3-cycle through an unplaced slot. */
function solveWings(cube: Cube): PyraMove[] {
  const faces = faceColors(cube, SIZE)
  return placeByCycles(cube, wingCycles(), (state) => {
    const wings = state.filter(isWing)
    return new Map(wings.map((w) => [key(w.position), handedHome(w, WING_SLOTS, faces)]))
  })
}

// ---------------------------------------------------------------------------
// Midges and centers: searches over fan2cube's formulas
// ---------------------------------------------------------------------------

const MIDGE_CYCLES = ["[H'2 D2]", "D2 H2 D'2 H2 D2 H2 D'2"].flatMap((f) =>
  fromEverySide(formula(f)),
)
const MIDGE_FLIPS = fromEverySide(formula("[G2 D'2][H'2 D2]"))
const CENTER_SWAPS = fromEverySide(formula("[G2 D'2][G2 D'2][G2 D'2]"))

const solveGroup = groupSolver('pyra4')

const cornersGoal = (tips: boolean) => (c: Cube) => cornersDone(c, SIZE, tips)
const centersGoal = (c: Cube) => cornersDone(c, SIZE, true) && home(c, isCenter)
const wingsGoal = (c: Cube) => centersGoal(c) && home(c, isWing)
const midgesGoal = (c: Cube) => cornersDone(c, SIZE, true) && home(c, isWing) && home(c, isMidge)

export const PYRAMINX4_PLAN: MethodPlan = [
  {
    key: 'stepCoTips',
    goal: cornersGoal(false),
    moves: CO_TIPS,
    phases: [alignCorners(SIZE, false, coTip)],
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
    moves: SECOND,
    phases: [solveGroup(isCenter, SECOND, [], 4)],
  },
  { key: 'stepWings', goal: wingsGoal, moves: SLICES, phases: [solveWings] },
  {
    key: 'stepMidges',
    goal: midgesGoal,
    moves: SLICES,
    phases: [
      solveGroup(isMidge, FORMULAS_ONLY, MIDGE_CYCLES, 6, true),
      solveGroup(isMidge, FORMULAS_ONLY, MIDGE_FLIPS, 6),
    ],
  },
  {
    key: 'stepFinishCenters',
    goal: isSolved,
    moves: SLICES,
    phases: [solveGroup(isCenter, FORMULAS_ONLY, CENTER_SWAPS, 3)],
  },
]
