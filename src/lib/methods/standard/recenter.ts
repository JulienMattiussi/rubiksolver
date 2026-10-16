import { moveSet } from '../../core/moveSet'
import { solvePieces } from '../../solve/pieceSearch'
import type { MethodPlan } from '../../solve/solverKit'
import type { Cube, Move } from '../../core/types'
import { homeOf, piecesHome } from './pieces3'

/**
 * The 3x3's methods all take the centers as their frame (yellow down, white
 * up). The middle slices (M, E, S, on the pad's advanced tab) move them, so a
 * 3x3 plan starts by putting them back, with those slices: an empty step,
 * dropped, when they never moved.
 */

const CENTERS = ['U', 'D', 'L', 'R', 'F', 'B']
const SLICE_TURNS = moveSet('M E S')

export const centersHome = (cube: Cube): boolean => piecesHome(cube, CENTERS)

/** The slice turns putting the centers back. */
export function recenter(cube: Cube): Move[] {
  return solvePieces(cube, { track: CENTERS.map(homeOf), moves: SLICE_TURNS, maxDepth: 6 })
}

/** A 3x3 plan, preceded by the centers put back in place. */
export function withCentersHome(plan: MethodPlan): MethodPlan {
  return [
    {
      key: 'stepRecenter',
      goal: centersHome,
      moves: SLICE_TURNS,
      phases: [recenter],
      optional: true,
    },
    ...plan,
  ]
}
