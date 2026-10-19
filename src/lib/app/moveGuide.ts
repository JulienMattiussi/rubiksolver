import { turnDims } from '../core/cube'
import { faceLayers } from '../core/geometry'
import { layerRows, type GuideGroup, type MoveDescription } from '../core/guide'
import { isFaceTurn, kindOf } from '../core/moveKind'
import { advancedMovesFor, FACES, movesFor, sameLayer } from '../core/moves'
import { MODELS } from '../puzzles/models'
import { methodTurns } from '../solve/solver'
import { isFaceMove, SHAPE_DIMS } from '../core/types'
import type { CubeShape, Dims, Face, Move, Turn } from '../core/types'

/**
 * The move guide: every turn a puzzle has, laid out to be learned. Each
 * layer shows its two directions side by side (`R` and `R'`, `1` and `-1`),
 * then its bigger amount (`R2`; `2` and `-2`, then `3` on a star prism, where
 * three pieces is a half turn either way; nothing more on the Pyraminx, whose
 * turns are thirds, nor on the Floppy Ghost, whose turns are half turns).
 * A puzzle that does not turn as a cube lays out its own guide (its model's
 * `guide`, puzzles/guides.ts); a cube's layers are the pad's (its advanced
 * tab included), plus any a solving method turns, so the guide also reads
 * the solutions' notation.
 */

/** The face each middle slice of a 3-layer axis follows (M: L, E: D, S: F). */
const SLICE_FACE: Partial<Record<Face, Face>> = { R: 'L', U: 'D', B: 'F' }

/** The middle slice of an odd axis: a 3x3's M (`2L`), a 5x5's `3R`. */
const isMiddle = (move: Move, dims: Dims): boolean =>
  !!move.depth && !move.wide && 2 * move.depth - 1 === faceLayers(dims, move.face)

/** A 3x3's middle slice, written M, E or S after the face it follows. */
const isMES = (move: Move, dims: Dims): boolean =>
  isMiddle(move, dims) && faceLayers(dims, move.face) === 3

function layerOf(move: Move, dims: Dims): 'face' | 'middle' | 'slice' | 'wide' {
  if (move.wide) return 'wide'
  if (!move.depth) return 'face'
  return isMiddle(move, dims) ? 'middle' : 'slice'
}

const SECTION_OF = { face: 'faces', middle: 'middle', slice: 'slices', wide: 'wide' } as const

function cubeGuide(shape: CubeShape): GuideGroup[] {
  const dims = SHAPE_DIMS[shape]
  const layers: Move[] = []
  const pad = movesFor(shape)
  for (const turn of [...pad, ...advancedMovesFor(shape), ...methodTurns(shape)]) {
    if (!isFaceMove(turn)) continue
    // A middle slice is named after one face only (2R is M'), unless the pad
    // names it (the 4x4x3's middle layer, 2U).
    const named = pad.some((m) => isFaceMove(m) && sameLayer(m, turn))
    const face = isMES(turn, dims) && !named ? (SLICE_FACE[turn.face] ?? turn.face) : turn.face
    const layer: Move = { ...turn, face, amount: 1 }
    if (!layers.some((l) => sameLayer(l, layer))) layers.push(layer)
  }
  // Faces in the usual order; the middle slices as M, E, S.
  const order = (m: Move) => (isMES(m, dims) ? 'LDF' : FACES.join('')).indexOf(m.face)
  return (['face', 'middle', 'slice', 'wide'] as const).flatMap((kind) => {
    const rows = layers
      .filter((l) => layerOf(l, dims) === kind)
      .sort((a, b) => order(a) - order(b))
      .flatMap((l) => layerRows(shape, l))
    return rows.length ? [{ section: SECTION_OF[kind], rows }] : []
  })
}

/** The guide of a shape, section by section: its model's, or its layers. */
export function moveGuide(shape: CubeShape): readonly GuideGroup[] {
  return MODELS[shape]?.guide?.() ?? cubeGuide(shape)
}

/** What a turn does on a shape: as its model says, else its kind of moves,
 *  else a cube's layer. */
export function describeMove(turn: Turn, shape: CubeShape): MoveDescription {
  const own = MODELS[shape]?.describe
  if (own) return own(turn)
  if (!isFaceTurn(turn)) return kindOf(turn)!.describe(turn, shape)
  const direction = turn.amount === 2 ? 'half' : turn.amount === 1 ? 'cw' : 'ccw'
  const kind = turn.whole ? 'whole' : layerOf(turn, SHAPE_DIMS[shape])
  // Two layers out of the mechanism's four (three of six): half of it.
  const depth = turn.depth ?? 1
  const halfPuzzle = kind === 'wide' && 2 * depth === faceLayers(turnDims(shape), turn.face)
  const third = (kind === 'slice' || kind === 'wide') && depth === 3
  return {
    kind,
    face: turn.face,
    turn: direction,
    ...(halfPuzzle ? { halfPuzzle } : third ? { third } : {}),
  }
}
