import type { Cube, Move, Vec3 } from '../../core/types'
import { barOf, isCorner, isMiddle } from '../../methods/tower/tower'
import { piecesTurnedBy, piecesWhere } from '../../teach/pieces'
import type { Term } from '../../teach/tutorial'

/**
 * The words the 2x2x4 tower tutorial uses, shown first, each defined before
 * another uses it: its corners and middles, a bar, its two Pockets, a wide
 * turn and an outer one, and the two ways of turning.
 */

const FRONT: Vec3 = [0, 0, 1]
const ABOVE: Vec3 = [1, 1, 1]

const WIDE: Move = { face: 'R', amount: 1, depth: 2, wide: true }
const TOP: Move = { face: 'U', amount: 1 }
const TOP_HALF: Move = { face: 'U', amount: 1, depth: 2, wide: true }

const corners = piecesWhere(isCorner)
const middles = piecesWhere(isMiddle)

/** A bar: the first corner and the middle beside it. */
const aBar = (cube: Cube) => barOf(cube, cube.findIndex(isCorner))

export const TOWER_GLOSSARY: readonly Term[] = [
  { key: 'termTowerCorner', pieces: corners, from: () => FRONT },
  { key: 'termTowerMiddle', pieces: middles, from: () => FRONT },
  { key: 'termTowerBar', pieces: aBar, from: () => ABOVE },
  { key: 'termTowerInner', pieces: middles, from: () => FRONT },
  { key: 'termTowerOuter', pieces: corners, from: () => FRONT },
  { key: 'termTowerWide', pieces: piecesTurnedBy(WIDE), from: () => FRONT, demo: WIDE },
  // Its demo plays on the tower solved, where the top is always a full square.
  { key: 'termTowerTop', pieces: piecesTurnedBy(TOP), from: () => ABOVE, demo: TOP },
  { key: 'termClockwise', pieces: piecesTurnedBy(TOP_HALF), from: () => ABOVE, demo: TOP_HALF },
  {
    key: 'termCounterclockwise',
    pieces: piecesTurnedBy(TOP_HALF),
    from: () => ABOVE,
    demo: { ...TOP_HALF, amount: 3 },
  },
]
