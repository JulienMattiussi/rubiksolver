import type { Color, Dims, Face } from '../core/types'
import type { CubeVariant, InnerTurn } from '../core/shapes'

/** The families of puzzles turning by their own kind of moves (see
 *  core/moveKind.ts). */
export type MoveFamily = 'star' | 'pyra' | 'ghost' | 'puck' | 'rainbow' | 'mega' | 'gear' | 'copter'

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
  | 'puck'
  | 'mega'
  | 'crystal'
  | 'fto'
  | 'rainbow'
  | 'dino'
  | 'rex'
  | 'skewb'
  | 'masterSkewb'
  | 'gear'

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
  /** Its name in the address (`#/fr/floppy-ghost`, see route.ts), the same
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
  /** Turns offered apart and never scrambled (see `SHAPE_ADVANCED_TURNS`). */
  readonly advanced?: readonly ('slice' | 'wide')[]
  /** Sold as a mirror puzzle too (see `supportsMirror`). */
  readonly mirror?: true
  /** Its camera scan was tried on the real puzzle and works (elsewhere,
   *  the button says it is untried: see `SHAPE_SCAN_TRIED`). */
  readonly scanTried?: true
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
