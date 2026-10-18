import { mapVec } from '../../core/geometry'
import { turnedBy } from '../../core/turn'
import type { Cube, Move, Vec3 } from '../../core/types'
import type { Term } from '../../teach/tutorial'
import { PYRA_CORNERS } from '../../puzzles/pyramid/pyraminx'

/**
 * The words the Pyramorphinx tutorial uses, shown first: its two kinds of
 * pieces (corners, faces' middles), a half (what turns at once), and the
 * ways of turning.
 */

const withStickers = (count: number) => (cube: Cube) =>
  cube.flatMap((c, i) => (c.stickers.length === count ? [i] : []))

/** The front face (across from the back corner), and the top half's side. */
const FRONT: Vec3 = mapVec(PYRA_CORNERS.B, (v) => -v)
const TOP: Vec3 = [0, 1, 0]

const HALF: Move = { face: 'U', amount: 1 }
const halfPieces = (cube: Cube) => cube.flatMap((_, i) => (turnedBy(cube, HALF)(i) ? [i] : []))

export const MORPH_GLOSSARY: readonly Term[] = [
  { key: 'termMorphTip', pieces: withStickers(3), from: () => FRONT },
  { key: 'termMiddle', pieces: withStickers(1), from: () => FRONT },
  { key: 'termHalf', pieces: halfPieces, from: () => TOP, demo: HALF },
  { key: 'termHalfClockwise', pieces: halfPieces, from: () => TOP, demo: HALF },
  {
    key: 'termHalfCounterclockwise',
    pieces: halfPieces,
    from: () => TOP,
    demo: { face: 'U', amount: 3 },
  },
]
