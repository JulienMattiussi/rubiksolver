import { turnedBy } from '../../core/turn'
import type { Cube, Cubie, Move, Vec3 } from '../../core/types'
import {
  isFixedCenter,
  isMidge,
  isMovingCenter,
  isWing,
} from '../../methods/standard/solver5/kinds'
import type { Term } from '../../teach/tutorial'

/**
 * The words the big cubes' tutorials add to the cubes': the 4x4's four
 * centers a face, its wings (half an edge), an edge (two wings paired), an
 * inner slice; the 5x5's fixed center and the eight around it, its middle
 * edge and the two wings beside it, an edge (the three of them); a super
 * cube's centers' borders. Pieces are told by where they stand, not by
 * their stickers (a super cube's centers have more than one).
 */

const piecesWhere = (is: (c: Cubie) => boolean) => (cube: Cube) =>
  cube.flatMap((c, i) => (is(c) ? [i] : []))
/** The pieces on `faces` faces of the cube (a center on one, an edge on
 *  two), the outer layer read on the cube. */
const onFaces = (faces: number) => (cube: Cube) => {
  const reach = Math.max(...cube.map((c) => Math.max(...c.position.map(Math.abs))))
  return piecesWhere((c) => c.position.filter((v) => Math.abs(v) === reach).length === faces)(cube)
}

const FRONT: Vec3 = [0, 0, 1]
const FRONT_RIGHT: Vec3 = [1, 0, 1]

/** An inner slice: the one beside the right face. */
const SLICE: Move = { face: 'R', amount: 1, depth: 2 }
const slicePieces = (cube: Cube) => cube.flatMap((_, i) => (turnedBy(cube, SLICE)(i) ? [i] : []))
const inner = (key: string): Term => ({
  key,
  pieces: slicePieces,
  from: () => FRONT_RIGHT,
  demo: SLICE,
})

export const CENTER4: Term = { key: 'termCenter4', pieces: onFaces(1), from: () => FRONT }
export const WING: Term = { key: 'termWing', pieces: onFaces(2), from: () => FRONT_RIGHT }
export const EDGE4: Term = { key: 'termEdge4', pieces: onFaces(2), from: () => FRONT_RIGHT }
export const INNER = inner('termInner')

// The 5x5's pieces (solver5/kinds.ts).
export const FIXED_CENTER: Term = {
  key: 'termFixedCenter',
  pieces: piecesWhere(isFixedCenter),
  from: () => FRONT,
}
export const CENTER5: Term = {
  key: 'termCenter5',
  pieces: piecesWhere(isMovingCenter),
  from: () => FRONT,
}
export const MIDGE: Term = {
  key: 'termMidge',
  pieces: piecesWhere(isMidge),
  from: () => FRONT_RIGHT,
}
export const WING5: Term = {
  key: 'termWing5',
  pieces: piecesWhere(isWing),
  from: () => FRONT_RIGHT,
}
export const EDGE5: Term = { key: 'termEdge5', pieces: onFaces(2), from: () => FRONT_RIGHT }
export const INNER5 = inner('termInner5')

/** A super cube's centers, each bordered. */
export const BORDER: Term = { key: 'termBorder', pieces: onFaces(1), from: () => FRONT }
