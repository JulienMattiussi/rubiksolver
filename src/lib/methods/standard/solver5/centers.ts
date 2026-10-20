import { solvedCube } from '../../../core/cube'
import { centerSolver } from '../../../solve/centerCycles'
import { buildLibrary, MIDDLES, OUTER, SLICES } from '../../../solve/cycleLibrary'
import { isCrossCenter, isDiagonalCenter, isFixedCenter, isMovingCenter } from './kinds'
import { once } from '../../../solve/once'

/**
 * 5x5 centers (centerCycles.ts): each face's eight moving centers (four
 * diagonal "x", four cross "+") in the color of its fixed middle one, which
 * never moves. Diagonal ones are cycled by a slice commutator, cross ones
 * by a middle-slice commutator (a slice commutator always moves diagonal
 * ones too: a slice and a row cross on a diagonal center).
 */

/** The centers a 3-cycle must leave alone, the fixed ones included. */
const CENTERS = solvedCube('5').filter((c) => isMovingCenter(c) || isFixedCenter(c))

export const { centersDone, solveCenters, placeCenter } = centerSolver({
  mechanism: [5, 5, 5],
  kinds: [
    {
      is: isDiagonalCenter,
      cycles: once(() => buildLibrary(SLICES, OUTER, SLICES, CENTERS, isDiagonalCenter)),
    },
    {
      is: isCrossCenter,
      cycles: once(() => buildLibrary(MIDDLES, OUTER, SLICES, CENTERS, isCrossCenter)),
    },
  ],
  slices: SLICES,
  outer: OUTER,
})
