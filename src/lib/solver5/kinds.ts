import type { Cubie } from '../types'

/**
 * The 5x5's kinds of piece, told by where they belong (coordinates in
 * {-2, ..., 2}): on how many faces a slot lies (coordinates at +-2) and how
 * many of its other coordinates are 0. A turn keeps every kind in its own
 * slots, so the position always says the kind.
 */

const count = (c: Cubie, test: (v: number) => boolean) => c.position.filter(test).length
const outer = (c: Cubie) => count(c, (v) => Math.abs(v) === 2)
const zeros = (c: Cubie) => count(c, (v) => v === 0)

/** The middle piece of an edge (its "midge"). */
export const isMidge = (c: Cubie) => outer(c) === 2 && zeros(c) === 1
/** One of the two outer pieces of an edge. */
export const isWing = (c: Cubie) => outer(c) === 2 && zeros(c) === 0
/** A face's center piece: never moved but by a middle slice. */
export const isFixedCenter = (c: Cubie) => outer(c) === 1 && zeros(c) === 2
/** A center beside the middle one (the "+" of the face). */
export const isCrossCenter = (c: Cubie) => outer(c) === 1 && zeros(c) === 1
/** A center at a corner of the face's middle square (the "x"). */
export const isDiagonalCenter = (c: Cubie) => outer(c) === 1 && zeros(c) === 0
/** A center that moves: cross or diagonal. */
export const isMovingCenter = (c: Cubie) => isCrossCenter(c) || isDiagonalCenter(c)
