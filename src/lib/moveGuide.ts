import { turnDims } from './cube'
import { faceLayers } from './geometry'
import { advancedMovesFor, amountsFor, FACES, movesFor, sameLayer } from './moves'
import { methodTurns } from './solver'
import { STAR_RINGS } from './star'
import { isStar, isStarMove, SHAPE_DIMS } from './types'
import type { CubeShape, Dims, Face, Move, RingMove, StarMove, StarShape, Turn } from './types'

/**
 * The move guide: every turn a puzzle has, laid out to be learned. Each
 * layer shows its two directions side by side (`R` and `R'`, `1` and `-1`),
 * then its bigger amount (`R2`; `2` and `-2`, then `3` on a star prism, where
 * three pieces is a half turn either way). The layers are the pad's (its
 * advanced tab included), plus any a solving method turns, so the guide also
 * reads the solutions' notation.
 */

type GuideSection = 'faces' | 'middle' | 'slices' | 'wide' | 'rings' | 'slash'

export interface GuideGroup {
  readonly section: GuideSection
  /** Each row: one turn, or a turn and its opposite. */
  readonly rows: readonly (readonly Turn[])[]
}

/** What a turn does, for its sentence (see the translations). */
export type MoveDescription =
  | {
      readonly kind: 'face' | 'middle' | 'slice' | 'wide'
      readonly face: Face
      readonly turn: 'cw' | 'ccw' | 'half'
      /** A wide turn taking half the mechanism (a 4x4's Rw, a tower's). */
      readonly halfPuzzle?: true
    }
  | {
      readonly kind: 'ring'
      readonly ring: RingMove['ring']
      /** 1 to 3 pieces; 3 is a half turn, the same either way. */
      readonly pieces: 1 | 2 | 3
      readonly clockwise: boolean
    }
  | { readonly kind: 'slash' }

/** The face each middle slice of a 3-layer axis follows (M: L, E: D, S: F). */
const SLICE_FACE: Partial<Record<Face, Face>> = { R: 'L', U: 'D', B: 'F' }

const isMiddle = (move: Move, dims: Dims): boolean =>
  !!move.depth && !move.wide && faceLayers(dims, move.face) === 3

function kindOf(move: Move, dims: Dims): 'face' | 'middle' | 'slice' | 'wide' {
  if (move.wide) return 'wide'
  if (!move.depth) return 'face'
  return isMiddle(move, dims) ? 'middle' : 'slice'
}

const SECTION_OF = { face: 'faces', middle: 'middle', slice: 'slices', wide: 'wide' } as const

/** The rows of one layer: both quarter turns, then the half turn; the half
 *  turn alone where the shape has no quarter turn. */
function layerRows(shape: CubeShape, layer: Move): Move[][] {
  const amounts = amountsFor(shape, layer.face)
  const at = (amount: 1 | 2 | 3): Move => ({ ...layer, amount })
  return amounts.includes(1) ? [[at(1), at(3)], [at(2)]] : [[at(2)]]
}

function cubeGuide(shape: CubeShape): GuideGroup[] {
  const dims = SHAPE_DIMS[shape]
  const layers: Move[] = []
  for (const turn of [...movesFor(shape), ...advancedMovesFor(shape), ...methodTurns(shape)]) {
    if (isStarMove(turn)) continue
    // A middle slice is named after one face only (2R is M').
    const face = isMiddle(turn, dims) ? (SLICE_FACE[turn.face] ?? turn.face) : turn.face
    const layer: Move = { ...turn, face, amount: 1 }
    if (!layers.some((l) => sameLayer(l, layer))) layers.push(layer)
  }
  // Faces in the usual order; the middle slices as M, E, S.
  const order = (m: Move) => (isMiddle(m, dims) ? 'LDF' : FACES.join('')).indexOf(m.face)
  return (['face', 'middle', 'slice', 'wide'] as const).flatMap((kind) => {
    const rows = layers
      .filter((l) => kindOf(l, dims) === kind)
      .sort((a, b) => order(a) - order(b))
      .flatMap((l) => layerRows(shape, l))
    return rows.length ? [{ section: SECTION_OF[kind], rows }] : []
  })
}

function starGuide(shape: StarShape): GuideGroup[] {
  const ring = (r: RingMove['ring'], amount: RingMove['amount']): StarMove => ({ ring: r, amount })
  return [
    {
      section: 'rings',
      rows: STAR_RINGS[shape].flatMap((r) => [
        [ring(r, 1), ring(r, 5)],
        [ring(r, 2), ring(r, 4)],
        [ring(r, 3)],
      ]),
    },
    { section: 'slash', rows: [[{ slash: true }]] },
  ]
}

/** The guide of a shape, section by section. */
export function moveGuide(shape: CubeShape): GuideGroup[] {
  return isStar(shape) ? starGuide(shape) : cubeGuide(shape)
}

/** What a turn does on a shape. */
export function describeMove(turn: Turn, shape: CubeShape): MoveDescription {
  if (isStarMove(turn)) {
    if ('slash' in turn) return { kind: 'slash' }
    const pieces = (turn.amount > 3 ? 6 - turn.amount : turn.amount) as 1 | 2 | 3
    return { kind: 'ring', ring: turn.ring, pieces, clockwise: turn.amount <= 3 }
  }
  const direction = turn.amount === 2 ? 'half' : turn.amount === 1 ? 'cw' : 'ccw'
  const kind = kindOf(turn, SHAPE_DIMS[shape])
  // Two layers out of the mechanism's four: half of it.
  const halfPuzzle = kind === 'wide' && faceLayers(turnDims(shape), turn.face) === 4
  return { kind, face: turn.face, turn: direction, ...(halfPuzzle ? { halfPuzzle } : {}) }
}
