import { turnDims } from './cube'
import { faceLayers } from './geometry'
import { advancedMovesFor, amountsFor, FACES, movesFor, sameLayer } from './moves'
import { methodTurns } from './solver'
import {
  isOppositeFace,
  PYRA_LAYERS,
  PYRA_VERTICES,
  pyraLayerOf,
  pyraTurn,
  type PyraLayer,
} from './pyraminx'
import { GHOST_TURNS } from './ghost'
import { MEGA_FACES } from './megaminx'
import { FTO_TURNS } from './fto'
import { RAINBOW_TRIANGLES } from './rainbow'
import { signedPieces, STAR_RINGS } from './star'
import {
  isFaceMove,
  isGear,
  isGearMove,
  isGhostMove,
  isMegaminx,
  isMegaMove,
  isPuckMove,
  isPyraminx,
  isPyraMove,
  isRainbowMove,
  isStar,
  SHAPE_DIMS,
} from './types'
import type {
  CubeShape,
  Dims,
  Face,
  GearMove,
  GhostSide,
  MegaFace,
  MegaMove,
  RainbowCorner,
  RainbowMove,
  Move,
  PyraMove,
  PyraShape,
  PyraVertex,
  PuckMove,
  PuckSteps,
  RingMove,
  StarMove,
  StarShape,
  Turn,
} from './types'

/**
 * The move guide: every turn a puzzle has, laid out to be learned. Each
 * layer shows its two directions side by side (`R` and `R'`, `1` and `-1`),
 * then its bigger amount (`R2`; `2` and `-2`, then `3` on a star prism, where
 * three pieces is a half turn either way; nothing more on the Pyraminx, whose
 * turns are thirds, nor on the Floppy Ghost, whose turns are half turns).
 * The layers are the pad's (its
 * advanced tab included), plus any a solving method turns, so the guide also
 * reads the solutions' notation.
 */

type GuideSection =
  | 'faces'
  | 'middle'
  | 'slices'
  | 'wide'
  | 'rings'
  | 'slash'
  | 'sides'
  | 'triangles'
  | 'gears'
  | 'gearsThrice'
  | 'dinoCorners'
  | PyraLayer

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
      /** A wide turn taking half the mechanism (a 4x4's Rw, a 6x6's 3Rw). */
      readonly halfPuzzle?: true
      /** The third layer in (a 6x6's 3R), or three layers wide (3Rw). */
      readonly third?: true
    }
  | {
      readonly kind: 'ring'
      readonly ring: RingMove['ring']
      /** 1 to 3 pieces; 3 is a half turn, the same either way. */
      readonly pieces: 1 | 2 | 3
      readonly clockwise: boolean
    }
  | { readonly kind: 'slash' }
  | {
      /** A Pyraminx corner's layer, its tip alone, a Master's or a
       *  Professor's slice or the face opposite the corner, or the Jing's half. */
      readonly kind: 'corner' | 'tip' | 'slice' | 'opposite' | 'half'
      readonly vertex: PyraVertex
      readonly clockwise: boolean
      readonly slice?: 1 | 2 | 3 | 4
    }
  | {
      /** A Hockey Puck's layer turned some twelfths (signed: clockwise seen
       *  from above when positive), or its slash. */
      readonly kind: 'puckLayer'
      readonly layer: 'U' | 'D'
      readonly twelfths: number
    }
  | {
      readonly kind: 'puckSlash'
    }
  | {
      /** A Floppy Ghost side flipped over. */
      readonly kind: 'side'
      readonly side: GhostSide
    }
  | {
      /** A Gear Cube face's half turn, the slice beside it a quarter. */
      readonly kind: 'gear'
      readonly face: Face
      readonly clockwise: boolean
      /** Three in a row. */
      readonly thrice?: true
    }
  | {
      /** A Megaminx face turned some fifths (signed: clockwise when
       *  positive). */
      readonly kind: 'megaFace'
      readonly face: MegaFace
      readonly fifths: number
      readonly crystal?: true
    }
  | {
      /** A Rainbow triangle turned a third. */
      readonly kind: 'triangle'
      readonly triangle: RainbowCorner
      readonly clockwise: boolean
    }
  | {
      /** An FTO face turned a third, or its slice. */
      readonly kind: 'ftoFace'
      readonly triangle: RainbowCorner
      readonly clockwise: boolean
      readonly slice?: true
    }
  | {
      /** A Dino Cube corner turned a third (or a Rex Cube's). */
      readonly kind: 'dinoCorner'
      readonly corner: RainbowCorner
      readonly clockwise: boolean
      readonly rex?: true
      readonly skewb?: true
    }

