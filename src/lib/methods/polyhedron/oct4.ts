import { cubeOrientations, isSolved, solvedCube } from '../../core/cube'
import { buildLibrary, OUTER, placeAll, SLICES, type Library } from '../../solve/cycleLibrary'
import { allTurnsOf } from '../../core/moveSet'
import { parseMoves } from '../../core/moves'
import type { MethodPlan } from '../../solve/solverKit'
import type { Color, Cube, Cubie, Move } from '../../core/types'

/**
 * 4-Trajber's Octahedron, "corners first", as taught on fan2cube.fr
 * (4-trajber-oct2): a 4x4x4 cut to an octahedron (oct4.ts), whose kinds of
 * piece are solved one after the other, each with 3-cycles that touch
 * nothing else (cycleLibrary.ts):
 *
 *   0. Parity          a quarter turn, when the 8 face middles stand in an
 *                      odd permutation (3-cycles are even; fan2cube's
 *                      "parité" step, met there at the end)
 *   1. Corners         the 24 pieces at the octahedron's corners (the
 *                      cube's centers, fan2cube's "sommets"), three a
 *                      face, with the Super Revenge's center commutators
 *                      (T = g' H d H' g H d' H')
 *   2. Edges           the 24 along its edges (the cube's wings), three a
 *                      face, with slice commutators ([2U, L U L'])
 *   3. Face middles    the 8 triangles in the middle of the faces (the
 *                      cube's corners, fan2cube's "centres"), with a 3x3
 *                      corner commutator ([H A] P' [A H] P)
 *
 * Nothing stays fixed, so the colors each face takes are read on the face
 * middles: the way of holding the solved puzzle that matches most of them,
 * which no 3-cycle of the corners or edges changes.
 */

const SOLVED = solvedCube('oct4')
const MECHANISM = [4, 4, 4] as const
const ALL = allTurnsOf('oct4')

const threes = (c: Cubie) => c.position.filter((v) => Math.abs(v) === 3).length
const isCorner = (c: Cubie) => threes(c) === 1
const isEdge = (c: Cubie) => threes(c) === 2
const isMiddle = (c: Cubie) => threes(c) === 3

const key = (c: Cubie) => c.position.join(',')
const colorOf = (c: Cubie): Color => c.stickers[0]!.color

const HOLDINGS = cubeOrientations(SOLVED)

/** The solved puzzle held as the face middles say: the color each slot
 *  wants (the first holding matching most of them). */
function wantedColors(cube: Cube): Map<string, Color> {
  const at = new Map(cube.map((c) => [key(c), colorOf(c)]))
  let best = HOLDINGS[0]!
  let most = -1
  for (const holding of HOLDINGS) {
    const right = holding.filter((c) => isMiddle(c) && at.get(key(c)) === colorOf(c)).length
    if (right > most) [best, most] = [holding, right]
  }
  return new Map(best.map((c) => [key(c), colorOf(c)]))
}

const doneKind = (kind: (c: Cubie) => boolean) => (cube: Cube) => {
  const wanted = wantedColors(cube)
  return cube.filter(kind).every((c) => wanted.get(key(c)) === colorOf(c))
}

/** Whether the face middles stand in an even permutation of their slots
 *  (each one's color names its slot). */
function middlesEven(cube: Cube): boolean {
  const wanted = wantedColors(cube)
  const slotOf = new Map(
    [...wanted]
      .filter(([slot]) => slot.split(',').every((v) => Math.abs(Number(v)) === 3))
      .map(([slot, color]) => [color, slot]),
  )
  const goesTo = new Map(cube.filter(isMiddle).map((c) => [key(c), slotOf.get(colorOf(c))!]))
  const seen = new Set<string>()
  let swaps = 0
  for (const start of goesTo.keys()) {
    for (let slot = start, n = 0; !seen.has(slot); slot = goesTo.get(slot)!, n++) {
      seen.add(slot)
      if (n > 0) swaps++
    }
  }
  return swaps % 2 === 0
}

let libraries: Record<'corners' | 'edges' | 'middles', Library> | undefined

/** The three 3-cycle libraries, built once. */
function cycleLibraries() {
  libraries ??= {
    corners: buildLibrary(SLICES, OUTER, SLICES, SOLVED, isCorner, MECHANISM),
    edges: buildLibrary(SLICES, OUTER, OUTER, SOLVED, isEdge, MECHANISM),
    middles: buildLibrary(OUTER, OUTER, OUTER, SOLVED, isMiddle, MECHANISM),
  }
  return libraries
}

/** Bring every piece of a kind to a slot wanting its color, by 3-cycles
 *  (`placeAll`), the colors read once at the start. */
function placeKind(kind: (c: Cubie) => boolean, which: keyof NonNullable<typeof libraries>) {
  return (cube: Cube): Move[] => {
    const wanted = wantedColors(cube)
    const holds = new Map(cube.filter(kind).map((c) => [key(c), colorOf(c) as string]))
    const wants = new Map([...holds.keys()].map((slot) => [slot, wanted.get(slot)! as string]))
    return placeAll(cycleLibraries()[which], holds, wants)
  }
}

/** A quarter turn of the top: odd on the face middles. */
const PARITY = parseMoves('U')

export const OCT4_PLAN: MethodPlan = [
  {
    key: 'stepParity',
    goal: middlesEven,
    moves: ALL,
    phases: [(cube) => (middlesEven(cube) ? [] : PARITY)],
    optional: true,
  },
  {
    key: 'stepOctCorners',
    goal: doneKind(isCorner),
    moves: ALL,
    phases: [placeKind(isCorner, 'corners')],
  },
  {
    key: 'stepOctEdges',
    goal: (c) => doneKind(isCorner)(c) && doneKind(isEdge)(c),
    moves: ALL,
    phases: [placeKind(isEdge, 'edges')],
  },
  { key: 'stepOctMiddles', goal: isSolved, moves: ALL, phases: [placeKind(isMiddle, 'middles')] },
]
