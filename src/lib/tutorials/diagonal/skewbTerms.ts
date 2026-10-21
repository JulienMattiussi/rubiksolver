import type { Vec3 } from '../../core/types'
import { parse } from '../../methods/shared/skewbKit'
import { piecesTurnedBy, piecesWhere } from '../../teach/pieces'
import type { Term } from '../../teach/tutorial'

/**
 * The words the Skewb tutorial uses, shown first, each defined before
 * another uses it: its kinds of pieces (corners, centers) and the two ways
 * a corner turns, seen from the bottom front right corner (`B`).
 */

const FRONT: Vec3 = [0, 0, 1]
const CORNER: Vec3 = [1, -1, 1]

const [TURN] = parse('B')
const [BACK] = parse("B'")
const turned = piecesTurnedBy(TURN!)

export const SKEWB_GLOSSARY: readonly Term[] = [
  {
    key: 'termSkewbCorner',
    pieces: piecesWhere((c) => c.stickers.length === 3),
    from: () => FRONT,
  },
  {
    key: 'termSkewbCenter',
    pieces: piecesWhere((c) => c.stickers.length === 1),
    from: () => FRONT,
  },
  { key: 'termSkewbClockwise', pieces: turned, from: () => CORNER, demo: TURN! },
  { key: 'termSkewbCounterclockwise', pieces: turned, from: () => CORNER, demo: BACK! },
]