/** The face each middle slice of a 3-layer axis follows (M: L, E: D, S: F). */
const SLICE_FACE: Partial<Record<Face, Face>> = { R: 'L', U: 'D', B: 'F' }

/** The middle slice of an odd axis: a 3x3's M (`2L`), a 5x5's `3R`. */
const isMiddle = (move: Move, dims: Dims): boolean =>
  !!move.depth && !move.wide && 2 * move.depth - 1 === faceLayers(dims, move.face)

/** A 3x3's middle slice, written M, E or S after the face it follows. */
const isMES = (move: Move, dims: Dims): boolean =>
  isMiddle(move, dims) && faceLayers(dims, move.face) === 3

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
    if (!isFaceMove(turn)) continue
    // A middle slice is named after one face only (2R is M').
    const face = isMES(turn, dims) ? (SLICE_FACE[turn.face] ?? turn.face) : turn.face
    const layer: Move = { ...turn, face, amount: 1 }
    if (!layers.some((l) => sameLayer(l, layer))) layers.push(layer)
  }
  // Faces in the usual order; the middle slices as M, E, S.
  const order = (m: Move) => (isMES(m, dims) ? 'LDF' : FACES.join('')).indexOf(m.face)
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

/** Each kind of layer (the Pyraminx's layers then tips; the Master's tips
 *  then slices), every corner, both ways. */
function pyraGuide(shape: PyraShape): GuideGroup[] {
  return PYRA_LAYERS[shape].map((layer) => ({
    // The last slice is a face: under the faces' heading.
    section: isOppositeFace(shape, layer) ? 'faces' : layer,
    rows: PYRA_VERTICES.map((vertex) =>
      ([1, 2] as const).map((amount): PyraMove => pyraTurn(vertex, layer, amount)),
    ),
  }))
}

/** The Dino's corners: the top's, then the bottom's (front right first). */
const DINO_CORNERS: readonly RainbowCorner[] = ['U', 'u', 'l', 'L', 'R', 'r', 'd', 'D']

/** The guide of a shape, section by section. */
export function moveGuide(shape: CubeShape): GuideGroup[] {
  if (isStar(shape)) return starGuide(shape)
  if (shape === 'ghost') return [{ section: 'sides', rows: GHOST_TURNS.map((turn) => [turn]) }]
  if (shape === 'puck') {
    const layer = (layer: 'U' | 'D'): PuckMove[][] =>
      [1, 2, 3].map((k): PuckMove[] => [
        { layer, steps: k as PuckSteps },
        { layer, steps: (12 - k) as PuckSteps },
      ])
    return [
      { section: 'rings', rows: [...layer('U'), ...layer('D')] },
      { section: 'slash', rows: [[{ flip: true }]] },
    ]
  }
  if (isGear(shape)) {
    const row = (gear: Face) => ([1, 3] as const).map((amount): GearMove => ({ gear, amount }))
    // The Extreme's top and bottom turn as a 3x3's, the sides by gears.
    const plain = shape === 'gearX' ? (['U', 'D'] as const) : []
    const gears = FACES.filter((f) => !(plain as readonly Face[]).includes(f))
    // Then each three times in a row: the gears go round, the cube is back.
    return [
      ...(plain.length
        ? [
            {
              section: SECTION_OF.face,
              rows: plain.flatMap((face) => layerRows(shape, { face, amount: 1 })),
            },
          ]
        : []),
      { section: 'gears', rows: gears.map(row) },
      { section: 'gearsThrice', rows: gears.map((gear) => [{ gear, amount: 1, times: 3 }]) },
    ]
  }
  if (isMegaminx(shape)) {
    // A fifth either way, then two.
    const rows = MEGA_FACES.flatMap((megaFace) =>
      [[1, 4] as const, [2, 3] as const].map((amounts) =>
        amounts.map((amount): MegaMove => ({
          megaFace,
          amount,
          ...(shape === 'crystal' && { crystal: true }),
        })),
      ),
    )
    return [{ section: 'faces', rows }]
  }
  if (shape === 'rainbow') {
    const row = (triangle: RainbowCorner) =>
      ([1, 2] as const).map((amount): RainbowMove => ({ triangle, amount }))
    return [{ section: 'triangles', rows: RAINBOW_TRIANGLES.map(row) }]
  }
  if (shape === 'fto') {
    const row = (turn: RainbowMove) =>
      ([1, 2] as const).map((amount): RainbowMove => ({ ...turn, amount }))
    // As the pad: the top face and the three beside it, the bottom's.
    const faces: RainbowCorner[] = ['U', 'u', 'R', 'L', 'd', 'D', 'r', 'l']
    const slices = FTO_TURNS.filter((m) => m.amount === 1 && m.slice)
    return [
      { section: 'faces', rows: faces.map((triangle) => row({ triangle, amount: 1, fto: true })) },
      { section: 'middle', rows: slices.map(row) },
    ]
  }
  if (shape === 'dino' || shape === 'rex' || shape === 'skewbU') {
    const rex =
      shape === 'rex' ? { rex: true as const } : shape === 'skewbU' ? { skewb: true as const } : {}
    const row = (triangle: RainbowCorner) =>
      ([1, 2] as const).map((amount): RainbowMove => ({ triangle, amount, dino: true, ...rex }))
    return [{ section: 'dinoCorners', rows: DINO_CORNERS.map(row) }]
  }
  return isPyraminx(shape) ? pyraGuide(shape) : cubeGuide(shape)
}

