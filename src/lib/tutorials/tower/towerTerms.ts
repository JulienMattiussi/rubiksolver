import type { Cube, Move, Vec3 } from '../../core/types'
import { barOf, isCorner, isMiddle } from '../../methods/tower/tower'
import { piecesTurnedBy, piecesWhere } from '../../teach/pieces'
import type { Term } from '../../teach/tutorial'

/**
 * The words the towers' tutorials use, shown first, each defined before
 * another uses it. The 2x2x4's: its corners and middles, a bar, its two
 * Pockets, a wide turn and an outer one, and the two ways of turning. The
 * Slim Tower's (2x2x3): its corners and edges, a turn of its middle, and
 * the two ways of turning.
 */

const FRONT: Vec3 = [0, 0, 1]
const ABOVE: Vec3 = [1, 1, 1]

const WIDE: Move = { face: 'R', amount: 1, depth: 2, wide: true }
const TOP: Move = { face: 'U', amount: 1 }
const TOP_HALF: Move = { face: 'U', amount: 1, depth: 2, wide: true }
const MIDDLE: Move = { face: 'U', amount: 1, depth: 2 }

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

/** The Slim Tower's: its corners, the edges of its middle, its middle
 *  turned alone, and the two ways of turning. */
export const SLIM_GLOSSARY: readonly Term[] = [
  { key: 'termTowerCorner', pieces: corners, from: () => FRONT },
  { key: 'termSlimEdge', pieces: middles, from: () => FRONT },
  { key: 'termSlimMiddle', pieces: piecesTurnedBy(MIDDLE), from: () => FRONT, demo: MIDDLE },
  { key: 'termClockwise', pieces: piecesTurnedBy(TOP), from: () => ABOVE, demo: TOP },
  {
    key: 'termCounterclockwise',
    pieces: piecesTurnedBy(TOP),
    from: () => ABOVE,
    demo: { ...TOP, amount: 3 },
  },
]
