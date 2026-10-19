import { turnedBy } from '../../core/turn'
import type { Cube, Move, Vec3 } from '../../core/types'
import type { Term } from '../../teach/tutorial'

/**
 * The words the 4x4 tutorial adds to the cubes': its four centers a face,
 * its wings (half an edge), an edge (two wings paired), an inner slice.
 */

const withStickers = (count: number) => (cube: Cube) =>
  cube.flatMap((c, i) => (c.stickers.length === count ? [i] : []))

const FRONT: Vec3 = [0, 0, 1]
const FRONT_RIGHT: Vec3 = [1, 0, 1]

/** An inner slice: the one beside the right face. */
const SLICE: Move = { face: 'R', amount: 1, depth: 2 }
const slicePieces = (cube: Cube) => cube.flatMap((_, i) => (turnedBy(cube, SLICE)(i) ? [i] : []))

export const CENTER4: Term = { key: 'termCenter4', pieces: withStickers(1), from: () => FRONT }
export const WING: Term = { key: 'termWing', pieces: withStickers(2), from: () => FRONT_RIGHT }
export const EDGE4: Term = { key: 'termEdge4', pieces: withStickers(2), from: () => FRONT_RIGHT }
export const INNER: Term = {
  key: 'termInner',
  pieces: slicePieces,
  from: () => FRONT_RIGHT,
  demo: SLICE,
}
