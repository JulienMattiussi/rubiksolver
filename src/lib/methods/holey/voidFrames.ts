import { FACE_COLOR, solvedCube } from '../../core/cube'
import { AXIS_ROTATIONS, faceOfNormal } from '../../core/geometry'
import type { MethodPlan } from '../../solve/solverKit'
import { applyMoves } from '../../core/turn'
import type { Color, Cube, Cubie, Turn } from '../../core/types'

/**
 * The Void Cube read as a 3x3: without centers, their colors are chosen,
 * any of the 24 ways of holding the solved puzzle (fan2cube.fr/voidcube2:
 * "la signature des centres = la signature des arêtes"). A quarter turn of
 * the colors cycles the edges by three 4-cycles (odd) and the corners by
 * two (even), so half the choices leave a "singularity" (two edges to
 * swap, which no 3x3 needs) and the other half none: a 3x3 method plays as
 * it is with centers of the second half. A slice (Roux's M) turns four
 * edges and no corner, a singularity each time: on a 3x3 it turns four
 * centers too, which make up for it. The centers chosen may then stand
 * as the method's slices leave them (`centerSets`).
 */

const SOLVED = solvedCube('void')
const CENTERS = solvedCube('3').filter((c) => c.stickers.length === 1)

/** Each way of holding it: each color renamed to the standard one of the
 *  face it is on then. */
const RENAMES: Map<Color, Color>[] = AXIS_ROTATIONS.map(
  (turn) =>
    new Map(
      SOLVED.flatMap((c) =>
        c.stickers.map((s) => [s.color, FACE_COLOR[faceOfNormal(turn(s.normal))]] as const),
      ),
    ),
)

/** The 3x3 the Void Cube is, held one way: its colors renamed, these
 *  centers added. */
const asCube = (cube: Cube, rename: Map<Color, Color>, centers: Cube): Cube => [
  ...cube.map((c) => ({
    ...c,
    stickers: c.stickers.map((s) => ({ ...s, color: rename.get(s.color)! })),
  })),
  ...centers,
]

/** Where a plan's turns can bring the centers (home alone without a
 *  slice or a wide turn; Roux's M, four ways). */
function centerSets(plan: MethodPlan): Cube[] {
  const turns = plan.flatMap((spec) => spec.moves.turns)
  const lookOf = (centers: Cube) =>
    centers.map((c) => c.position.join() + c.stickers[0]!.normal.join()).join('|')
  const found = new Map<string, Cube>([[lookOf(CENTERS), CENTERS]])
  let frontier: Cube[] = [CENTERS]
  while (frontier.length) {
    frontier = frontier.flatMap((centers) =>
      turns.flatMap((turn) => {
        const next = applyMoves(centers, [turn], [3, 3, 3])
        const look = lookOf(next)
        if (found.has(look)) return []
        found.set(look, next)
        return [next]
      }),
    )
  }
  return [...found.values()]
}

const colorsOf = (c: Cubie) =>
  c.stickers
    .map((s) => s.color)
    .sort()
    .join()

/** Whether the pieces of a kind are oddly permuted (each piece's home
 *  found by its colors). */
function oddly(cube: Cube, kind: (c: Cubie) => boolean): boolean {
  const solved = solvedCube('3').filter(kind)
  const home = new Map(solved.map((c, i) => [colorsOf(c), i]))
  const slot = new Map(solved.map((c, i) => [c.position.join(), i]))
  const next = new Map(
    cube.filter(kind).map((c) => [slot.get(c.position.join())!, home.get(colorsOf(c))!]),
  )
  const seen = new Set<number>()
  let odd = false
  for (const start of next.keys()) {
    let length = 0
    for (let i = start; !seen.has(i); i = next.get(i)!) {
      seen.add(i)
      length++
    }
    if (length > 0 && length % 2 === 0) odd = !odd
  }
  return odd
}

/** No singularity: as a 3x3's, the edges permuted as the corners and the
 *  centers together (their centers home: as the corners). */
export const regular = (cube: Cube): boolean =>
  oddly(cube, (c) => c.stickers.length === 2) ===
  (oddly(cube, (c) => c.stickers.length === 3) !== oddly(cube, (c) => c.stickers.length === 1))

/** How many stickers already show the color of their face. */
const rightStickers = (cube: Cube) =>
  cube.reduce(
    (n, c) => n + c.stickers.filter((s) => s.color === FACE_COLOR[faceOfNormal(s.normal)]).length,
    0,
  )

/** The 3x3s it can be read as (its centers among `centers`), without
 *  singularity, those `fits` keeps, the nearest solved first. */
function readings(cube: Cube, centers: readonly Cube[], fits: (held: Cube) => boolean): Cube[] {
  return RENAMES.flatMap((rename) => centers.map((set) => asCube(cube, rename, set)))
    .filter((held) => regular(held) && fits(held))
    .sort((a, b) => rightStickers(b) - rightStickers(a))
}

/**
 * A 3x3 plan on the Void Cube: each step works on the 3x3 it can be read
 * as, its centers chosen without singularity and so that the step before
 * holds (the steps set the colors from the first one on), its phases all
 * on the same; its goal holds when some such reading meets it.
 */
export function voidPlan(plan: MethodPlan): MethodPlan {
  const centers = centerSets(plan)
  return plan.map((spec, k) => {
    const done = (held: Cube) => k === 0 || plan[k - 1]!.goal(held)
    return {
      ...spec,
      goal: (cube: Cube) => readings(cube, centers, spec.goal).length > 0,
      // The step's phases on one reading: the next would choose again.
      phases: [
        (cube: Cube) => {
          let held = readings(cube, centers, done)[0]!
          const moves: Turn[] = []
          for (const phase of spec.phases) {
            const more = phase(held)
            held = applyMoves(held, more)
            moves.push(...more)
          }
          return moves
        },
      ],
    }
  })
}
