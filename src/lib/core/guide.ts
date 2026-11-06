import { amountsFor } from './moves'
import type {
  CopterEdge,
  Face,
  GhostSide,
  MegaFace,
  Move,
  PyraVertex,
  RainbowCorner,
  RingMove,
  Turn,
} from './types'
import type { CubeShape } from './shapes'
import type { PyraLayer } from '../puzzles/pyramid/pyraminx'

/**
 * What the move guide (app/moveGuide.ts) shows and says: its sections of
 * turns, which a puzzle's model lays out when it does not turn as a cube
 * (`PuzzleModel.guide`), and what each turn does, which its kind of moves
 * says (`MoveKind.describe`) and the translations put in words.
 */

type GuideSection =
  | 'faces'
  | 'middle'
  | 'slices'
  | 'wide'
  | 'rings'
  | 'slash'
  | 'sides'
  | 'edges'
  | 'triangles'
  | 'gears'
  | 'gearsThrice'
  | 'dinoCorners'
  | PyraLayer

/** What a corner's turn takes along, on a puzzle turning by corners: its
 *  three edges (the Dino Cube's), with centers and petals (the Rex Cube's),
 *  the whole half on its side (the Skewbs'), its outer layer (the Master
 *  Skewb's). */
export type CornerTakes = 'edges' | 'petals' | 'half' | 'layer'

export interface GuideGroup {
  readonly section: GuideSection
  /** Each row: one turn, or a turn and its opposite. */
  readonly rows: readonly (readonly Turn[])[]
}

/** Which way a quarter-turning layer goes, seen from its side. */
export type TurnSense = 'cw' | 'ccw' | 'half'

/** A face turn's amount as its sense. */
export const senseOf = (amount: 1 | 2 | 3): TurnSense =>
  amount === 2 ? 'half' : amount === 1 ? 'cw' : 'ccw'

/** What a turn does, for its sentence (see the translations, which say
 *  each kind's in a table: i18n/moveSentences.ts). */
export type MoveDescription =
  | {
      /** `whole`: the puzzle itself turned (x, y, z), as `face` turns. */
      readonly kind: 'face' | 'middle' | 'slice' | 'wide' | 'whole'
      readonly face: Face
      readonly turn: TurnSense
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
      readonly kind: 'pyra'
      readonly part: 'corner' | 'tip' | 'slice' | 'opposite' | 'half'
      readonly vertex: PyraVertex
      readonly clockwise: boolean
      readonly slice?: 1 | 2 | 3 | 4
    }
  | {
      /** A Hockey Puck's or a Square-1's layer turned some twelfths (signed:
       *  clockwise when positive, the top seen from above, the bottom from
       *  below), or its slash. */
      readonly kind: 'sectorLayer'
      readonly layer: 'U' | 'D'
      readonly twelfths: number
    }
  | {
      readonly kind: 'sectorSlash'
    }
  | {
      /** A Floppy Ghost side flipped over. */
      readonly kind: 'side'
      readonly side: GhostSide
    }
  | {
      /** A face's layers on a puzzle that names them its own way: a side's
       *  block (a Fashion-V's), a half (its H*, a Meffert's Pocket Cube's
       *  halves), a thin layer, or the one under it. */
      readonly kind: 'layers'
      readonly face: Face
      readonly layer: 'block' | 'half' | 'thin' | 'inner'
      readonly turn: TurnSense
    }
  | {
      /** A Curvy Copter edge's half turn (`iii`: the Curvy Copter III's,
       *  centers and petals too). */
      readonly kind: 'copterEdge'
      readonly edge: CopterEdge
      readonly iii?: true
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
      /** The whole puzzle turned as it turns. */
      readonly whole?: true
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
      /** A corner turned a third (the Dino Cube's and those cut from it),
       *  what it takes along as its puzzle says, or with `slice` the inner
       *  layer of its diagonal (the Master Skewb's). */
      readonly kind: 'dinoCorner'
      readonly corner: RainbowCorner
      readonly clockwise: boolean
      readonly takes: CornerTakes
      readonly slice?: true
    }

/** The rows of one face layer: both quarter turns, then the half turn; the
 *  half turn alone where the shape has no quarter turn (unless `unlocked`).
 *  Read when called: moves.ts loads after the models. */
export function layerRows(shape: CubeShape, layer: Move, unlocked = false): Move[][] {
  const amounts = amountsFor(shape, layer.face, unlocked)
  const at = (amount: 1 | 2 | 3): Move => ({ ...layer, amount })
  return amounts.includes(1) ? [[at(1), at(3)], [at(2)]] : [[at(2)]]
}

/** Where the guide looks from to show a turn, by its kind
 *  (`MoveKind.sight`): the home framing (`home`), mirrored so a face's
 *  layer faces the camera (`face`), pulled toward where the turning part
 *  looks on a puzzle drawn in its own frame (`toward`), from beside an axis
 *  a little above it (`beside`), or swung round to an axis's side at the
 *  home height (`around`). */
export type GuideSight =
  | { readonly kind: 'home' }
  | { readonly kind: 'face'; readonly face: Face }
  | { readonly kind: 'toward'; readonly direction: readonly number[] }
  | { readonly kind: 'beside'; readonly axis: readonly number[] }
  | { readonly kind: 'around'; readonly axis: readonly number[] }
