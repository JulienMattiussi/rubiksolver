import { cubeOrientations, isSolved, solvedCube } from '../../core/cube'
import { normalIndex } from '../../core/geometry'
import { GEAR_TURNS } from '../../puzzles/gear/gear'
import { allTurnsOf } from '../../core/moveSet'
import { found, searchFormulas } from '../../solve/formulaSearch'
import type { MethodPlan } from '../../solve/solverKit'
import { type Cube, type Cubie, type Face, type GearMove, type Turn } from '../../core/types'
import { conjugated, heldEveryWay, turnedFace } from '../../solve/everyWay'
import { holdingsShowing } from '../../solve/holdings'

/**
 * The Gear Cubes, "corners first", as taught on fan2cube.fr (gearcube2):
 * the page's formulas, declared once, and the plain Gear Cube's plan (the
 * Gear Cube Ultimate's method is its tutorial, lib/tutorials/gear/, which
 * plays the same formulas). Each step searches among them only, each of
 * which leaves the steps before it alone.
 *
 *   1. Corners   by any gear moves (the page: "simple et intuitif"); they
 *                tell how the solved puzzle is held, which a gear move can
 *                turn over (fan2cube's "teleportation")
 *   2. Edges     placed, two pairs swapped at a time: D⁴ (two half turns
 *                of a face: the slice a half turn) and P² D⁴ P'²
 *   3. Clips     each edge's base (its two "agrafes") turned right way
 *                round: (A² D²)³, which turns over the 8 edges of two
 *                layers in place (their gears a half turn)
 *   4. Gears     spun back home, the 4 of a slice a third of a turn at a
 *                time: D⁸
 *
 * The centers then stand right (the page: they follow the edges). In the
 * page's letters, D² is our R2: a gear move is a half turn of a face.
 *
 * The plain Gear Cube shows no clips: step 3 goes, and step 2 places each
 * edge's gear its colors' way round, D⁸ helping (a gear a half turn round
 * reads as its colors swapped, see gear.ts): its plan below.
 */

const isCorner = (c: Cubie) => c.position.every((v) => v !== 0)
const isEdge = (c: Cubie) => c.spin !== undefined
const key = (c: Cubie) => c.position.join()
const pose = (c: Cubie) =>
  c.stickers
    .map((s) => normalIndex(s.normal) + s.color)
    .sort()
    .join('')
const colors = (c: Cubie) =>
  c.stickers
    .map((s) => s.color)
    .sort()
    .join('')

/** A gear move by letter, a half turn (1) or back (3). */
const g = (gear: Face, amount: 1 | 3 = 1): GearMove => ({ gear, amount })

/** The page's formulas, as it writes them held in front (in our letters):
 *  D4, two moves of the right face (the slice beside it a half turn, two
 *  pairs of edges swapped); (A²D²)³ (the clips of eight edges swapped);
 *  D8, four moves (the slice's four gears a third of a turn). Declared once:
 *  the method plays them from every side (`GEAR_FORMULAS`), the tutorial
 *  each from a hold (lib/tutorials/gear/). */
export const GEAR_SWAP: GearMove[] = [g('R'), g('R')]
export const GEAR_CLIPS: GearMove[] = [g('F'), g('R'), g('F'), g('R'), g('F'), g('R')]
export const GEAR_SPIN: GearMove[] = [g('R'), g('R'), g('R'), g('R')]

/** A formula from every way of holding the puzzle, both ways, each once. */
const fromEverySide = (moves: readonly GearMove[]): GearMove[][] =>
  heldEveryWay(moves, (m, by) => ({ ...m, gear: turnedFace(m.gear, by) }), {
    inverses: true,
    once: true,
  })

const SWAPS = fromEverySide(GEAR_SWAP)

/** Each of the page's formulas from every side, both ways: the edges'
 *  swaps (D4, also prepared by any move: P²D4P'²), the clips', the
 *  gears'. */
export const GEAR_FORMULAS = {
  swaps: [
    ...SWAPS,
    ...conjugated(
      SWAPS,
      GEAR_TURNS.map((m) => [m]),
    ),
  ],
  clips: fromEverySide(GEAR_CLIPS),
  spins: fromEverySide(GEAR_SPIN),
}

/** The fewest of `macros` (each a formula played whole) reaching `goal`,
 *  states told apart by `look` (what the goal reads). */
const search = <T extends Turn>(
  cube: Cube,
  macros: readonly (readonly T[])[],
  goal: (c: Cube) => boolean,
  look: (c: Cube) => string,
): T[] =>
  found(
    searchFormulas(cube, macros, goal, { key: look }),
    'gear: no formula reaches the goal (an impossible puzzle)',
  )

/** The plain Gear Cube's plan: its corners, its edges placed the right
 *  way round, its gears. */
function gearPlan(): MethodPlan {
  const holdings = cubeOrientations(solvedCube('gearCube'))
  const all = allTurnsOf('gearCube')

  /** The ways of holding the solved puzzle its corners match. */
  const matching = (cube: Cube) => holdingsShowing(holdings, cube, isCorner, pose)
  const held = (cube: Cube) => new Map(matching(cube)[0]!.map((c) => [key(c), c]))
  const cornersDone = (cube: Cube) => matching(cube).length > 0
  const edgesPlaced = (cube: Cube) => {
    if (!cornersDone(cube)) return false
    const h = held(cube)
    return cube.filter(isEdge).every((c) => colors(h.get(key(c))!) === colors(c))
  }
  const clipsDone = (cube: Cube) => {
    if (!edgesPlaced(cube)) return false
    const h = held(cube)
    return cube.filter(isEdge).every((c) => pose(h.get(key(c))!) === pose(c))
  }

  const lookOf = (kind: (c: Cubie) => boolean, show: (c: Cubie) => string) => (cube: Cube) =>
    cube
      .filter(kind)
      .map((c) => key(c) + ':' + show(c))
      .sort()
      .join(' ')

  const { swaps, spins } = GEAR_FORMULAS

  return [
    {
      key: 'stepGearCorners',
      goal: cornersDone,
      moves: all,
      phases: [
        (cube) =>
          search(
            cube,
            GEAR_TURNS.map((m) => [m]),
            cornersDone,
            lookOf(isCorner, pose),
          ),
      ],
    },
    {
      key: 'stepGearEdges',
      goal: clipsDone,
      moves: all,
      phases: [
        (cube) =>
          search(
            cube,
            [...swaps, ...spins],
            clipsDone,
            lookOf(isEdge, (c) => pose(c) + c.spin),
          ),
      ],
    },
    {
      key: 'stepGearSpins',
      goal: isSolved,
      moves: all,
      phases: [
        (cube) =>
          search(
            cube,
            spins,
            isSolved,
            lookOf(isEdge, (c) => String(c.spin)),
          ),
      ],
    },
  ]
}

export const GEAR_PLAN = gearPlan()