/** What a turn does on a shape. */
export function describeMove(turn: Turn, shape: CubeShape): MoveDescription {
  if (isGhostMove(turn)) return { kind: 'side', side: turn.side }
  if (isPuckMove(turn)) {
    if ('flip' in turn) return { kind: 'puckSlash' }
    const twelfths = turn.steps > 6 ? turn.steps - 12 : turn.steps
    return { kind: 'puckLayer', layer: turn.layer, twelfths }
  }
  if (isGearMove(turn)) {
    const base = { kind: 'gear', face: turn.gear, clockwise: turn.amount === 1 } as const
    return turn.times ? { ...base, thrice: true } : base
  }
  if (isRainbowMove(turn)) {
    if (turn.fto) {
      const base = {
        kind: 'ftoFace',
        triangle: turn.triangle,
        clockwise: turn.amount === 1,
      } as const
      return turn.slice ? { ...base, slice: true } : base
    }
    return turn.dino
      ? {
          kind: 'dinoCorner',
          corner: turn.triangle,
          clockwise: turn.amount === 1,
          ...(turn.rex && { rex: true as const }),
          ...(turn.skewb && { skewb: true as const }),
        }
      : { kind: 'triangle', triangle: turn.triangle, clockwise: turn.amount === 1 }
  }
  if (isPyraMove(turn)) {
    const layer = pyraLayerOf(turn)
    const kind =
      layer === 'tips'
        ? 'tip'
        : layer === 'corners'
          ? 'corner'
          : layer === 'deep'
            ? 'half'
            : isPyraminx(shape) && isOppositeFace(shape, layer)
              ? 'opposite'
              : 'slice'
    const clockwise = turn.amount === 1
    return { kind, vertex: turn.vertex, clockwise, ...(turn.slice && { slice: turn.slice }) }
  }
  if (isMegaMove(turn)) {
    const fifths = turn.amount <= 2 ? turn.amount : turn.amount - 5
    return { kind: 'megaFace', face: turn.megaFace, fifths, ...(turn.crystal && { crystal: true }) }
  }
  if (!isFaceMove(turn)) {
    if ('slash' in turn) return { kind: 'slash' }
    const pieces = Math.abs(signedPieces(turn)) as 1 | 2 | 3
    return { kind: 'ring', ring: turn.ring, pieces, clockwise: turn.amount <= 3 }
  }
  const direction = turn.amount === 2 ? 'half' : turn.amount === 1 ? 'cw' : 'ccw'
  const kind = kindOf(turn, SHAPE_DIMS[shape])
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
