import type { Cubie } from '../../../core/types'

/**
 * The 6x6's kinds of piece, told by where they belong (coordinates in
 * {-5, -3, -1, 1, 3, 5}): on how many faces a slot lies (coordinates at
 * +-5), and the sizes of its other coordinates. A turn keeps every kind in
 * its own slots, so the position always says the kind.
 */

const outer = (c: Cubie) => c.position.filter((v) => Math.abs(v) === 5).length
const inner = (c: Cubie) => c.position.map(Math.abs).filter((v) => v !== 5)

/** An edge's outer wing (beside a corner). */
export const isOuterWing = (c: Cubie) => outer(c) === 2 && inner(c)[0] === 3
/** An edge's inner wing (by the middle). */
export const isInnerWing = (c: Cubie) => outer(c) === 2 && inner(c)[0] === 1
const isCenter = (c: Cubie) => outer(c) === 1
const sizes = (c: Cubie) => inner(c).sort().join()
/** A center at a corner of the face's middle 2x2 (the inner "x"). */
export const isInnerX = (c: Cubie) => isCenter(c) && sizes(c) === '1,1'
/** A center at a corner of the face's middle 4x4 (the outer "x"). */
export const isOuterX = (c: Cubie) => isCenter(c) && sizes(c) === '3,3'
/** An oblique center (either hand). */
export const isOblique = (c: Cubie) => isCenter(c) && sizes(c) === '1,3'
