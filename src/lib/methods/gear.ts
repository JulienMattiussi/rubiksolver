import { cubeOrientations, isSolved, solvedCube } from '../cube'
import { AXIS_ROTATIONS, FACE_NORMAL, faceOfNormal, normalIndex } from '../geometry'
import { GEAR_TURNS } from '../gear'
import { allTurnsOf } from '../moveSet'
import { invertMoves } from '../moves'
import type { MethodPlan } from '../solverKit'
import { applyMoves } from '../turn'
import type { Cube, Cubie, CubeShape, Face, GearMove } from '../types'

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
function fromEverySide(moves: readonly GearMove[]): GearMove[][] {
  return AXIS_ROTATIONS.map((turn) =>
    moves.map((m) => ({ ...m, gear: faceOfNormal(turn(FACE_NORMAL[m.gear])) })),
  )
}

/** The fewest of `macros` (each a formula played whole) reaching `goal`,
 *  states told apart by `look` (what the goal reads). */
function search(
  cube: Cube,
  macros: readonly (readonly GearMove[])[],
  goal: (c: Cube) => boolean,
  look: (c: Cube) => string,
): GearMove[] {
  if (goal(cube)) return []
  const seen = new Set([look(cube)])
  let frontier: { state: Cube; moves: GearMove[] }[] = [{ state: cube, moves: [] }]
  while (frontier.length) {
    const next: typeof frontier = []
    for (const { state, moves } of frontier) {
      for (const macro of macros) {
        const after = applyMoves(state, macro)
        const k = look(after)
        if (seen.has(k)) continue
        seen.add(k)
        const path = [...moves, ...macro]
        if (goal(after)) return path
        next.push({ state: after, moves: path })
      }
    }
    frontier = next
  }
  throw new Error('gear: no formula reaches the goal (an impossible puzzle)')
}

/** The plan for a Gear Cube shape. */
function gearPlan(shape: CubeShape): MethodPlan {
  const holdings = cubeOrientations(solvedCube(shape))
  const all = allTurnsOf(shape)

  /** The ways of holding the solved puzzle its corners match. */
  const matching = (cube: Cube) => {
    const at = new Map(cube.filter(isCorner).map((c) => [key(c), pose(c)]))
    return holdings.filter((h) => h.filter(isCorner).every((c) => at.get(key(c)) === pose(c)))
  }
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

  // The page's formulas, from every side, both ways.
  const twoHalves = GEAR_TURNS.map((m) => [m, m])
  const swaps = [
    ...twoHalves,
    ...GEAR_TURNS.flatMap((y) => twoHalves.map((xx) => [y, ...xx, ...invertMoves([y])])),
  ]
  const clips = [
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
    {
      key: 'stepGearEdges',
      goal: edgesPlaced,
      moves: all,
      phases: [(cube) => search(cube, swaps, edgesPlaced, lookOf(isEdge, colors))],
    },
    {
      key: 'stepGearClips',
      goal: clipsDone,
      moves: all,
      phases: [(cube) => search(cube, clips, clipsDone, lookOf(isEdge, pose))],
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

export const GEAR_ULTIMATE_PLAN = gearPlan('gearU')
