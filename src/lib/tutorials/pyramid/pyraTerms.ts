import type { Cubie, PyraMove, Vec3 } from '../../core/types'
import { piecesTurnedBy, piecesWhere } from '../../teach/pieces'
import type { Term } from '../../teach/tutorial'

/**
 * The words the Pyraminx tutorial uses, shown first: its kinds of pieces
 * (tips, center pieces, edges), a layer against a tip, and the ways of
 * turning, each seen from its top corner.
 */

/** A tip, a center piece (by how far out it stands) or an edge. */
const reach = (c: Cubie) => c.position.reduce((sum, x) => sum + Math.abs(x), 0)
const kind = piecesWhere

/** The front side (across from the back corner), and the top corner. */
const FRONT: Vec3 = [1, -1, 1]
const TOP: Vec3 = [1, 1, 1]

const LAYER: PyraMove = { vertex: 'U', amount: 1 }
const TIP: PyraMove = { vertex: 'U', amount: 1, tip: true }
const layerPieces = piecesTurnedBy(LAYER)

export const PYRA_GLOSSARY: readonly Term[] = [
  {
    key: 'termTip',
    pieces: kind((c) => c.stickers.length === 3 && reach(c) > 4),
    from: () => FRONT,
    demo: TIP,
  },
  {
    key: 'termPyraCenter',
    pieces: kind((c) => c.stickers.length === 3 && reach(c) < 4),
    from: () => FRONT,
  },
  { key: 'termPyraEdge', pieces: kind((c) => c.stickers.length === 2), from: () => FRONT },
  { key: 'termLayer', pieces: layerPieces, from: () => TOP, demo: LAYER },
  { key: 'termPyraClockwise', pieces: layerPieces, from: () => TOP, demo: LAYER },
  {
    key: 'termPyraCounterclockwise',
    pieces: layerPieces,
    from: () => TOP,
    demo: { vertex: 'U', amount: 2 },
  },
]
