import type { GearMove, Vec3 } from '../../core/types'
import { piecesTurnedBy, piecesWhere } from '../../teach/pieces'
import type { Term } from '../../teach/tutorial'

/**
 * The words the Gear Cube Ultimate tutorial uses, shown first: its corners
 * and centers, its edges (a gear on its two clips), the move (a half turn
 * of a face, the slice beside it a quarter) and its two ways, each defined
 * before another uses it.
 */

const FRONT: Vec3 = [0, 0, 1]
const RIGHT: Vec3 = [1, 0, 0]

const MOVE: GearMove = { gear: 'R', amount: 1 }
const corners = piecesWhere((c) => c.stickers.length === 3)
const centers = piecesWhere((c) => c.stickers.length === 1)
const edges = piecesWhere((c) => c.spin !== undefined)
const moved = piecesTurnedBy(MOVE)

export const GEAR_GLOSSARY: readonly Term[] = [
  { key: 'termGearCorner', pieces: corners, from: () => FRONT },
  { key: 'termGearCenter', pieces: centers, from: () => FRONT },
  // An edge shown by its gear, its clips by themselves: each word lights
  // what it names (the clips lie by the center, and would seem part of it).
  { key: 'termGearEdge', pieces: edges, from: () => FRONT, part: 'gear' },
  { key: 'termGearClip', pieces: edges, from: () => FRONT, part: 'clips' },
  { key: 'termGearMove', pieces: moved, from: () => RIGHT, demo: MOVE },
  // The ways a face turns: the cube's words (a face seen turning), a move
  // shown each way.
  { key: 'termClockwise', pieces: moved, from: () => RIGHT, demo: MOVE },
  { key: 'termCounterclockwise', pieces: moved, from: () => RIGHT, demo: { ...MOVE, amount: 3 } },
]
