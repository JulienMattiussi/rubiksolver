import { cubeOrientations, isSolved, solvedCube } from '../../core/cube'
import { normalIndex } from '../../core/geometry'
import { GEAR_TURNS } from '../../puzzles/gear/gear'
import { allTurnsOf } from '../../core/moveSet'
import { invertMoves } from '../../core/moves'
import { found, searchFormulas } from '../../solve/formulaSearch'
import type { MethodPlan } from '../../solve/solverKit'
import { type Cube, type Cubie, type Face, type GearMove, type Turn } from '../../core/types'
import { hasColoredClips, type CubeShape } from '../../core/shapes'
import { heldEveryWay, turnedFace } from '../../solve/everyWay'
import { holdingsShowing } from '../../solve/holdings'

/**
 * Gear Cube, "corners first", as taught on fan2cube.fr (gearcube2): each
 * step searches among the page's formulas only, each of which leaves the
 * steps before it alone.
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
 * reads as its colors swapped, see gear.ts).
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

/** A formula as seen from every way of holding the puzzle. */
const fromEverySide = (moves: readonly GearMove[]): GearMove[][] =>
  heldEveryWay(moves, (m, by) => ({ ...m, gear: turnedFace(m.gear, by) }))

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

/** The plan for a Gear Cube shape. */
function gearPlan(shape: CubeShape): MethodPlan {
  const holdings = cubeOrientations(solvedCube(shape))
  const all = allTurnsOf(shape)

  /** The ways of holding the solved puzzle its corners match. */
  const matching = (cube: Cube) => holdingsShowing(holdings, cube, isCorner, pose)
  const held = (cube: Cube) => new Map(matching(cube)[0]!.map((c) => [key(c), c]))
  const cornersDone = (cube: Cube) => matching(cube).length > 0
  const edgesPlaced = (cube: Cube) => {
    if (!cornersDone(cube)) return false
    const h = held(cube)
    return cube.filter(isEdge).every((c) => colors(h.get(key(c))!) === colors(c))
  }
  const clips = hasColoredClips(shape)
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

  // The page's formulas, from every side, both ways.
  const twoHalves = GEAR_TURNS.map((m) => [m, m])
  const swaps = [
    ...twoHalves,
    ...GEAR_TURNS.flatMap((y) => twoHalves.map((xx) => [y, ...xx, ...invertMoves([y])])),
  ]
  const clipFormulas = [
    ...fromEverySide([g('F'), g('R'), g('F'), g('R'), g('F'), g('R')]),
    ...fromEverySide([g('F', 3), g('R', 3), g('F', 3), g('R', 3), g('F', 3), g('R', 3)]),
  ]
  const spins = GEAR_TURNS.map((m) => [m, m, m, m])

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
    clips
      ? {
          key: 'stepGearEdges',
          goal: edgesPlaced,
          moves: all,
          phases: [(cube) => search(cube, swaps, edgesPlaced, lookOf(isEdge, colors))],
        }
      : {
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
    ...(clips
      ? [
          {
            key: 'stepGearClips',
            goal: clipsDone,
            moves: all,
            phases: [(cube: Cube) => search(cube, clipFormulas, clipsDone, lookOf(isEdge, pose))],
          },
        ]
      : []),
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

export const GEAR_PLAN = gearPlan('gearCube')
export const GEAR_ULTIMATE_PLAN = gearPlan('gearU')
