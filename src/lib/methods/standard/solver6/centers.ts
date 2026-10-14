import { solvedCube } from '../../../core/cube'
import { centerSolver } from '../../../solve/centerCycles'
import { buildLibrary, DEEP, OUTER, SLICES, type Library } from '../../../solve/cycleLibrary'
import type { Cubie, Dims, Move } from '../../../core/types'
import { isInnerX, isOblique, isOuterX } from './kinds'

/**
 * 6x6 centers (centerCycles.ts): each face's sixteen, four of each kind
 * (inner and outer "x", obliques of either hand), in the color of the face
 * in the absolute frame, as on the 4x4. Each kind has its 3-cycles: the
 * slice commutators of the layer that turns it (the second for the outer
 * "x", the third for the inner one, both for the obliques).
 */

const SIX: Dims = [6, 6, 6]
const CENTERS = solvedCube('6').filter(isCenter)
function isCenter(c: Cubie) {
  return isInnerX(c) || isOuterX(c) || isOblique(c)
}

const lazy = (slices: readonly Move[], inner: readonly Move[], kind: (c: Cubie) => boolean) => {
  let library: Library | undefined
  return () => (library ??= buildLibrary(slices, OUTER, inner, CENTERS, kind, SIX))
}

export const { centersDone, solveCenters } = centerSolver({
  mechanism: SIX,
  kinds: [
    { is: isOuterX, cycles: lazy(SLICES, SLICES, isOuterX) },
    { is: isInnerX, cycles: lazy(DEEP, DEEP, isInnerX) },
    { is: isOblique, cycles: lazy([...SLICES, ...DEEP], [...SLICES, ...DEEP], isOblique) },
  ],
  slices: [...SLICES, ...DEEP],
  outer: OUTER,
})
