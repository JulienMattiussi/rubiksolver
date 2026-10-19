import { moveSet } from '../../core/moveSet'
import { found, searchFormulas } from '../../solve/formulaSearch'
import type { MethodPlan, StepSpec } from '../../solve/solverKit'
import type { Cube, Move } from '../../core/types'
import { piecesHome } from './pieces3'

/**
 * The 3x3's methods all take the centers as their frame (yellow down, white
 * up). The middle slices (M, E, S, on the pad's advanced tab) move them,
 * but only as a turn of the whole cube does: the centers keep their places
 * one to another. So a plan starts by turning the cube in one's hands until
 * they are home (no face turned): an empty step, dropped, when they are.
 */

const CENTERS = ['U', 'D', 'L', 'R', 'F', 'B']

export const centersHome = (cube: Cube): boolean => piecesHome(cube, CENTERS)

/** The whole cube turned (x, y, z), each way. */
const ROTATIONS = moveSet('x y z')

/** The fewest rotations of the whole cube bringing a frame home (none
 *  needed: empty); any way to hold a cube is two rotations away at most
 *  (null: no rotation does, the frame being no rigid one). */
export function turnHome(cube: Cube, home: (cube: Cube) => boolean = centersHome): Move[] | null {
  return searchFormulas(
    cube,
    ROTATIONS.turns.map((t) => [t as Move]),
    home,
    { depth: 2 },
  )
}

/** A plan's first step: the cube turned until its frame (`home`) holds. */
export const holdStep = (home: (cube: Cube) => boolean): StepSpec => ({
  key: 'stepHoldCube',
  goal: home,
  moves: ROTATIONS,
  phases: [(cube) => found(turnHome(cube, home), 'its frame cannot be turned home')],
  optional: true,
})

/** A 3x3 plan, preceded by the cube held with its centers home. */
export function withCentersHome(plan: MethodPlan): MethodPlan {
  return [holdStep(centersHome), ...plan]
}
