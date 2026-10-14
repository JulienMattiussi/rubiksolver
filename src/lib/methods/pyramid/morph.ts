import { FACE_COLOR, isSolved, solvedCube } from '../../core/cube'
import { AXIS_ROTATIONS } from '../../core/geometry'
import { allTurnsOf } from '../../core/moveSet'
import { PYRA_CORNERS, PYRA_FACE_COLOR, PYRA_VERTICES } from '../../puzzles/pyramid/pyraminx'
import type { MethodPlan } from '../../solve/solverKit'
import type { Cube, Cubie, Move, Vec3 } from '../../core/types'
import { solveOptimal2 } from '../standard/cube2'

/**
 * Pyramorphinx, "as a Pocket", as fan2cube.fr (pyramorphinx3) shows it: its
 * 8 pieces are the 8 corners of a 2x2 and its turns a 2x2's, so it is read
 * as the 2x2 it is (each piece given its cubie's colors, turned as it
 * stands), solved by the optimal 2x2 search, and the same turns solve it.
 *
 * A face's middle is the same however it turns about its sticker: its
 * cubie's twist does not show. Each of the 81 ways to read the four middles
 * is tried until one is a real 2x2 (its corners' twists adding up to a full
 * turn); the turns solving it solve the Pyramorphinx, the middles' hidden
 * twists apart, which nothing shows (fan2cube's twist "singularity").
 */

const POCKET = solvedCube('2')

/** Where a piece belongs: a corner by the face it lacks, a face's middle by
 *  its color (the cubie its face's outward normal points to). */
function homeOf(cubie: Cubie): Vec3 | undefined {
  const colors = cubie.stickers.map((s) => s.color)
  if (colors.length === 3) {
    const v = PYRA_VERTICES.find((w) => !colors.includes(PYRA_FACE_COLOR[w]))
    return v && PYRA_CORNERS[v]
  }
  const v = PYRA_VERTICES.find((w) => PYRA_FACE_COLOR[w] === colors[0])
  return v && (PYRA_CORNERS[v].map((x) => -x) as unknown as Vec3)
}

const MORPH = solvedCube('morph')
const same = (a: Vec3, b: Vec3) => a.every((v, i) => v === b[i])

/** The whole-cube rotations carrying a piece from home to where it stands,
 *  each sticker facing as it does (one for a corner, three for a middle). */
function turnsOf(cubie: Cubie): ((v: Vec3) => Vec3)[] {
  const position = homeOf(cubie)
  const home = position && MORPH.find((c) => same(c.position, position))
  if (!home) return []
  return AXIS_ROTATIONS.filter(
    (turn) =>
      same(turn(home.position), cubie.position) &&
      home.stickers.every((s) =>
        cubie.stickers.some((t) => t.color === s.color && same(t.normal, turn(s.normal))),
      ),
  )
}

/** How a 2x2 corner is twisted: which of its stickers bears the up or down
 *  color (0: on the up-down axis; 1 or 2, by the turn from it). */
function twist(cubie: Cubie): number {
  const ud = cubie.stickers.find((s) => s.color === FACE_COLOR.U || s.color === FACE_COLOR.D)!
  if (ud.normal[1] !== 0) return 0
  const [x, y, z] = cubie.position
  const n = ud.normal
  // Which way round from the up-down face the sticker lies, seen from the
  // corner (the sum over a real 2x2 is then a whole number of turns).
  return y * (n[0] * z - n[2] * x) > 0 ? 1 : 2
}

/** The 2x2 a Pyramorphinx is, its middles read the `choice`-th way. */
function asPocket(cube: Cube, choice: number): Cube | null {
  let rest = choice
  const pocket: Cubie[] = []
  for (const cubie of cube) {
    const turns = turnsOf(cubie)
    if (turns.length === 0) return null
    let turn = turns[0]!
    if (turns.length > 1) {
      turn = turns[rest % turns.length]!
      rest = Math.floor(rest / turns.length)
    }
    const home = POCKET.find((c) => same(c.position, homeOf(cubie)!))!
    pocket.push({
      position: cubie.position,
      stickers: home.stickers.map((s) => ({ normal: turn(s.normal), color: s.color })),
    })
  }
  return pocket
}

/** The turns solving a Pyramorphinx (throws when none: an impossible one). */
function solveMorph(cube: Cube): Move[] {
  for (let choice = 0; choice < 81; choice++) {
    const pocket = asPocket(cube, choice)
    if (!pocket) break
    if (pocket.reduce((sum, c) => sum + twist(c), 0) % 3 !== 0) continue
    return solveOptimal2(pocket)
  }
  throw new Error('solveMorph: not a Pyramorphinx one can solve')
}

export const MORPH_PLAN: MethodPlan = [
  { key: 'stepAsPocket', goal: isSolved, moves: allTurnsOf('morph'), phases: [solveMorph] },
]
