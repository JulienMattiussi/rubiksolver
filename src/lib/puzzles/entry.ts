import type { Color, CubeColor, Dims, Face, Move } from '../core/types'
import type { CubeVariant, InnerTurn, SliceLetters } from '../core/shapes'

/** How a mirror puzzle looks (lib/core/shape.ts): its layers' thicknesses
 *  by the color they stand for (opposite ones adding up to 2, a middle
 *  layer's 1), and the finish all its stickers wear. */
export interface MirrorLook {
  readonly thickness: Record<CubeColor, number>
  readonly finish: 'gold' | 'silver'
}

/** How a mirror scans by its stickers' sizes (lib/editor/scan/sized.ts):
 *  round its center, which gives the scale and names the face by its
 *  depth (`center`: the 3x3's, sizedRead.ts), or round where the four
 *  stickers of a face meet, held any way (`cross`: the Qiyi 2x2's,
 *  crossRead.ts). */
export type MirrorScan = 'center' | 'cross'

/** The families of puzzles turning by their own kind of moves (see
 *  core/moveKind.ts). */
export type MoveFamily =
  'star' | 'pyra' | 'ghost' | 'sectors' | 'rainbow' | 'mega' | 'gear' | 'copter'

/** A group of a pad's face turns, under its title (`padGroups`): the
 *  Fashion-V's and Meffert's Pocket Cube's (components/controls/LayerPad.tsx). */
export type LayerGroup = {
  readonly key: 'blocks' | 'thin' | 'halves' | 'byA'
  readonly layers: readonly Omit<Move, 'amount'>[]
}

/** The pad of turns a puzzle shows (components/controls/padFor.tsx): its
 *  faces' unless it turns otherwise ('vto': its faces' too, its corners,
 *  wide, before its tips). */
export type PadKind =
  | 'faces'
  | 'vto'
  | 'star'
  | 'pyra'
  | 'ghost'
  | 'copter'
  | 'fashion'
  | 'purple'
  | 'sectors'
  | 'mega'
  | 'crystal'
  | 'fto'
  | 'rainbow'
  | 'dino'
  | 'rex'
  | 'skewb'
  | 'ivy'
  | 'masterSkewb'
  | 'gear'

/** What a camera scan cannot see (see `PuzzleEntry.scanUnseen`). */
export type ScanUnseen = 'sideCenters' | 'centerMarks'

/** What to do to the puzzle before a camera scan (see
 *  `PuzzleEntry.scanBefore`). */
export type ScanBefore = 'alignGears'

/** The hint the editor gives, when not the usual one (EditPanel.tsx). */
export type EditHint = 'twist' | 'camo' | 'roadblock' | 'quarter' | 'gear' | 'gearPlain'

/**
 * A puzzle's card: what the app knows of it besides its own module (how it
 * is built, turns and is solved: models.ts) and its drawing
 * (three/puzzles). Each category's cards are in its folder's catalog.ts.
 */
export interface PuzzleEntry {
  /** Its name in the picker, the same in every language. */
  readonly label: string
  /** Its name in the address (`/fr/floppy-ghost`, see route.ts), the same
   *  in every language, so a link works whatever the reader's. */
  readonly slug: string
  /** Layer counts along x, y and z (the box of one without a grid). */
  readonly dims: Dims
  /** Turns in a scramble. */
  readonly scramble: number
  /** It leaves its box (see `SHAPE_SHIFTS`). */
  readonly shifts?: true
  /** Inner layers its mechanism turns (see `SHAPE_INNER_TURNS`). */
  readonly inner?: readonly InnerTurn[]
  /** Its middle slices named otherwise than the 3x3's (see
   *  `SHAPE_SLICE_LETTERS`). */
  readonly slices?: SliceLetters
  /** Turns offered apart and never scrambled (see `SHAPE_ADVANCED_TURNS`). */
  readonly advanced?: readonly ('slice' | 'wide')[]
  /** Sold as a mirror puzzle too, as the Mirror Blocks are (`true`), or
   *  only as one, of its own look (see `supportsMirror`, `mirrorOnly`). */
  readonly mirror?: true | MirrorLook
  /** Its camera scan was tried on the real puzzle and works (elsewhere,
   *  the button says it is untried: see `SHAPE_SCAN_TRIED`). */
  readonly scanTried?: true
  /** What its camera scan cannot see, its colors telling nothing of it
   *  (a Windmill's side centers' way round, shown by their shape; a
   *  Quarter Cube's centers' marks): the
   *  editor asks to check it after a scan. */
  readonly scanUnseen?: ScanUnseen
  /** What to do to it before a scan, which then takes it so (a Gear
   *  Cube's gears lined up: their pivots at rest, `toggles` cleared). */
  readonly scanBefore?: ScanBefore
  /** Its mirror scanned by the sizes of its stickers (see `MirrorScan`). */
  readonly mirrorScan?: MirrorScan
  /** Its colors where its real puzzle differs from the standard scheme. */
  readonly scheme?: Partial<Record<Face, Color>>
  /** Its pad of turns, when not its faces'. */
  readonly pad?: PadKind
  /** The kind of turns it makes, its own (none: a grid's face layers):
   *  built and turned by its family's module, drawn from polygons. */
  readonly moves?: MoveFamily
  /** A Gear Cube whose clips bear colors (the Ultimate, the Extreme): they
   *  turn over apart from their gears. */
  readonly coloredClips?: true
  /** Shown in front of its category's tile in the picker (else its
   *  category's first puzzle). */
  readonly cover?: true
  /** Shown on the home page's gallery, in this variant. */
  readonly home?: CubeVariant
  /** Its editor's hint, when not the usual one. */
  readonly editHint?: EditHint
}
