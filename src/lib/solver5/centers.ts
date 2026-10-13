import { solvedCube } from '../cube'
import { centerSolver } from '../centerCycles'
import { buildLibrary, MIDDLES, OUTER, SLICES, type Library } from '../cycleLibrary'
import { isCrossCenter, isDiagonalCenter, isFixedCenter, isMovingCenter } from './kinds'

/**
 * 5x5 centers (centerCycles.ts): each face's eight moving centers (four
 * diagonal "x", four cross "+") in the color of its fixed middle one, which
 * never moves. Diagonal ones are cycled by a slice commutator, cross ones
 * by a middle-slice commutator.
 */

/** The centers a 3-cycle must leave alone, the fixed ones included. */
const CENTERS = solvedCube('5').filter((c) => isMovingCenter(c) || isFixedCenter(c))

const lazy = (build: () => Library) => {
  let library: Library | undefined
  return () => (library ??= build())
}

export const { centersDone, solveCenters } = centerSolver({
  mechanism: [5, 5, 5],
  kinds: [
    {
      is: isDiagonalCenter,
      cycles: lazy(() => buildLibrary(SLICES, OUTER, SLICES, CENTERS, isDiagonalCenter)),
    },
    {
      is: isCrossCenter,
      cycles: lazy(() => buildLibrary(MIDDLES, OUTER, SLICES, CENTERS, isCrossCenter)),
    },
  ],
  slices: SLICES,
  outer: OUTER,
})
